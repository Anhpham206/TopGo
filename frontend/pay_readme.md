# Hướng dẫn Thiết lập & Tích hợp Cổng thanh toán VNPay Sandbox

Tài liệu này hướng dẫn các bước thiết lập cổng thanh toán VNPay Sandbox để mua gói VIP Premium cho ứng dụng TopGo.

---

## 1. Cơ chế hoạt động (Luồng Thanh toán)

```
[Người dùng]                 [Frontend (Port 3000)]          [Backend (Port 8000)]          [VNPay Gateway]
     │                                 │                               │                          │
     │─── Bấm "Mua gói VIP" ──────────>│                               │                          │
     │                                 │─── Yêu cầu tạo Payment URL ──>│                          │
     │                                 │    (Gửi Token & Gói dịch vụ)  │                          │
     │                                 │                               │─── Tính chữ ký số ──────>│
     │                                 │<── Trả lại Payment URL ───────│                          │
     │<── Chuyển hướng sang VNPay ─────│                               │                          │
     │                                 │                                                          │
     │─── Tiến hành thanh toán thẻ test ─────────────────────────────────────────────────────────>│
     │                                                                                            │
     │<── Redirect người dùng sau thanh toán ─────────────────────────────────────────────────────│
     │   (Chuyển hướng kèm theo các tham số kết quả và chữ ký vnp_SecureHash)                     │
     │                                                                                            │
     │─── (Redirect về Endpoint verify) ──────────────────────────────>│                          │
     │                                                                 │─── Kiểm tra chữ ký số ───│
     │                                                                 │─── Cập nhật VIP (Firestore)
     │                                                                 │─── Lưu Transaction Log   │
     │<── Chuyển hướng kèm trạng thái (Redirect 303) ──────────────────│                          │
     │   (Trở về trang pricing.html?payment=success&package=...)       │                          │
     │                                 │                                                          │
     │─── Đọc Query Params ───────────>│                                                          │
     │─── Hiển thị Toast thông báo ───>│                                                          │
     │─── Cập nhật User Profile local ─>│                                                          │
```

---

## 2. Các bước thiết lập VNPay Sandbox

### Bước 1: Đăng ký tài khoản Sandbox
1. Truy cập vào trang quản lý dành cho nhà phát triển của VNPay: [https://sandbox.vnpayment.vn/devreg/](https://sandbox.vnpayment.vn/devreg/)
2. Điền đầy đủ thông tin để đăng ký tài khoản Sandbox mới.
3. Sau khi đăng ký thành công, kiểm tra email của bạn để nhận thông tin cấu hình từ VNPay.

### Bước 2: Lấy thông tin cấu hình
Trong email nhận được từ VNPay, tìm 2 thông tin quan trọng sau:
*   **vnp_TmnCode** (Mã định danh website - ví dụ: `2QX2VWD9`)
*   **vnp_HashSecret** (Chuỗi bí mật tạo chữ ký - ví dụ: `1Z9Z5Y9W7Y9Z6Y9W5Y9Z6Y9W5Y9Z6Y9W`)

### Bước 3: Cấu hình biến môi trường tại Backend
Mở file `backend/.env` và cập nhật thông tin của bạn vào các trường tương ứng:

```env
# Cấu hình cổng thanh toán VNPay Sandbox
VNPAY_TMN_CODE=MÃ_TMN_CODE_CỦA_BẠN
VNPAY_HASH_SECRET=CHUỖI_HASH_SECRET_CỦA_BẠN
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:8000/api/payment/vnpay_return
VNPAY_FRONTEND_REDIRECT=http://localhost:3000/pricing.html
```

---

## 3. Hướng dẫn thử nghiệm thanh toán

Khi được chuyển hướng tới cổng thanh toán VNPay Sandbox, thực hiện các bước sau để test:

1.  **Chọn phương thức thanh toán**: Chọn **"Ứng dụng thanh toán hỗ trợ VNPAY-QR"** hoặc **"Thẻ nội địa và tài khoản ngân hàng"**.
2.  **Thông tin thẻ test (Dùng Ngân hàng NCB)**:
    *   **Ngân hàng**: NCB (Ngân hàng Quốc Dân)
    *   **Số thẻ**: `9704198526136477`
    *   **Tên chủ thẻ**: `NGUYEN VAN A`
    *   **Ngày phát hành**: `07/15`
    *   **Mã OTP**: Nhập `123456`
3.  Bấm xác nhận để thanh toán hoàn tất. Hệ thống sẽ tự động chuyển hướng người dùng quay trở lại trang web TopGo và nâng cấp VIP ngay lập tức.
