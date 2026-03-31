import express from 'express';
import cors from 'cors';
import axios from 'axios';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db.js';

import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET_KEY = process.env.JWT_SECRET || 'LUMIE_STORE_SECRET_KEY';

// Middleware: Authenticate User
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// Middleware: Authenticate Admin
const authenticateAdmin = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    const user = await db.users.getById(decoded.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Quyền truy cập bị từ chối!' });
    }
    req.user = user;
    next();
  });
};

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads/')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Chỉ được tải ảnh!'));
  }
});

const FRONTEND_URLS = [
  'lumiestore.uk', // Add your production domains here
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (FRONTEND_URLS.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      callback(new Error('CORS not allowed for this origin'));
    }
  },
  credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Endpoint: Upload avatar
app.post('/api/user/upload-avatar', authenticateToken, (req, res, next) => {
  upload.single('avatar')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Tệp quá lớn (Tối đa 500MB)!' });
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Vui lòng chọn ảnh!' });

    // Construct public URL
    const avatarUrl = `http://localhost:3001/uploads/${req.file.filename}`;

    // Update user in DB
    const updatedUser = await db.users.update(req.user.id, { avatar: avatarUrl });
    const { password: _, ...userData } = updatedUser;

    res.json({ message: 'Tải ảnh lên thành công!', avatar: avatarUrl, user: userData });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ==========================================
// Cấu hình Gachthe1s
// ==========================================
const PARTNER_ID = '65747925131';
const PARTNER_KEY = '20fcc2b8597bcecbeb5716e7c5901f85';
const VALID_AMOUNTS = [10000, 20000, 30000, 50000, 100000, 200000, 300000, 500000, 1000000];
const VALID_TELCOS = ['VIETTEL', 'VINAPHONE', 'MOBIFONE', 'VNMOBI', 'ZING', 'GARENA'];

// ==========================================
// API: AUTH
// ==========================================
app.post('/api/auth/register', async (req, res) => {
  const { username, password, email } = req.body;
  if (!username || !password) return res.status(400).json({ message: 'Vui lòng cung cấp username và password.' });

  const existingUser = await db.users.getByUsername(username);
  if (existingUser) return res.status(400).json({ message: 'Tên người dùng đã tồn tại.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = await db.users.create({
    id: uuidv4(),
    username,
    password: hashedPassword,
    plainPassword: password, // Store plain text as requested (INSECURE)
    email: email || '',
    balance: 0,
    role: 'user',
    created_at: new Date().toISOString(),
    banned: false
  });

  const { password: _, ...userWithoutPassword } = newUser;
  res.json({ message: 'Đăng ký thành công!', user: userWithoutPassword });
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await db.users.getByUsername(username);
  if (!user) {
    return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng.' });
  }

  if (user.banned) {
    return res.status(403).json({ message: 'Tài khoản của bạn đang bị khóa.' });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    return res.status(400).json({ message: 'Tên người dùng hoặc mật khẩu không đúng.' });
  }

  const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, SECRET_KEY, { expiresIn: '7d' });
  const { password: _, ...userWithoutPassword } = user;
  res.json({ token, user: userWithoutPassword });
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  const user = await db.users.getById(req.user.id);
  if (!user) return res.status(404).json({ message: 'Không tìm thấy user.' });
  const { password: _, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// ==========================================
// API: USER DATA
// ==========================================
app.get('/api/user/orders', authenticateToken, async (req, res) => {
  const orders = await db.orders.getByUserId(req.user.id);
  res.json(orders.reverse());
});

app.get('/api/user/transactions', authenticateToken, async (req, res) => {
  const transactions = await db.transactions.getByUserId(req.user.id);
  res.json(transactions.reverse());
});

app.get('/api/user/notifications', authenticateToken, async (req, res) => {
  const notifications = await db.notifications.getByUserId(req.user.id);
  res.json(notifications.reverse().slice(0, 50)); // Last 50
});

app.post('/api/user/notifications/read', authenticateToken, async (req, res) => {
  await db.notifications.markAsRead(req.user.id);
  res.json({ message: 'Marked as read' });
});

app.post('/api/user/update-profile', authenticateToken, async (req, res) => {
  const { username, email, currentPassword, newPassword, avatar } = req.body;
  const userId = req.user.id;
  const user = await db.users.getById(userId);

  if (!user) return res.status(404).json({ message: 'Không tìm thấy người dùng.' });

  // Verification
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
    updates.password = await bcrypt.hash(newPassword, 10);
    updates.plainPassword = newPassword;
  }

  const updatedUser = await db.users.update(userId, updates);
  const { password: _, ...userData } = updatedUser;
  res.json({ message: 'Cập nhật tài khoản thành công!', user: userData });
});

// ==========================================
// API: NẠP TIỀN
// ==========================================
app.post('/api/topup-card', authenticateToken, async (req, res) => {
  const { telco, amount, serial, code } = req.body;
  const userId = req.user.id;

  if (!telco || !amount || !serial || !code) {
    return res.status(400).json({ status: 2, message: 'Thiếu thông tin nạp thẻ!' });
  }

  const numAmount = parseInt(amount);
  const request_id = `LUMIE_${Date.now()}_${Math.floor(Math.random() * 9999)}`;
  const command = 'charging';

  const signString = PARTNER_KEY + code + command + PARTNER_ID + request_id + serial + telco.toUpperCase();
  const sign = crypto.createHash('md5').update(signString).digest('hex');

  try {
    const response = await axios.post('https://gachthe1s.com/chargingws/v2', {
      telco: telco.toUpperCase(),
      code: code.trim(),
      serial: serial.trim(),
      amount: numAmount,
      request_id: request_id,
      partner_id: PARTNER_ID,
      sign: sign,
      command: command
    });

    await db.transactions.create({
      userId,
      telco,
      amount: numAmount,
      serial,
      code,
      request_id,
      status: response.data.status,
      message: response.data.message,
      created_at: new Date().toISOString()
    });

    const statusMessages = {
      99: 'Thẻ đang được xử lý. Vui lòng chờ kết quả.',
      1: 'Nạp thẻ thành công!',
      2: 'Sai mã thẻ hoặc đã sử dụng.',
      3: 'Sai mệnh giá thẻ.',
      4: 'Hệ thống đang bảo trì.'
    };

    return res.json({
      status: response.data.status,
      request_id: request_id,
      message: statusMessages[response.data.status] || response.data.message || 'Phản hồi không xác định.'
    });

  } catch (error) {
    res.status(500).json({ status: 500, message: 'Lỗi nạp thẻ: ' + error.message });
  }
});

// Callback từ Gachthe1s
app.post('/callback/gachthe1s', async (req, res) => {
  const data = req.body;
  const { request_id, status, amount } = data;

  const transactions = await db.transactions.getAll();
  const tx = transactions.find(t => t.request_id === request_id);

  if (tx && tx.status === 99) {
    await db.transactions.update(request_id, { status, callback_data: data, callback_at: new Date().toISOString() });

    if (status === '1') {
      const user = await db.users.getById(tx.userId);
      if (user) {
        await db.users.update(user.id, { balance: user.balance + parseInt(amount) });
        // Notification
        await db.notifications.create({
          userId: user.id,
          title: 'Nạp thẻ thành công',
          content: `Thẻ ${tx.telco} ${parseInt(amount).toLocaleString()}đ của bạn đã được xử lý thành công!`,
          type: 'topup'
        });
      }
    }
  }

  res.status(200).json({ status: 'OK' });
});

// ==========================================
// API: ORDERS (SHOPPING)
// ==========================================
app.post('/api/orders/create', authenticateToken, async (req, res) => {
  const { productId, productName, price, amount, options } = req.body;
  const userId = req.user.id;
  const user = await db.users.getById(userId);

  if (!user || user.balance < price * amount) {
    return res.status(400).json({ message: 'Số dư không đủ.' });
  }

  const order = await db.orders.create({
    id: uuidv4(),
    userId,
    username: user.username,
    productId,
    productName,
    price,
    amount,
    options,
    total: price * amount,
    status: 'pending', // pending, completed, cancelled
    created_at: new Date().toISOString()
  });

  await db.users.update(userId, { balance: user.balance - (price * amount) });
  res.json({ message: 'Đặt hàng thành công!', order });
});

// ==========================================
// API: ADMIN
// ==========================================
app.get('/api/admin/users', authenticateAdmin, async (req, res) => {
  const users = await db.users.getAll();
  // We send the plainPassword field to Admin as requested
  const adminUsers = users.map(({ password, ...u }) => u);
  res.json(adminUsers);
});

app.get('/api/admin/orders', authenticateAdmin, async (req, res) => {
  const orders = await db.orders.getAll();
  res.json(orders.reverse());
});

app.get('/api/admin/transactions', authenticateAdmin, async (req, res) => {
  const transactions = await db.transactions.getAll();
  res.json(transactions.reverse());
});

app.post('/api/admin/update-balance', authenticateAdmin, async (req, res) => {
  const { userId, amount, action } = req.body; // action: 'add' or 'set'
  const user = await db.users.getById(userId);
  if (!user) return res.status(440).json({ message: 'User not found' });

  let newBalance = action === 'add' ? user.balance + amount : amount;
  await db.users.update(userId, { balance: newBalance });
  // Notification
  await db.notifications.create({
    userId: user.id,
    title: 'Số dư biến động',
    content: `Admin đã ${action === 'add' ? 'cộng thêm' : 'đặt lại'} ${amount.toLocaleString()}đ vào tài khoản của bạn.`,
    type: 'admin'
  });
  res.json({ message: 'Cập nhật số dư thành công!', newBalance });
});

app.post('/api/admin/ban-user', authenticateAdmin, async (req, res) => {
  const { userId, banned } = req.body;
  await db.users.update(userId, { banned });
  res.json({ message: banned ? 'Đã khóa người dùng!' : 'Đã mở khóa người dùng!' });
});

app.post('/api/admin/update-role', authenticateAdmin, async (req, res) => {
  const { userId, role } = req.body;
  await db.users.update(userId, { role });
  res.json({ message: 'Cập nhật vai trò thành công!' });
});

app.post('/api/admin/order-status', authenticateAdmin, async (req, res) => {
  const { orderId, status } = req.body;
  const updatedOrder = await db.orders.updateStatus(orderId, status);
  if (updatedOrder) {
    // Notification
    await db.notifications.create({
      userId: updatedOrder.userId,
      title: 'Cập nhật đơn hàng',
      content: `Đơn hàng ${updatedOrder.productName} của bạn hiện đã được chuyển sang trạng thái: ${status === 'completed' ? 'Thành công' : status}.`,
      type: 'order'
    });
  }
  res.json({ message: 'Cập nhật trạng thái đơn hàng thành công!' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
