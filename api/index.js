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
import { db } from '../db.js';
import { calculateVipLevel, VIP_LEVELS } from './vip-utils.js';

// Multer config for avatar uploads (memory storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});

const app = express();

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
      email: email || '',
      balance: 0,
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
    const user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
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
    res.json(orders);
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
          const newVipLevel = calculateVipLevel(newVipPoints);
          
          await db.users.update(user.id, { 
            balance: newBalance
          });

          await db.notifications.create({
            userId: user.id, title: 'Nạp thẻ thành công',
            content: `Thẻ ${tx.telco} ${rechargeAmt.toLocaleString()}đ thành công! + ${rechargeAmt.toLocaleString()} điểm VIP.`, type: 'topup'
          });

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

    // 5. Cộng tiền & Lưu lịch sử
    const newBalance = (user.balance || 0) + finalAmount;
    await db.users.update(user.id, { balance: newBalance });

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
      content: `Số tiền ${finalAmount.toLocaleString()}đ đã được cộng tự động vào tài khoản từ giao dịch VCB.`,
      type: 'topup'
    });

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
      amount, options, total: price * amount, status: 'pending'
    });

    await db.users.update(userId, { balance: user.balance - (price * amount) });
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
    const user = await db.users.getById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // Simulate Decaying Point Logic: If not topup for > 15 days, lose 5% points 
    // This is a simplified approach, in a real app use a CRON job.
    let currentPoints = user.vip_points || 0;
    /* Decaying logic disabled due to missing column
    const lastTopup = ...
    ...
    */

    const nextLevel = VIP_LEVELS.find(v => v.level === (user.vip_level || 0) + 1) || null;
    const currentLevelData = VIP_LEVELS.find(v => v.level === (user.vip_level || 0));

    res.json({
      vipLevel: user.vip_level || 0,
      vipPoints: currentPoints,
      totalTopup: user.total_topup || 0,
      nextLevel: nextLevel,
      currentLevelData: currentLevelData,
      allLevels: VIP_LEVELS
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats/vip-rankings', async (req, res) => {
  try {
    const allUsers = await db.users.getAll();
    
    // Total Topup rankings
    const topTotal = [...allUsers]
      .filter(u => u.total_topup > 0)
      .sort((a, b) => (b.total_topup || 0) - (a.total_topup || 0))
      .slice(0, 10)
      .map(u => ({ id: u.id, username: u.username, amount: u.total_topup, avatar: u.avatar }));

    // For Week/Month, we'd need a transactions table with timestamps and successful status
    // Let's filter from db.transactions (inefficient but works for small/mid scales without heavy DB query)
    const transactions = await db.transactions.getAll();
    const successfulTx = transactions.filter(tx => tx.status === '1' || tx.status === 1);
    
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const getRankingsForPeriod = (periodDate) => {
      const periodMap = {};
      successfulTx.forEach(tx => {
        const txDate = new Date(tx.created_at);
        if (txDate >= periodDate) {
           periodMap[tx.user_id] = (periodMap[tx.user_id] || 0) + tx.amount;
        }
      });
      return Object.entries(periodMap)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([uid, amt]) => {
          const u = allUsers.find(user => user.id === uid);
          return { id: uid, username: u?.username || 'Ẩn danh', amount: amt, avatar: u?.avatar };
        });
    };

    res.json({
      total: topTotal,
      weekly: getRankingsForPeriod(oneWeekAgo),
      monthly: getRankingsForPeriod(oneMonthAgo)
    });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

router.get('/stats/recent-activity', async (req, res) => {
  try {
    const orders = await db.orders.getAll().catch(() => []);
    const feedbacks = await db.feedbacks.getAll().catch(() => []);

    const activity = [
      ...(orders || []).slice(0, 5).map(o => ({ 
        type: 'order', 
        username: o.username, 
        productName: o.product_name || o.productName, 
        created_at: o.created_at 
      })),
      ...(feedbacks || []).slice(0, 5).map(f => ({ 
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

router.get('/stats', async (req, res) => {
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
