# 🏦 HƯỚNG DẪN TREO MÁY - AUTO BANKING BIDV

Hệ thống của bạn đã được thiết kế để tự động 100%. Đây là cách để bạn chạy hệ thống giám sát trên máy tính của mình.

## 1. Chuẩn bị Gmail (Bắt buộc)
Để script đọc được Email thông báo từ BIDV, bạn cần:
1.  Truy cập: [Tài khoản Google - Bảo mật](https://myaccount.google.com/security).
2.  Đảm bảo đã bật **Xác minh 2 bước**.
3.  Vào mục **Mật khẩu ứng dụng (App Password)**.
4.  Tại mục "Chọn ứng dụng", chọn **Khác (Tên tùy chỉnh)** và điền: `Lumie Auto Bank`.
5.  Copy mã **16 ký tự** màu vàng (Ví dụ: `abcd efgh ijkl mnop`).

## 2. Cấu hình Script `bank-monitoring.js`
Mở file `scripts/bank-monitoring.js` bằng Notepad hoặc VS Code. Sửa các thông tin sau:
*   `email.user`: Địa chỉ Gmail của bạn.
*   `email.pass`: Mã 16 ký tự vừa lấy ở trên.
*   `api.url`: Link API của bạn trên Vercel (Ví dụ: `https://lumiestore.vercel.app/api/internal/bank-sync`).
*   `api.secret`: Giữ nguyên hoặc đặt lại (phải khớp với Vercel).

## 3. Khởi chạy giám sát
Mở Terminal/CMD tại thư mục dự án trên máy tính:

**Cài đặt thư viện:**
```bash
npm install imapflow axios mailparser
```

**Chạy script:**
```bash
node scripts/bank-monitoring.js
```

---

## 🚦 Kiểm tra hoạt động:
*   Nếu thấy hiện: `✅ Đã kết nối tới Gmail thành công.` -> Máy của bạn đã sẵn sàng.
*   Khi có khách chuyển khoản BIDV -> Gmail báo Email -> Script mất 1-2 giây để gửi lệnh cộng tiền lên Store.
*   Lưu ý: Không tắt cửa sổ Terminal/CMD này để hệ thống hoạt động liên tục.

---
*Dự án được hoàn thành bởi Antigravity AI.*
