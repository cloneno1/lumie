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
    user: 'lumie.stzre@gmail.com',
    pass: 'troq gdtb qzpv xuqb', // Mật khẩu ứng dụng Google
    host: 'imap.gmail.com',
    port: 993,
    secure: true
  },

  // Thông tin kết nối tới Store của bạn
  api: {
    url: 'https://lumiestore.uk/api/internal/bank-sync', // URL API của bạn
    secret: 'lumie_auto_bank_secure_2024' // Phải khớp với INTERNAL_SYNC_SECRET trong api/index.js
  },

  // Cấu hình lọc Email ngân hàng
  bank: {
    sender: 'vietcombank.com.vn', // Miền email Vietcombank
    subjectKeywords: ['bien dong', 'thong bao', 'giao dich'] // Từ khóa
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
 * Hàm phân tích nội dung Email VCB
 * VCB: TK 9344559968 +10,000 VND luc ... ND: LUMIE 4. Ma GD: 123...
 */
const parseVCBEmail = (text) => {
  try {
    // 1. Phân tích số tiền
    const amountMatch = text.match(/\+([0-9,.]+)\s*VND/i);
    if (!amountMatch) return null;

    // 2. Phân tích nội dung (ND: ...)
    const memoMatch = text.match(/ND:\s*(.*?)(?:\.\s*Ma GD:|\.\s*luc|\s*\||$)/i);

    // 3. Phân tích số tài khoản (TK ...)
    const accountMatch = text.match(/TK\s*(\d+)/i);

    // 4. Mã giao dịch (Ma GD: ...)
    const txIdMatch = text.match(/Ma GD:\s*([a-zA-Z0-9]+)/i);

    const amount = amountMatch[1].replace(/[,.]/g, '');
    const memo = memoMatch ? memoMatch[1].trim() : '';
    const bankAccount = accountMatch ? accountMatch[1] : '9344559968';
    const transactionId = txIdMatch ? txIdMatch[1] : `VCB_${Date.now()}_${amount}`;

    return { amount, memo, transactionId, bankAccount };
  } catch (err) {
    console.error('Lỗi khi phân tích Email VCB:', err);
    return null;
  }
};

const main = async () => {
  console.log('🚀 Đang khởi động hệ thống theo dõi Vietcombank...');

  try {
    await client.connect();
    console.log('✅ Đã kết nối tới Gmail thành công.');

    // Chọn hòm thư INBOX
    let lock = await client.getMailboxLock('INBOX');

    try {
      // Mỗi khi có email mới
      client.on('exists', async (data) => {
        const count = data.count;
        console.log(`📩 [Mail Box] Phát hiện thấy tổng cộng ${count} thư.`);

        // Lấy email mới nhất
        const message = await client.fetchOne(count.toString(), { source: true });
        const parsed = await simpleParser(message.source);

        const from = (parsed.from?.value?.[0]?.address || '').toLowerCase();
        const subject = (parsed.subject || '').toLowerCase();
        const body = parsed.text || parsed.html || '';

        console.log(`📬 [Mới] Từ: ${from} | Tiêu đề: ${parsed.subject}`);

        // Bộ lọc VCB
        const isFromBank = from.includes('vietcombank.com.vn');
        const hasKeywords = subject.includes('bien dong') || subject.includes('thong bao') || subject.includes('giao dich') || body.toLowerCase().includes('nd:');

        if (isFromBank && hasKeywords) {
          console.log('🔍 [VCB] Khớp Mail thông báo! Đang phân tích dữ liệu...');

          const data = parseVCBEmail(body);

          if (data && parseInt(data.amount) > 0) {
            console.log(`💰 [GD] +${parseInt(data.amount).toLocaleString()}đ | ND: ${data.memo}`);

            // Gửi sang API Store
            try {
              const response = await axios.post(CONFIG.api.url, {
                secret: CONFIG.api.secret,
                amount: data.amount,
                memo: data.memo,
                transactionId: data.transactionId,
                bankName: 'Vietcombank',
                bankAccount: data.bankAccount
              });

              if (response.data.status === 'processed') {
                console.log(`✅ [OK] Đã nạp thành công cho: ${response.data.username}`);
              } else if (response.data.status === 'duplicate') {
                console.log('⚠️ [Bỏ qua] Giao dịch này đã được ghi nhận trước đó.');
              }
            } catch (apiErr) {
              const errMsg = apiErr.response?.data?.message || apiErr.message;
              console.error(`❌ [Lỗi Server] ${errMsg}`);
            }
          } else {
            console.log('⚠️ [Skip] Không tìm thấy số tiền hoặc nội dung mã nạp.');
          }
        } else {
          console.log('📧 [Skip] Thư này không phải thông báo BIDV.');
        }
      });

      // Giữ kết nối Idle để nhận mail real-time
      console.log('📡 Đang lắng nghe email mới (Real-time mode)...');
      while (true) {
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
