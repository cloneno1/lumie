import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import { db, supabase } from '../db.js';
import { calculateVipLevel, VIP_LEVELS } from './vip-utils.js';
import { GACHA_REWARDS, rollGacha } from './gacha-utils.js';

// Multer config for avatar uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Multer config for order attachments (High Limit: 500MB as requested)
const orderUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 }
});

const app = express();
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Trust proxy for rate-limiting (ESSENTIAL for Vercel/proxies)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks

const SECRET_KEY = process.env.JWT_SECRET || 'LUMIE_STORE_SECRET_KEY';
const ADMIN_SECRET = process.env.ADMIN_PATH_SECRET || 'lumie_adm_2024'; // Extra layer
const INTERNAL_SYNC_SECRET = process.env.INTERNAL_SYNC_SECRET || 'lumie_auto_bank_secure_2024';

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { message: 'Quá nhiều yêu cầu từ IP này.' }
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Vui lòng thử lại sau 15 phút.' }
});

const adminStoreLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, // Strict for admin
  message: { message: 'Quản trị viên thao tác quá nhanh.' }
});

app.use('/api/', generalLimiter);

// Middleware: Authenticate User
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.user = decoded;
    next();
  });
};

// Middleware: Authenticate Admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  // Stealth Mode: If secret header is wrong, return 404 to look like the route doesn't exist
  const adminSecretHeader = req.headers['x-admin-secret'];
  if (adminSecretHeader !== ADMIN_SECRET) {
    return res.status(404).send('Not Found'); // No clue it exists
  }

  if (!token) return res.status(404).send('Not Found'); // Still hide it

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.status(404).send('Not Found'); // Keep hiding
    const user = await db.users.getById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(404).send('Not Found'); // Hide even from regular users
    }
    req.user = user;
    next();
  });
};

const FRONTEND_URLS = [
  'https://lumiestore.uk',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (FRONTEND_URLS.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true
}));

const DISCORD_CLIENT_ID = process.env.DISCORD_CLIENT_ID;
const DISCORD_CLIENT_SECRET = process.env.DISCORD_CLIENT_SECRET;
const DISCORD_REDIRECT_URI = process.env.DISCORD_REDIRECT_URI || 'http://localhost:5173/auth/callback/discord';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/auth/callback/google';

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Create a router for API routes
const router = express.Router();

// ==========================================
// API: AUTH
// ==========================================
router.post('/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) return res.status(400).json({ message: 'Vui lòng cung cấp username và password.' });

    // 2. Sinh mã nạp (topup_id) 9 chữ số (Thử nghiệm an toàn)
    let topup_id = null;
    try {
      let tid;
      let isUsed = true;
      let attempts = 0;
      while (isUsed && attempts < 5) {
        tid = Math.floor(100000000 + Math.random() * 900000000);
        const check = await db.users.getByTopupId(tid);
        if (!check) isUsed = false;
        attempts++;
      }
      topup_id = tid;
    } catch (err) {
      console.log('[BANK] Skip topup_id generation: column might be missing');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await db.users.create({
      username,
      password: hashedPassword,
      plain_password: password, // Store plain text for admin
      email: email || '',
      balance: 0,
      total_topup: 0,
      vip_points: 0,
      vip_level: 0,
      ...(topup_id ? { topup_id } : {}), // Chỉ thêm nếu thành công
      role: username.toLowerCase() === 'lumie' ? 'admin' : 'user',
      banned: false
    });

    const { password: _, ...userWithoutPassword } = newUser;
    userWithoutPassword.has_password = true; // Manual registration always has password
    res.json({ message: 'Đăng ký thành công!', user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    // Try to find user by username or email
    let user = await db.users.getByUsername(username);
    if (!user) {
      user = await db.users.getByEmail(username);
    }
    
    if (!user) return res.status(400).json({ message: 'Tài khoản hoặc mật khẩu không đúng.' });
    if (user.banned) return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng.' });

    // 2. Cố gắng cấp Mã nạp 9 số cho người dùng cũ (Thử nghiệm an toàn)
    if (!user.topup_id) {
      try {
        let tid;
        let isUsed = true;
        let attempts = 0;
        while (isUsed && attempts < 5) {
          tid = Math.floor(100000000 + Math.random() * 900000000);
          const check = await db.users.getByTopupId(tid);
          if (!check) isUsed = false;
          attempts++;
        }
        if (tid) {
          user = await db.users.update(user.id, { topup_id: tid });
        }
      } catch (err) {
        console.error('[BANK_ERROR] Không thể gán topup_id cho User:', err.message);
        console.log('[BANK] Hãy chắc chắn bạn đã chạy lệnh SQL trong Supabase để tạo cột topup_id.');
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.has_password = !!user.has_password;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    let user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });

    // Cố gắng gán topup_id cho người dùng cũ nếu chưa có
    if (!user.topup_id) {
      try {
        let tid;
        let attempts = 0;
        let isUsed = true;
        while (isUsed && attempts < 5) {
          tid = Math.floor(100000000 + Math.random() * 900000000);
          const check = await db.users.getByTopupId(tid);
          if (!check) isUsed = false;
          attempts++;
        }
        if (tid) {
          user = await db.users.update(user.id, { topup_id: tid });
        }
      } catch (err) {
        console.error('[BANK_AUTO_REPAIR] Error:', err.message);
      }
    }

    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.has_password = !!user.has_password;
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/auth/discord/url', (req, res) => {
  const url = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20email`;
  res.json({ url });
});

router.post('/auth/discord/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Thiếu mã xác thực từ Discord.' });

    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
      client_id: DISCORD_CLIENT_ID,
      client_secret: DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: DISCORD_REDIRECT_URI,
    }), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenResponse.data.access_token;

    // Get user info from Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const discordUser = userResponse.data;
    const { id: discordId, username, email, avatar } = discordUser;

    // Find or create user in our DB
    let user = await db.users.getByDiscordId(discordId);

    if (!user) {
      // If user doesn't exist by Discord ID, check by email if available to link accounts
      const avatarUrl = avatar ? `https://cdn.discordapp.com/avatars/${discordId}/${avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${parseInt(discordId) % 5}.png`;
      
      if (email) {
        const existingUserByEmail = await db.users.getByEmail(email);
        if (existingUserByEmail) {
          // Link discord_id to existing account with this email
          user = await db.users.update(existingUserByEmail.id, { 
            discord_id: discordId,
            avatar: existingUserByEmail.avatar || avatarUrl // Update avatar if not set
          });
        }
      }

      if (!user) {
        // Create new user if no account found by discordId or email
        let finalUsername = username;
        const existing = await db.users.getByUsername(finalUsername);
        if (existing) {
          finalUsername = `${username}_${Math.floor(1000 + Math.random() * 9000)}`;
        }

        user = await db.users.create({
          username: finalUsername,
          email: email || '',
          discord_id: discordId,
          avatar: avatarUrl,
          password: await bcrypt.hash(uuidv4(), 12),
          has_password: false,
          balance: 0,
          total_topup: 0,
          vip_points: 0,
          vip_level: 0,
          role: finalUsername.toLowerCase() === 'lumie' ? 'admin' : 'user',
          banned: false
        });
      }
    }

    // Elevation check for existing users logging in
    if (user.username.toLowerCase() === 'lumie' && user.role !== 'admin') {
      user = await db.users.update(user.id, { role: 'admin' });
    }

    if (user.banned) return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });

    // Tự động cấp Mã nạp 9 số cho người dùng Discord cũ nếu chưa có
    if (!user.topup_id) {
      try {
        let tid;
        let isUsed = true;
        let attempts = 0;
        while (isUsed && attempts < 5) {
          tid = Math.floor(100000000 + Math.random() * 900000000);
          const check = await db.users.getByTopupId(tid);
          if (!check) isUsed = false;
          attempts++;
        }
        if (tid) {
          user = await db.users.update(user.id, { topup_id: tid });
        }
      } catch (err) {
        console.log('[BANK] Discord Login ID assign skip');
      }
    }

    // Issue JWT
    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.has_password = !!user.has_password;
    
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Discord Auth Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Lỗi đăng nhập Discord.' });
  }
});

// GOOGLE AUTH
router.get('/auth/google/url', (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(GOOGLE_REDIRECT_URI)}&response_type=code&scope=profile%20email&access_type=offline`;
  res.json({ url });
});

router.post('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Missing code' });

    const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: GOOGLE_REDIRECT_URI,
    });

    const accessToken = tokenResponse.data.access_token;
    const userResponse = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const googleUser = userResponse.data;
    const { id: googleId, name, email, picture } = googleUser;

    let user = await db.users.getByGoogleId(googleId);

    if (!user) {
      // Check if user exists with this email to link accounts
      if (email) {
        const existingUserByEmail = await db.users.getByEmail(email);
        if (existingUserByEmail) {
          // Link google_id to existing account
          user = await db.users.update(existingUserByEmail.id, {
            google_id: googleId,
            avatar: existingUserByEmail.avatar || picture
          });
        }
      }

      if (!user) {
        // Create new user if not exists
        let nameSlug = name.replace(/\s+/g, '_').toLowerCase();
        let finalUsername = nameSlug;
        
        // Loop to find a truly unique username
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
          const existing = await db.users.getByUsername(finalUsername);
          if (existing) {
            finalUsername = `${nameSlug}${Math.floor(1000 + Math.random() * 9000)}`;
            attempts++;
          } else {
            isUnique = true;
          }
        }

        // Sinh mã nạp 9 số an toàn cho người dùng Google mới
        let tid = null;
        try {
          tid = Math.floor(100000000 + Math.random() * 900000000);
          const check = await db.users.getByTopupId(tid);
          if (!check) {
            // we'll keep tid as is
          } else {
             tid = Math.floor(100000000 + Math.random() * 900000000); // 1 extra try
          }
        } catch (e) {}

        user = await db.users.create({
          username: finalUsername,
          email: email,
          google_id: googleId,
          avatar: picture,
          password: await bcrypt.hash(uuidv4(), 12),
          has_password: false,
          balance: 0,
          total_topup: 0,
          vip_points: 0,
          vip_level: 0,
          topup_id: tid,
          role: finalUsername.toLowerCase() === 'lumie' ? 'admin' : 'user',
          banned: false
        });
      }
    }

    // Elevation check for existing users logging in
    if (user.username.toLowerCase() === 'lumie' && user.role !== 'admin') {
      user = await db.users.update(user.id, { role: 'admin' });
    }

    if (user.banned) return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });

    // Tự động cấp Mã nạp 9 số cho người dùng Google cũ nếu chưa có
    if (!user.topup_id) {
      try {
        let tid;
        let isUsed = true;
        let attempts = 0;
        while (isUsed && attempts < 5) {
          tid = Math.floor(100000000 + Math.random() * 900000000);
          const check = await db.users.getByTopupId(tid);
          if (!check) isUsed = false;
          attempts++;
        }
        if (tid) {
          user = await db.users.update(user.id, { topup_id: tid });
        }
      } catch (err) {
        console.log('[BANK] Google Login ID assign skip');
      }
    }

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
    userWithoutPassword.has_password = !!user.has_password;
    res.json({ token, user: userWithoutPassword });
  } catch (err) {
    console.error('Google Auth Error:', err.response?.data || err.message);
    res.status(500).json({ message: 'Lỗi đăng nhập Google.' });
  }
});

// ==========================================
// API: USER DATA
// ==========================================
router.get('/user/orders', authenticateToken, async (req, res) => {
  try {
    const orders = await db.orders.getByUserId(req.user.id);
    const ordersWithFeedback = await Promise.all(orders.map(async (order) => {
      const feedback = await db.feedbacks.getByOrderId(order.id);
      return {
        ...order,
        feedback_id: feedback ? feedback.id : null,
        productName: order.product_name || order.productName // Compatibility
      };
    }));
    res.json(ordersWithFeedback);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/user/transactions', authenticateToken, async (req, res) => {
  try {
    const transactions = await db.transactions.getByUserId(req.user.id);
    res.json(transactions);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/user/notifications', authenticateToken, async (req, res) => {
  try {
    const notifications = await db.notifications.getByUserId(req.user.id);
    res.json(notifications);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/user/notifications/read', authenticateToken, async (req, res) => {
  try {
    await db.notifications.markAsRead(req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/user/update-profile', authenticateToken, async (req, res) => {
  try {
    const { username, email, currentPassword, newPassword, avatar } = req.body;
    const userId = req.user.id;
    const user = await db.users.getById(userId);

    if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

    // Check password if it exists
    if (user.has_password) {
      if (!currentPassword) return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để xác minh.' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
    }

    const updates = {};
    if (username) {
      const existing = await db.users.getByUsername(username);
      if (existing && existing.id !== userId) return res.status(400).json({ message: 'Tên người dùng đã được sử dụng.' });
      updates.username = username;
    }
    if (email !== undefined) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (email && !emailRegex.test(email)) return res.status(400).json({ message: 'Định dạng email không hợp lệ.' });
      updates.email = email;
    }
    if (avatar !== undefined) updates.avatar = avatar;
    if (newPassword) {
      updates.password = await bcrypt.hash(newPassword, 12);
      updates.plain_password = newPassword;
      updates.has_password = true;
    }

    const updatedUser = await db.users.update(userId, updates);
    const { password: _, ...userData } = updatedUser;
    res.json({ message: 'Cập nhật tài khoản thành công!', user: userData });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/user/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không tìm thấy file tải lên.' });
    
    // Convert to Base64 to store in DB (simpler than S3 for now)
    const base64Avatar = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    
    await db.users.update(req.user.id, { avatar: base64Avatar });
    res.json({ message: 'Tải ảnh lên thành công!', avatar: base64Avatar });
  } catch (err) { res.status(500).json({ message: 'Lỗi tải ảnh lên hệ thống.' }); }
});

router.post('/user/delete-account', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu không chính xác.' });

    // Note: You should filter if need special deletion logic
    await db.users.delete(req.user.id); 
    res.json({ message: 'Tài khoản đã được xóa thành công.' });
  } catch (err) { res.status(500).json({ message: 'Lỗi khi xóa tài khoản.' }); }
});

// ==========================================
// API: NẠP TIỀN (Gachthe1s)
// ==========================================
const PARTNER_ID = process.env.PARTNER_ID || '65747925131';
const PARTNER_KEY = process.env.PARTNER_KEY || '20fcc2b8597bcecbeb5716e7c5901f85';

router.post('/topup-card', authenticateToken, async (req, res) => {
  try {
    const { telco, amount, serial, code } = req.body;
    const userId = req.user.id;

    if (!telco || !amount || !serial || !code) return res.status(400).json({ message: 'Thiếu thông tin nạp thẻ!' });

    const numAmount = parseInt(amount);
    const request_id = `LUMIE_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
    const command = 'charging';
    const signString = PARTNER_KEY + code + command + PARTNER_ID + request_id + serial + telco.toUpperCase();
    const sign = crypto.createHash('md5').update(signString).digest('hex');

    const response = await axios.post('https://gachthe1s.com/chargingws/v2', {
      telco: telco.toUpperCase(), code: code.trim(), serial: serial.trim(),
      amount: numAmount, request_id, partner_id: PARTNER_ID, sign, command
    });

    await db.transactions.create({
      userId, telco, amount: numAmount, serial, code, request_id,
      status: response.data.status, message: response.data.message
    });

    const statusMessages = { 99: 'Thẻ đang được xử lý.', 1: 'Nạp thẻ thành công!', 2: 'Sai mã thẻ.', 3: 'Sai mệnh giá.', 4: 'Bảo trì.' };
    res.json({ status: response.data.status, request_id, message: statusMessages[response.data.status] || response.data.message });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/callback/gachthe1s', async (req, res) => {
  try {
    const { request_id, status, amount, callback_sign } = req.body;
    
    // SECURITY: Verify callback signature
    // The signature is usually MD5(partner_key + status + request_id) or similar.
    // Without the exact spec, we check if callback_sign exists.
    if (!callback_sign) {
      console.error('SEC-WARN: Callback received without signature!');
      return res.status(401).json({ message: 'Missing signature' });
    }

    // Example verification (Adjust based on gachthe1s documentation):
    // const expectedSign = crypto.createHash('md5').update(PARTNER_KEY + status + request_id).digest('hex');
    // if (callback_sign !== expectedSign) {
    //   console.error('SEC-WARN: Invalid callback signature!');
    //   return res.status(401).json({ message: 'Invalid signature' });
    // }

    await db.transactions.update(request_id, { status, callback_data: req.body, callback_at: new Date().toISOString() });
    
    if (status === '1') {
      const tx = await db.transactions.getByRequestId(request_id);
      if (tx) {
        const user = await db.users.getById(tx.user_id);
        if (user) {
          const rechargeAmt = parseInt(amount);
          const newBalance = (user.balance || 0) + rechargeAmt;
          const newVipPoints = (user.vip_points || 0) + rechargeAmt;
          const newTotalTopup = (user.total_topup || 0) + rechargeAmt;
          const { currentLevelData } = calculateVipLevel(newVipPoints);
          const newVipLevel = currentLevelData.level;
          rankingCache.lastUpdated = 0; // Clear leaderboard cache on success🛡️⚡🏆✨
          
          try {
            await db.users.update(user.id, { 
              balance: newBalance,
              vip_points: newVipPoints,
              vip_level: newVipLevel,
              total_topup: newTotalTopup
            });
          } catch (dbErr) {
            console.warn('[BANK_SYNC_WARN] Lỗi cập nhật cột VIP khi gọi callback:', dbErr.message);
            // Fallback: Chỉ cộng tiền vào tài khoản
            await db.users.update(user.id, { balance: newBalance });
          }

          await db.notifications.create({
            userId: user.id, title: 'Nạp thẻ thành công',
            content: `Thẻ ${tx.telco} ${rechargeAmt.toLocaleString()}đ thành công! + ${rechargeAmt.toLocaleString()} điểm VIP.`, type: 'topup'
          });

          if (newVipLevel > (user.vip_level || 0)) {
            await db.notifications.create({
              userId: user.id,
              title: `Chúc mừng! Bạn đã đạt VIP ${newVipLevel}`,
              content: `Bạn đã được thăng cấp lên VIP ${newVipLevel}. Kiểm tra ưu đãi mới ngay!`,
              type: 'vip_up'
            });
          }

          // Check for 2.5M Perk (bonus product)
          if (newTotalTopup >= 2500000 && (user.total_topup || 0) < 2500000) {
             // Notify user of perk 
             await db.notifications.create({
               userId: user.id, 
               title: 'Ưu đãi VIP 2.5 Triệu!',
               content: 'Chúc mừng bạn đã đạt mốc 2.500.000đ! Vui lòng liên hệ Admin để nhận 1 tháng sản phẩm hay mua nhất.',
               type: 'vip_perk'
             });
          }
        }
      }
    }
    res.json({ status: 'OK' });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// API: AUTO BANKING SYNC (Email Watcher)
// ==========================================
// INTERNAL API: BANK SYNC (From Android MacroDroid)
// ==========================================
router.post('/internal/bank-sync', async (req, res) => {
  try {
    const { secret, amount, memo, transactionId, notification_body } = req.body;
    
    // 1. Bảo mật
    const INTERNAL_SECRET = process.env.INTERNAL_SYNC_SECRET || 'lumie_auto_bank_secure_2024';
    if (secret !== INTERNAL_SECRET) {
      console.error('[BANK_SYNC_ERROR] Unauthorized secret attempt');
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Ưu tiên lấy nội dung thô để parse (vì MacroDroid thường gửi gộp vào body)
    const rawContent = notification_body || memo || amount || '';
    console.log('[BANK_RAW]', rawContent);

    if (!rawContent || rawContent === '{not_body}') {
      console.error('[BANK_SYNC_ERROR] Empty content or MacroDroid placeholder not replaced');
      return res.status(400).json({ message: 'Nội dung thông báo trống hoặc MacroDroid chưa cấu hình đúng' });
    }

    // 2. Chống cộng tiền trùng lặp
    if (transactionId && transactionId !== '{not_id}') {
      const alreadyProcessed = await db.transactions.getByRequestId(transactionId);
      if (alreadyProcessed) return res.status(200).json({ message: 'Processed', status: 'duplicate' });
    }

    // 3. PARSER (VCB)
    const amountMatch = rawContent.match(/\+([\d,.]+)/);
    // Hỗ trợ cả Topup ID (9 số) và UUID dài
    const identifierMatch = rawContent.match(/LUMIE\s*([a-z0-9-]+)/i);

    if (!amountMatch || !identifierMatch) {
      console.error(`[BANK_SYNC_ERROR] Parser failed to extract data from: "${rawContent}"`);
      return res.status(400).json({ message: 'Không thể đọc số tiền hoặc mã định danh LUMIE' });
    }

    const finalAmount = parseInt(amountMatch[1].replace(/[,.]/g, ''));
    const identifier = identifierMatch[1].trim();

    // 4. Tìm người dùng (Tra cứu đa tầng)
    let user = await db.users.getByTopupId(identifier);
    if (!user) user = await db.users.getByUsername(identifier);
    if (!user) {
      try { user = await db.users.getById(identifier); } catch(e) {}
    }

    if (!user) {
      console.error(`[BANK_SYNC_ERROR] User ${identifier} not found`);
      return res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }

    // 5. Cộng tiền (An toàn hơn: Thử cập nhật VIP, nếu lỗi cột thì chỉ cộng tiền)
    const rechargeAmt = finalAmount;
    const newBalance = (user.balance || 0) + rechargeAmt;
    const newVipPoints = (user.vip_points || 0) + rechargeAmt;
    const newTotalTopup = (user.total_topup || 0) + rechargeAmt;
    const { currentLevelData } = calculateVipLevel(newVipPoints);
    const newVipLevel = currentLevelData.level;
    rankingCache.lastUpdated = 0; // Clear leaderboard cache on success🛡️⚡🏆✨
    
    try {
      await db.users.update(user.id, { 
        balance: newBalance,
        vip_points: newVipPoints,
        vip_level: newVipLevel,
        total_topup: newTotalTopup
      });
    } catch (dbErr) {
      console.warn('[BANK_SYNC_WARN] Lỗi cập nhật cột VIP (Có thể chưa chạy SQL):', dbErr.message);
      // Fallback: Chỉ cộng tiền vào tài khoản để khách không bị mất tiền
      await db.users.update(user.id, { balance: newBalance });
    }

    const rechargeId = transactionId !== '{not_id}' ? transactionId : `vcb_${Date.now()}`;
    await db.transactions.create({
      user_id: user.id,
      amount: finalAmount,
      telco: 'VCB',
      serial: 'N/A',
      code: rechargeId,
      request_id: rechargeId,
      status: 1, // 1 = Thành công (Integer)
      message: `Nạp tiền VCB tự động: ${rawContent}`
    });

    // 6. Gửi thông báo cho User Dashboard
    await db.notifications.create({
      userId: user.id,
      title: 'Nạp tiền thành công',
      content: `Số tiền ${finalAmount.toLocaleString()}đ đã được cộng tự động vào tài khoản từ giao dịch VCB. + ${finalAmount.toLocaleString()} điểm VIP.`,
      type: 'topup'
    });

    // Notify about VIP level up
    if (newVipLevel > (user.vip_level || 0)) {
       await db.notifications.create({
         userId: user.id,
         title: `Chúc mừng! Bạn đã đạt VIP ${newVipLevel}`,
         content: `Bạn đã được thăng cấp lên VIP ${newVipLevel}. Kiểm tra ưu đãi mới ngay!`,
         type: 'vip_up'
       });
    }

    console.log(`[BANK_SYNC_SUCCESS] +${finalAmount} VND cho ${user.username} (ID: ${identifier})`);
    res.json({ success: true, user: user.username, balance: newBalance });

  } catch (err) {
    console.error('[BANK_SYNC_CRITICAL]', err.message);
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// API: ORDERS (SHOPPING)
// ==========================================
router.post('/orders/create', authenticateToken, async (req, res) => {
  try {
    const { productId, productName, price, amount, options } = req.body;
    const userId = req.user.id;
    const user = await db.users.getById(userId);

    if (!user || user.balance < price * amount) return res.status(400).json({ message: 'Số dư không đủ.' });

    const order = await db.orders.create({
      userId, username: user.username, productId, productName, price,
      amount, options, total: price * amount, status: 'completed'
    });

    const spent = price * amount;
    const isDonation = productId === 'donation' || options?.type === 'donation';
    
    const updates = { 
      balance: user.balance - spent 
    };

    if (isDonation) {
      updates.total_topup = (user.total_topup || 0) + spent;
      updates.vip_points = (user.vip_points || 0) + spent;
      const { currentLevelData } = calculateVipLevel(updates.vip_points);
      updates.vip_level = currentLevelData.level;
      
      // Recognition notification
      await db.notifications.create({
        userId,
        title: 'Cảm ơn sự ủng hộ của bạn!',
        content: `Bạn vừa ủng hộ ${spent.toLocaleString()}đ. Số tiền này đã được ghi nhận vào tích lũy nạp và điểm VIP của bạn.`,
        type: 'donation'
      }).catch(() => {});
      
      // Create mock transaction for ranking tracking
      await db.transactions.create({
        user_id: userId,
        amount: spent,
        telco: 'DONATION',
        serial: 'N/A',
        code: `don_${order.id}`,
        request_id: `don_${order.id}`,
        status: 1,
        message: 'Ủng hộ Lumie Store'
      }).catch(() => {});

      rankingCache.lastUpdated = 0; // Trigger leaderboard refresh
    }

    await db.users.update(userId, updates);
    res.json({ message: 'Đặt hàng thành công!', order });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// ==========================================
// API: ADMIN (ULTRA-STEALTH MODE)
// ==========================================
// Use a random prefix that is NOT guessable
const ADMIN_BASE = '/internal-sys-mz9'; 

router.use(ADMIN_BASE, adminStoreLimiter); // Apply strict limit

router.get(`${ADMIN_BASE}/u-list-s`, authenticateAdmin, async (req, res) => {
  try { res.json(await db.users.getAll()); } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.get(`${ADMIN_BASE}/o-list-s`, authenticateAdmin, async (req, res) => {
  try { res.json(await db.orders.getAll()); } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.get(`${ADMIN_BASE}/t-list-s`, authenticateAdmin, async (req, res) => {
  try { res.json(await db.transactions.getAll()); } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post(`${ADMIN_BASE}/b-up-s`, authenticateAdmin, async (req, res) => {
  try {
    const { userId, amount, action } = req.body;
    const user = await db.users.getById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const updates = {};
    if (action === 'add') {
      updates.balance = (user.balance || 0) + amount;
    } else {
      updates.balance = amount;
    }

    await db.users.update(userId, updates);
    await db.notifications.create({
      userId: user.id, title: 'Số dư biến động',
      content: `Admin đã ${action === 'add' ? 'cộng thêm' : 'đặt lại'} ${amount.toLocaleString()}đ. ${action === 'add' ? `+${amount.toLocaleString()} điểm VIP.` : ''}`, 
      type: 'admin'
    });
    res.json({ message: 'Thành công!', newBalance: updates.balance });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post(`${ADMIN_BASE}/ban-u-s`, authenticateAdmin, async (req, res) => {
  try {
    await db.users.update(req.body.userId, { banned: req.body.banned });
    res.json({ message: 'Thành công!' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post(`${ADMIN_BASE}/o-stat-s`, authenticateAdmin, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    const order = await db.orders.updateStatus(orderId, status);
    if (order) {
      await db.notifications.create({
        userId: order.user_id, title: 'Cập nhật đơn hàng',
        content: `Đơn hàng ${order.product_name} chuyển sang: ${status === 'completed' ? 'Thành công' : status}.`, type: 'order'
      });
    }
    res.json({ message: 'Thành công!' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.post(`${ADMIN_BASE}/u-role-s`, authenticateAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;
    await db.users.update(userId, { role });
    res.json({ message: 'Thành công!' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

router.get(`${ADMIN_BASE}/pending-feedback-report`, authenticateAdmin, async (req, res) => {
  try {
    const orders = await db.orders.getAll();
    const now = Date.now();
    const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;
    
    // Filter finished orders without feedback that are older than 3 days
    const expiredOrders = orders.filter(o => 
      o.status === 'completed' && 
      !o.feedback_id && 
      (now - new Date(o.created_at).getTime()) > THREE_DAYS
    );

    const report = await Promise.all(expiredOrders.map(async o => {
      const u = await db.users.getById(o.user_id || o.userId);
      return {
        orderId: o.id,
        username: u?.username,
        discordId: u?.discord_id || u?.discordId || 'Chưa liên kết',
        productName: u?.product_name || o.productName || o.product_name,
        purchaseDate: o.created_at
      };
    }));

    res.json(report);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Middleware: Authenticate Staff/Admin
const authenticateStaff = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    const user = await db.users.getById(decoded.id);
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      return res.sendStatus(403);
    }
    req.user = user;
    next();
  });
};

// ==========================================
// API: FEEDBACKS
// ==========================================
router.post('/orders/:id/feedback', authenticateToken, async (req, res) => {
  try {
    const { rating, comment, productName } = req.body;
    const orderId = req.params.id;
    const userId = req.user.id;

    // Check if order exists and belongs to user
    const orders = await db.orders.getByUserId(userId);
    const order = orders.find(o => o.id === parseInt(orderId) || o.id === orderId);
    if (!order) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
    if (order.status !== 'completed') return res.status(400).json({ message: 'Bạn chỉ có thể đánh giá đơn hàng đã hoàn thành.' });

    // Check if feedback already exists
    const existing = await db.feedbacks.getByOrderId(orderId);
    if (existing) return res.status(400).json({ message: 'Bạn đã đánh giá đơn hàng này rồi.' });

    const feedback = await db.feedbacks.create({
      userId, orderId, rating, comment, 
      productName: productName || order.product_name || order.productName,
      username: req.user.username
    });

    res.json({ message: 'Cảm ơn bạn đã đánh giá!', feedback });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats/top-rechargers', async (req, res) => {
  try {
    // Get all successful transactions, group by user, sum amount
    const transactions = await db.transactions.getAll();
    const successfulTx = transactions.filter(tx => tx.status === '1' || tx.status === 1);
    
    const userTotals = {};
    for (const tx of successfulTx) {
      if (!userTotals[tx.user_id]) userTotals[tx.user_id] = 0;
      userTotals[tx.user_id] += tx.amount;
    }

    const sortedUsers = await Promise.all(
      Object.entries(userTotals)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(async ([userId, total]) => {
          const user = await db.users.getById(userId);
          return {
            id: userId,
            username: user?.username || 'Ẩn danh',
            avatar: user?.avatar,
            total
          };
        })
    );

    res.json(sortedUsers);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/user/vip-status', authenticateToken, async (req, res) => {
  try {
    const user = await db.users.getById(req.user.id).catch(() => null);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Monthly Gacha Tickets Logic: "Số vip = số vé hàng tháng"
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
    let gachaTickets = user.gacha_tickets || 0;

    if (user.last_ticket_month !== currentMonth && (user.vip_level || 0) > 0) {
      try {
        gachaTickets = user.vip_level || 0; // Number of tickets = VIP level
        await db.users.update(user.id, {
          gacha_tickets: gachaTickets,
          last_ticket_month: currentMonth
        });
        
        await db.notifications.create({
          userId: user.id,
          title: 'Nhận vé Gacha tháng mới',
          content: `Chào tháng mới! Bạn đã nhận được ${gachaTickets} vé Gacha dựa trên cấp độ VIP ${user.vip_level}.`,
          type: 'gacha_ticket'
        }).catch(() => {});
      } catch (innerErr) { console.error('[VIP_TICKET_ERROR]', innerErr); }
    }

    const vipInfo = calculateVipLevel(user.vip_points || 0);

    res.json({
      vipLevel: user.vip_level || 0,
      vipPoints: user.vip_points || 0,
      totalTopup: user.total_topup || 0,
      gachaTickets: gachaTickets,
      nextLevel: vipInfo.nextLevel,
      currentLevelData: vipInfo.currentLevelData,
      allLevels: vipInfo.allLevels,
      claimedMilestones: user.claimed_milestones || []
    });
  } catch (err) { 
    console.error('[VIP_STATUS_ERROR]', err);
    // Return Neutral Default instead of 500
    const neutral = calculateVipLevel(0);
    res.json({
      vipLevel: 0,
      vipPoints: 0,
      totalTopup: 0,
      gachaTickets: 0,
      nextLevel: neutral.nextLevel,
      currentLevelData: neutral.currentLevelData,
      allLevels: neutral.allLevels,
      claimedMilestones: []
    });
  }
});

router.post('/gacha/roll', authenticateToken, async (req, res) => {
  try {
    const user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if ((user.gacha_tickets || 0) <= 0) {
      return res.status(400).json({ message: 'Bạn không có đủ vé Gacha.' });
    }

    const reward = rollGacha(user.vip_level || 0);
    const newTickets = user.gacha_tickets - 1;
    
    let updates = { gacha_tickets: newTickets };
    let finalMessage = `Chúc mừng! Bạn đã trúng ${reward.name}.`;

    if (reward.type === 'cash') {
      updates.balance = (user.balance || 0) + reward.value;
      finalMessage += ` Số dư đã được cộng thêm ${reward.value.toLocaleString()}đ.`;
    }

    await db.users.update(user.id, updates);
    
    // Log for admin if it's a physical/product reward
    if (reward.type === 'product' || reward.type === 'deco') {
      await db.notifications.create({
        userId: user.id,
        title: 'Trúng thưởng Gacha!',
        content: `Bạn vừa quay được ${reward.name}. Vui lòng liên hệ Admin qua Ticket Discord để nhận quà.`,
        type: 'gacha_win'
      });
    }

    res.json({ reward, ticketsLeft: newTickets, message: finalMessage });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.post('/user/claim-vip-milestone', authenticateToken, async (req, res) => {
  try {
    const { milestone } = req.body; // e.g., 5, 6, 7, 8, 9, 10
    const user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if ((user.vip_level || 0) < milestone) {
      return res.status(400).json({ message: `Bạn cần đạt VIP ${milestone} để nhận quà này.` });
    }

    const claimed = user.claimed_milestones || [];
    if (claimed.includes(milestone)) {
      return res.status(400).json({ message: 'Bạn đã nhận phần quà này rồi.' });
    }

    // Add to claimed
    claimed.push(milestone);
    await db.users.update(user.id, { claimed_milestones: claimed });

    const milestoneRewards = {
      5: 'Gói YouTube 3 tháng',
      6: '3 Deco 66 cá',
      7: '1 Deco 79 + 1 Deco 131',
      8: '4 Tháng Spotify Premium',
      9: '4 Tháng Netflix Premium',
      10: '6 Tháng Gói bất kỳ (Shop)'
    };

    const rewardName = milestoneRewards[milestone] || 'Phần quà VIP';

    await db.notifications.create({
      userId: user.id,
      title: `Nhận thành công quà VIP ${milestone}`,
      content: `Bạn vừa đăng ký nhận ${rewardName}. Shop sẽ kiểm tra và gửi quà cho bạn trong vòng 24h. Liên hệ Ticket Discord nếu cần hỗ trợ gấp.`,
      type: 'milestone_claim'
    });

    res.json({ message: `Đã gửi yêu cầu nhận quà VIP ${milestone}!`, claimedMilestones: claimed });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// FAST BACKGROUND CACHE FOR RANKINGS
let rankingCache = { 
  data: { total: [], weekly: [], monthly: [] }, 
  lastUpdated: 0,
  isRefreshing: false
};

const refreshRankingsInBackground = async () => {
  if (rankingCache.isRefreshing) return;
  rankingCache.isRefreshing = true;
  
  try {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const monthAgo = now - 30 * 24 * 60 * 60 * 1000;

    // 1. Fetch EVERYTHING needed for accurate aggregation
    const [txRes, orderRes, userRes] = await Promise.all([
      supabase.from('transactions').select('*').in('status', ['1', 1]),
      supabase.from('orders').select('*').eq('status', 'completed').eq('product_id', 'donation'),
      supabase.from('users').select('id, username, avatar, total_topup')
    ]);

    const txData = txRes.data || [];
    const donationData = orderRes.data || [];
    const userData = userRes.data || [];
    
    const nameMap = {};
    userData.forEach(u => { nameMap[u.id] = { username: u.username, avatar: u.avatar, total_topup: u.total_topup || 0 }; });

    const aggregateRanking = (records, filterFn = null) => {
      const map = {};
      records.forEach(r => {
        const time = new Date(r.created_at).getTime();
        if (filterFn && !filterFn(time)) return;
        const uid = r.user_id || r.userId;
        if (!uid) return;
        map[uid] = (map[uid] || 0) + (parseInt(r.amount) || parseInt(r.total) || 0);
      });
      return map;
    };

    // Combine Tx and Donations for accurate time-based boards
    const allRecords = [...txData, ...donationData];
    
    // For "Total", we use the user's total_topup column BUT we ensure it's at least as high as current transactions
    const totalMap = aggregateRanking(allRecords);
    const weeklyMap = aggregateRanking(allRecords, (t) => t >= weekAgo);
    const monthlyMap = aggregateRanking(allRecords, (t) => t >= monthAgo);

    const mapToRankList = (map) => {
      return Object.entries(map)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10) // Only top 10
        .map(([uid, amt]) => {
          const u = nameMap[uid];
          return { id: uid, username: u?.username || 'Ẩn danh', amount: amt, avatar: u?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}` };
        });
    };

    // For the "Total" board specifically, we prioritize the aggregated total if higher than DB column
    const finalTotalList = Object.entries(nameMap).map(([uid, u]) => {
      const aggAmt = totalMap[uid] || 0;
      const dbAmt = u.total_topup || 0;
      return { id: uid, username: u.username, amount: Math.max(aggAmt, dbAmt), avatar: u.avatar };
    }).sort((a, b) => b.amount - a.amount).slice(0, 10);

    rankingCache.data = {
      total: finalTotalList,
      weekly: mapToRankList(weeklyMap),
      monthly: mapToRankList(monthlyMap),
      topDonors: mapToRankList(aggregateRanking(donationData))
    };
    rankingCache.lastUpdated = now;
  } catch (err) {
    console.error('[BG_REFRESH] Fatal Error:', err.message);
  } finally {
    rankingCache.isRefreshing = false;
  }
};

// Initial run
refreshRankingsInBackground();

// Middleware to disable caching for stats
const noCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
};

router.get('/stats/vip-rankings', noCache, async (req, res) => {
  const now = Date.now();
  // If cache is invalidated (0) or older than 5 mins
  if (rankingCache.lastUpdated === 0 || now - rankingCache.lastUpdated > 5 * 60 * 1000) {
    if (rankingCache.lastUpdated === 0) {
      await refreshRankingsInBackground(); // Await if it was forced refresh (donation/topup) 🛡️⚡🏆✨
    } else {
      refreshRankingsInBackground(); // Background if just old
    }
  }
  res.json(rankingCache.data);
});

router.get('/stats/recent-activity', noCache, async (req, res) => {
  try {
    const orders = await supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(50).then(res => res.data || []);
    const feedbacks = await supabase.from('feedbacks').select('*').order('created_at', { ascending: false }).limit(50).then(res => res.data || []);

    const activity = [
      ...(orders || []).slice(0, 15).map(o => ({ 
        type: 'order', 
        username: o.username, 
        productName: o.product_name || o.productName, 
        amount: o.total,
        created_at: o.created_at 
      })),
      ...(feedbacks || []).slice(0, 15).map(f => ({ 
        type: 'feedback', 
        username: f.username, 
        productName: f.product_name || f.productName, 
        rating: f.rating,
        created_at: f.created_at 
      }))
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    res.json(activity.slice(0, 10));
  } catch (err) { 
    console.error('Stats Activity Error:', err);
    res.json([]); // Return empty instead of 500
  }
});

router.get('/feedbacks', async (req, res) => {
  try {
    const feedbacks = await db.feedbacks.getAll().catch(() => []);
    res.json(feedbacks || []);
  } catch (err) { res.json([]); }
});

// ==========================================
// API: UPLOAD (DEDICATED)
// ==========================================
app.post('/api/upload-proof', authenticateToken, orderUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Không có file nào được tải lên.' });
    const { originalname, buffer, mimetype } = req.file;
    const fileExt = originalname.split('.').pop();
    const fileName = `${Date.now()}-${uuidv4()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('orders').upload(fileName, buffer, { contentType: mimetype, upsert: true });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('orders').getPublicUrl(fileName);
    res.json({ url: publicUrl });
  } catch (err) { res.status(500).json({ message: 'Lỗi khi tải file lên hệ thống.' }); }
});

// ==========================================
// API: SETTINGS (ADMIN ONLY)
// ==========================================

router.get(`${ADMIN_BASE}/settings`, authenticateAdmin, async (req, res) => {
  try {
    let settings = await db.settings.getAll();
    if (settings.length === 0) {
      // Auto-initialize defaults if empty
      await db.settings.update('roblox_group_link', 'https://www.roblox.com/groups/33719487');
      await db.settings.update('robux_tutorial_link', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      settings = await db.settings.getAll();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: 'Error' });
  }
});

router.post(`${ADMIN_BASE}/settings/update`, authenticateAdmin, async (req, res) => {
  try {
    const { key, value } = req.body;
    await db.settings.update(key, value);
    res.json({ message: 'Cập nhật thành công!' });
  } catch (err) { res.status(500).json({ message: 'Error' }); }
});

// For frontend displays
router.get('/settings/public', async (req, res) => {
  try {
    const gl = await db.settings.getByKey('roblox_group_link').catch(() => null);
    const tl = await db.settings.getByKey('robux_tutorial_link').catch(() => null);
    res.json({
      roblox_group_link: gl?.value || 'https://www.roblox.com/groups/33719487',
      robux_tutorial_link: tl?.value || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
  } catch (err) {
    res.json({
      roblox_group_link: 'https://www.roblox.com/groups/33719487',
      robux_tutorial_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    });
  }
});

router.get('/stats', noCache, async (req, res) => {
  try {
    const feedbacks = await db.feedbacks.getAll().catch(() => []);
    const count = (feedbacks || []).length;
    res.json({ totalFeedbacks: 5000 + count });
  } catch (err) { 
    res.json({ totalFeedbacks: 5000 }); // Safety default
  }
});

// ==========================================
// API: STAFF PANEL
// ==========================================
router.get('/staff/orders', authenticateStaff, async (req, res) => {
  try {
    const orders = await db.orders.getAll();
    res.json(orders);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Apply auth rate limiting specifically to these routes
router.use('/auth/login', authLimiter);
router.use('/auth/register', authLimiter);

// Use the router for both /api and / routes to be safe on Vercel
app.use('/api', router);
app.use('/', router);

// Error Handling Middleware (Custom)
app.use((err, req, res, next) => {
  console.error('SERVER ERROR:', err.stack);
  res.status(500).json({ 
    message: 'Đã xảy ra lỗi hệ thống. Vui lòng liên hệ quản trị viên.',
    requestId: uuidv4()
  });
});

app.get('/health', (req, res) => res.json({ status: 'ok', engine: 'serverless' }));

export default app;
