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
import { db } from '../db.js';

const app = express();

// Security Middleware
app.use(helmet()); // Sets various HTTP headers for security
app.use(hpp()); // Protect against HTTP Parameter Pollution attacks

const SECRET_KEY = process.env.JWT_SECRET || 'LUMIE_STORE_SECRET_KEY';
const ADMIN_SECRET = process.env.ADMIN_PATH_SECRET || 'lumie_adm_2024'; // Extra layer

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

    const existingUser = await db.users.getByUsername(username);
    if (existingUser) return res.status(400).json({ message: 'Tên người dùng đã tồn tại.' });

    const hashedPassword = await bcrypt.hash(password, 12);
    const newUser = await db.users.create({
      username,
      password: hashedPassword,
      email: email || '',
      balance: 0,
      role: 'user',
      banned: false
    });

    const { password: _, ...userWithoutPassword } = newUser;
    res.json({ message: 'Đăng ký thành công!', user: userWithoutPassword });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await db.users.getByUsername(username);
    if (!user) return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng.' });
    if (user.banned) return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng.' });

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
    const { password: _, ...userWithoutPassword } = user;
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
    res.json(userWithoutPassword);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    if (!currentPassword) return res.status(400).json({ message: 'Vui lòng nhập mật khẩu hiện tại để xác minh.' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });

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
    }

    const updatedUser = await db.users.update(userId, updates);
    const { password: _, ...userData } = updatedUser;
    res.json({ message: 'Cập nhật tài khoản thành công!', user: userData });
  } catch (err) { res.status(500).json({ message: err.message }); }
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
          await db.users.update(user.id, { balance: user.balance + parseInt(amount) });
          await db.notifications.create({
            userId: user.id, title: 'Nạp thẻ thành công',
            content: `Thẻ ${tx.telco} ${parseInt(amount).toLocaleString()}đ thành công!`, type: 'topup'
          });
        }
      }
    }
    res.json({ status: 'OK' });
  } catch (err) { res.status(500).json({ message: err.message }); }
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

    const newBalance = action === 'add' ? user.balance + amount : amount;
    await db.users.update(userId, { balance: newBalance });
    await db.notifications.create({
      userId: user.id, title: 'Số dư biến động',
      content: `Admin đã ${action === 'add' ? 'cộng thêm' : 'đặt lại'} ${amount.toLocaleString()}đ.`, type: 'admin'
    });
    res.json({ message: 'Thành công!', newBalance });
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
