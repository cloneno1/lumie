# 🚀 Hướng Dẫn Nạp Tiền Qua Android 24/7 (Vietcombank) - CẬP NHẬT

Đây là phương pháp **nhanh nhất và ổn định nhất** để tự động cộng tiền khi khách chuyển khoản.

### 📋 Bước 1: Chuẩn bị Điện thoại Android
1.  Dùng 1 điện thoại Android luôn bật (để ở nhà cắm sạc).
2.  Cài App **Vietcombank (Digibank)**: Bật tính năng **"Thông báo biến động số dư qua App (OTT)"** (Tắt SMS để tiết kiệm phí).
3.  Cài App **MacroDroid** từ Google Play.

### ⚙️ Bước 2: Cấu hình MacroDroid (QUAN TRỌNG)

#### 1. Triggers (Kích hoạt):
*   Add Macro -> **Triggers** -> Notification -> **Notification Received**.
*   Chọn App **Vietcombank**.
*   Text Content: Chọn **Any**.

#### 2. Actions (Hành động):
*   **Actions** -> **HTTP Request**.
*   Method: `POST`.
*   URL: `https://lumiestore.uk/api/internal/bank-sync`
*   Content Type: `application/json`
*   **Body (Phần này quan trọng nhất - KHÔNG ĐƯỢC NHẬP TAY):**

Copy đoạn dưới đây dán vào Body:
```json
{
  "secret": "lumie_auto_bank_secure_2024",
  "notification_body": "{not_text}",
  "transactionId": "{not_id}"
}
```

> [!CAUTION]
> **DẤU NGOẶC KÉP QUAN TRỌNG:** Trong ô Body của MacroDroid, bạn PHẢI để dấu ngoặc kép bao quanh các biến, ví dụ: **`"{not_text}"`**. Nếu thiếu dấu **`"`**, hệ thống sẽ báo lỗi `Syntax Error` và không cộng tiền được.

#### 3. Constraints (Điều kiện lọc):
*   **Constraints** -> Notification Content -> **Text Content Match**.
*   Nhập: `LUMIE` (Để máy chỉ gửi tin nhắn khi khách ghi đúng mã nạp).

### 🏁 Kiểm tra
1.  Lưu Macro với tên `Auto Bank Lumie`.
2.  Thử chuyển khoản 1.000đ với nội dung: `LUMIE [ID_CỦA_BẠN]` (Lấy ID trong trang Nạp tiền).
3.  Nếu thành công, Server sẽ báo `[BANK_SYNC_SUCCESS]` trong console.

---
**Mẹo:** Nếu vẫn lỗi, hãy kiểm tra xem bạn đã cấp quyền "Truy cập thông báo" cho MacroDroid trong cài đặt điện thoại chưa.
