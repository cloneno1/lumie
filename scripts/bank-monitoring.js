/**
 * LUMIE STORE - BANK MONITORING SCRIPT (BIDV)
 * Hướng dẫn: 
 * 1. npm install imapflow axios mailparser
 * 2. Điền thông tin cấu hình bên dưới
 * 3. Chạy lệnh: node scripts/bank-monitoring.js
 */

import { ImapFlow } from 'imapflow';
import axios from 'axios';
import { simpleParser } from 'mailparser';

// ==========================================
// CẤU HÌNH (THAY ĐỔI TẠI ĐÂY)
// ==========================================
const CONFIG = {
  // Thông tin Email nhận thông báo BIDV
  email: {
    user: 'your-email@gmail.com',
    pass: 'your-16-char-app-password', // Mật khẩu ứng dụng Google
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  },
  
  // Thông tin kết nối tới Store của bạn
  api: {
    url: 'https://your-store-api.vercel.app/api/internal/bank-sync', // URL API của bạn
    secret: 'lumie_auto_bank_secure_2024' // Phải khớp với INTERNAL_SYNC_SECRET trong api/index.js
  },

  // Cấu hình lọc Email ngân hàng
  bank: {
    sender: 'contact@bidv.com.vn', // Email chính thức của BIDV (Vui lòng kiểm tra lại chính xác)
    subjectKeywords: ['bien dong so du', 'thong bao'] // Từ khóa trong tiêu đề email
  }
};

const client = new ImapFlow({
  host: CONFIG.email.host,
  port: CONFIG.email.port,
  secure: CONFIG.email.secure,
  auth: {
    user: CONFIG.email.user,
    pass: CONFIG.email.pass
  },
  logger: false
});

/**
 * Hàm phân tích nội dung Email BIDV
 * BIDV thường có định dạng: TK: ... | GD: +...VND | SD: ... | ND: ...
 */
const parseBIDVEmail = (text) => {
  try {
    // 1. Phân tích số tiền (Dấu + đi kèm con số và chữ VND)
    const amountMatch = text.match(/\+([0-9,.]+)\s*VND/i);
    if (!amountMatch) return null;

    // 2. Phân tích nội dung (ND: ...)
    // BIDV thường dùng ND: hoặc No i dung:
    const memoMatch = text.match(/(?:ND|Noi dung|ND:)\s*(.*?)(?=\s*\||$)/i);
    
    // 3. Phân tích số tài khoản (TK: ...)
    const accountMatch = text.match(/TK:\s*(\d+)/i);

    // 4. Mã giao dịch (Nếu có, hoặc tự tạo từ timestamp để tránh trùng lặp nếu bank ko gửi ID)
    // Thông thường mail bank sẽ có mã tham chiếu
    const txIdMatch = text.match(/(?:Ma GD|Trace|Ref):\s*(\d+)/i);

    const amount = amountMatch[1].replace(/[,.]/g, '');
    const memo = memoMatch ? memoMatch[1].trim() : '';
    const bankAccount = accountMatch ? accountMatch[1] : 'Unknown';
    // Nếu BIDV không có mã GD trong mail, ta băm nội dung để tạo ID duy nhất
    const transactionId = txIdMatch ? txIdMatch[1] : `BIDV_${Date.now()}_${amount}`;

    return { amount, memo, transactionId, bankAccount };
  } catch (err) {
    console.error('Lỗi khi phân tích Email:', err);
    return null;
  }
};

const main = async () => {
  console.log('🚀 Đang khởi động hệ thống theo dõi BIDV...');
  
  try {
    await client.connect();
    console.log('✅ Đã kết nối tới Gmail thành công.');

    // Chọn hòm thư INBOX
    let lock = await client.getMailboxLock('INBOX');
    
    try {
      // Mỗi khi có email mới (Event 'exists' hoặc 'idle' tùy bản cập nhật)
      client.on('exists', async (data) => {
        const count = data.count;
        console.log(`📩 Có ${count} email mới trong hòm thư.`);
        
        // Lấy email mới nhất
        const message = await client.fetchOne(count.toString(), { source: true });
        const parsed = await simpleParser(message.source);
        
        const from = parsed.from.value[0].address;
        const subject = parsed.subject.toLowerCase();
        const body = parsed.text || parsed.html;

        // Kiểm tra xem có đúng là mail từ BIDV không
        const isFromBank = from.includes('bidv.com.vn');
        const hasKeywords = CONFIG.bank.subjectKeywords.some(k => subject.includes(k));

        if (isFromBank && hasKeywords) {
          console.log('🔍 Phát hiện email thông báo biến động số dư BIDV.');
          
          const data = parseBIDVEmail(body);
          
          if (data && parseInt(data.amount) > 0) {
            console.log(`💰 Giao dịch: +${parseInt(data.amount).toLocaleString()}đ | ND: ${data.memo}`);
            
            // Gửi sang API Store
            try {
              const response = await axios.post(CONFIG.api.url, {
                secret: CONFIG.api.secret,
                amount: data.amount,
                memo: data.memo,
                transactionId: data.transactionId,
                bankName: 'BIDV',
                bankAccount: data.bankAccount
              });
              
              if (response.data.status === 'processed') {
                console.log(`✅ Thành công: Đã cộng tiền cho ${response.data.username}`);
              } else if (response.data.status === 'duplicate') {
                console.log('⚠️ Bỏ qua: Giao dịch này đã được xử lý trước đó.');
              }
            } catch (apiErr) {
              console.error('❌ Lỗi API Store:', apiErr.response?.data?.message || apiErr.message);
            }
          } else {
            console.log('⚠️ Bỏ qua: Không phải giao dịch nạp tiền hoặc không đọc được số tiền.');
          }
        }
      });

      // Giữ kết nối Idle để nhận mail real-time
      console.log('📡 Đang lắng nghe email mới (Real-time mode)...');
      while(true) {
         await new Promise(resolve => setTimeout(resolve, 60000)); // Keep alive loop
      }

    } finally {
      lock.release();
    }
  } catch (err) {
    console.error('❌ Lỗi kết nối IMAP:', err);
    setTimeout(main, 10000); // Thử lại sau 10 giây nếu lỗi
  }
};

main().catch(err => console.error('FATAL ERROR:', err));
