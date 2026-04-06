# 🚀 Hướng Dẫn Tạm Biệt Email - Nạp Tiền Qua Android 24/7 (Vietcombank)

Đây là phương pháp **nhanh nhất, an toàn và ổn định nhất** hiện nay cho các Website Store cá nhân.

### 📋 Bước 1: Chuẩn bị Điện thoại Android
1.  Dùng 1 chiếc điện thoại Android có kết nối WiFi/3G ổn định (nên để ở nhà cắm sạc treo).
2.  Cài đặt Ứng dụng **Vietcombank (Digibank)** và đăng nhập.
3.  **QUAN TRỌNG:** Phải bật tính năng **"Thông báo biến động số dư qua App (Push Notification)"** trong phần Cài đặt của Vietcombank (tắt thông báo qua SMS đi để tiết kiệm phí).
4.  Cài đặt Ứng dụng **MacroDroid** (Miễn phí trên Google Play Store).

### ⚙️ Bước 2: Cài đặt MacroDroid (Làm theo đúng 3 bước)

#### 1. Tạo Triggers (Kích hoạt):
*   Bấm **Add Macro** -> Chọn tab **Triggers**.
*   Chọn **Notification** -> **Notification Received**.
*   Chọn **Select Application** -> Tìm và chọn App **Vietcombank**.
*   Phần **Text Content** -> Chọn **Any**.

#### 2. Tạo Actions (Hành động):
*   Chọn tab **Actions** -> Chọn **HTTP Request**.
*   **Method:** Chọn `POST`.
*   **URL:** `https://lumiestore.uk/api/internal/bank-sync`
*   **Content Type:** `application/json`
*   **Body:** (Copy và dán nguyên văn đoạn dưới đây):
```json
{
  "secret": "lumie_auto_bank_secure_2024",
  "amount": "{not_body}",
  "memo": "{not_body}",
  "transactionId": "{not_id}",
  "bankName": "Vietcombank_Android"
}
```
*(Lưu ý: Thay `lumie_auto_bank_secure_2024` bằng mã Secret bạn đã đặt trong backend)*.

#### 3. Tạo Constraints (Điều kiện - Để tránh báo sai):
*   Chọn tab **Constraints** -> Chọn **Notification Content**.
*   Phần **Text Content Match** -> Gõ: `LUMIE` (Để máy chỉ gửi khi thấy nội dung chuyển khoản có chữ LUMIE).

### 🏁 Hoàn tất
1.  Đặt tên cho Macro là `Gửi thông báo VCB lên Store`. Bấm dấu cộng để **Save (Lưu)**.
2.  Bây giờ, hễ bạn nhận được tiền mà có nội dung `LUMIE [ID]`, thì trong vòng **0.5 giây**, tiền sẽ được cộng ngay lập tức vào Store!

---
**LƯU Ý:** 
- Đảm bảo App Vietcombank và MacroDroid không bị điện thoại tự động tắt (Hãy cho phép chạy ngầm và bỏ tối ưu pin).
- Bạn không cần treo máy tính cá nhân để nhận Mail nữa!
