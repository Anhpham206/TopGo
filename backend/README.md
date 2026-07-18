# 🖥️ TopGo Backend - FastAPI Server

Hệ thống Backend của TopGo được xây dựng trên nền tảng **FastAPI (Python)**, mang lại hiệu suất cực cao, khả năng xử lý bất đồng bộ hoàn hảo (async/await), và tự động hóa sinh tài liệu API (Swagger).

Backend đảm nhận vai trò cốt lõi trong việc điều phối luồng tạo lịch trình thông minh theo luồng (streaming), xử lý thuật toán tối ưu tuyến đường địa lý, tích hợp AI tư vấn (Gemini), quét khách sạn (SerpAPI), và đồng bộ dữ liệu người dùng qua Firebase Admin SDK.

---

## 📁 Cấu Trúc Mã Nguồn Backend

```
/backend
├── app/
│   ├── main.py                    # Điểm khởi chạy FastAPI & Cấu hình static server
│   ├── controllers/               # Xử lý luồng logic nghiệp vụ nâng cao
│   │   ├── chatbot_controller.py  # Điều phối trợ lý ảo (Quản lý session FIFO)
│   │   ├── generate_controller.py # Nhạc trưởng điều phối tạo lịch trình (5 bước Stream)
│   │   ├── saved_plans_controller.py # CRUD lịch trình với Cloud Firestore
│   │   ├── user_controller.py     # Đọc/ghi hồ sơ thành viên, theo dõi/hủy theo dõi
│   │   ├── feed_controller.py     # Xây dựng bảng tin cá nhân (Feed) và xu hướng (Trending)
│   │   ├── post_controller.py & post_controller_extensions.py # CRUD bài đăng, like, comment, repost
│   │   ├── payment_controller.py  # Tạo link thanh toán VIP & xử lý kết quả VNPay
│   │   ├── search_controller.py   # Thực hiện tìm kiếm bài viết, địa danh và người dùng
│   │   ├── hot_search_controller.py # Phân tích dữ liệu & gợi ý từ khóa tìm kiếm hot
│   │   ├── itinerary_controller.py # Quản lý chia sẻ và lấy thông tin chi tiết lịch trình công khai
│   │   └── reviews_controller.py  # Fetch review địa điểm từ Google Maps qua SerpAPI
│   ├── routes/                    # Định nghĩa các đầu cuối API (Endpoints)
│   │   └── api.py                 # Thiết lập router và phân cấp API bảo mật
│   └── services/                  # Phân hệ dịch vụ thuật toán, AI, Database
│       ├── firebase_service.py    # Khởi tạo SDK Admin & Dependency xác thực Token
│       ├── ai_logic/              # Tích hợp LLM Gemini qua Google GenAI SDK
│       │   ├── ai_logic.py        # Logic tạo lịch trình (AI 1, AI 2)
│       │   ├── chatbot.py         # Chatbot thông minh, phân loại Intent & gợi ý ẩm thực
│       │   └── ai_moderation.py   # Kiểm duyệt nội dung bài đăng/comment qua AI
│       ├── hotel/                 # Quét Google Maps qua SerpAPI & quy đổi tiền tệ
│       │   └── hotel.py
│       ├── routing_service/       # Thuật toán tối ưu tuyến đường, phân cụm địa lý
│       │   └── routing_service.py
│       ├── comment/               # Module phụ trợ cho bài đăng & bình luận
│       │   └── seed_reviews.py    # Seed dữ liệu review ngẫu nhiên cho bài đăng
│       ├── hot_search_service.py  # Quản lý lịch sử và xếp hạng từ khóa tìm kiếm hot
│       ├── idor_middleware.py     # Middleware phòng chống lỗ hổng truy cập IDOR
│       ├── validation_service.py  # Phân tích & xác thực định dạng payload gửi lên
│       └── vnpay_service.py       # Ký số & tạo URL giao dịch VNPay Sandbox
├── requirements.txt               # Danh sách thư viện Python phụ thuộc
├── .env                           # File cấu hình biến môi trường và API Keys
└── firebase-service-account.json  # File Private Key liên kết Firebase Console (Service Account)
```

---

## 🔑 Hướng Dẫn Cấu Hình Biến Môi Trường (`.env`)

Tạo file `.env` tại thư mục `/backend` từ file mẫu `.env.example` và điền đầy đủ các thông tin cấu hình dưới đây để kích hoạt tất cả các dịch vụ:

```ini
# --- Cấu hình API Keys của Google Gemini (Google GenAI) ---
# API Key chính dùng cho phân hệ tạo lịch trình thông minh (AI 1)
GEMINI_API_KEY_1="AIzaSy..."

# API Key phụ dùng cho phân hệ tổng hợp lịch trình và đề xuất (AI 2)
GEMINI_API_KEY_2="AIzaSy..."

# API Key dùng cho tính năng Chatbot tư vấn hội thoại thường
GEMINI_API_KEY_FOR_CHATBOT="AIzaSy..."

# API Key dùng cho Chatbot phân tích đề xuất ẩm thực
GEMINI_API_KEY_FOR_CHATBOT_RCM="AIzaSy..."

# --- Cấu hình SerpAPI (Google Maps Hotels API) ---
# API Key dùng để quét khách sạn xung quanh tâm điểm hành trình
SERP_API_KEY="your_serpapi_key_here"

# --- Cấu hình Firebase Admin SDK Path (Tùy chọn nếu đổi tên file) ---
FIREBASE_CREDENTIALS_PATH="firebase-service-account.json"
```

---

## 🛡️ Bản Đồ API Endpoints & Xác Thực Bảo Mật

Tất cả các API được đăng ký tiền tố `/api` trong `backend/app/routes/api.py`. Các API bảo mật yêu cầu Client truyền kèm Firebase ID Token dạng `Authorization: Bearer <id_token>` tại Request Header để xác thực thông qua Dependency `verify_firebase_token`.

### 👥 1. Nhóm API Công Cộng (Public API)
* **`POST /api/generate`**: Nhận yêu cầu tạo lịch trình, trả về dữ liệu streaming theo định dạng `application/x-ndjson` qua 5 bước phản hồi.
* **`POST /api/chat`**: Gửi tin nhắn và nhận phản hồi trò chuyện từ Trợ lý ảo TopGo.
* **`GET /api/users/{userId}/profile` & `GET /api/users/{uid}/public-profile`**: Xem hồ sơ công khai của người dùng khác.
* **`GET /api/users/{uid}/posts` & `GET /api/users/{uid}/plans`**: Lấy bài viết và lịch trình đã chia sẻ công khai của một thành viên.
* **`GET /api/itineraries/{itinerary_id}`**: Lấy chi tiết lịch trình được chia sẻ.
* **`GET /api/posts/{post_id}` & `GET /api/posts/{post_id}/comments`**: Lấy bài viết chi tiết và bình luận liên quan.
* **`GET /api/locations/{location_name}/posts`**: Lấy danh sách bài viết theo địa danh.
* **`GET /api/hot-search` & `GET /api/search`**: Lấy từ khóa tìm kiếm hot và thực hiện tìm kiếm bài viết, người dùng, địa danh.
* **`GET /api/google-reviews`**: Lấy đánh giá địa danh từ Google Maps qua SerpAPI.

### 🔒 2. Nhóm API Thành Viên (Protected API)
* **`POST /api/plans/save`**: Lưu lịch trình du lịch cá nhân vào Firestore dưới dạng chuỗi JSON đã mã hóa (tránh lỗi nested array).
* **`GET /api/plans/list`**: Truy xuất danh sách lịch trình đã lưu của người dùng hiện tại (sắp xếp giảm dần theo thời gian).
* **`DELETE /api/plans/{plan_id}`**: Xóa một lịch trình cụ thể của người dùng khỏi database.
* **`POST /api/plans/{plan_id}/clone`**: Nhân bản lịch trình của người dùng khác thành lịch trình của mình.
* **`GET /api/users/profile` & `POST /api/users/profile`**: Đọc/ghi thông tin hồ sơ cá nhân hiện tại.
* **`POST /api/users/{uid}/follow` & `POST /api/users/{uid}/unfollow`**: Theo dõi / Hủy theo dõi thành viên khác.
* **`GET /api/users/{uid}/follow-status`**: Lấy trạng thái theo dõi giữa hai người dùng.
* **`POST /api/posts/create`**: Đăng bài viết chia sẻ lịch trình và cảm xúc mới lên MXH.
* **`PUT /api/posts/{postId}` & `DELETE /api/posts/{postId}`**: Chỉnh sửa / Xóa bài viết cá nhân.
* **`POST /api/posts/{post_id}/like` & `GET /api/posts/{post_id}/like-status`**: Thích bài đăng / Kiểm tra trạng thái thích.
* **`POST /api/posts/{post_id}/comments`**: Bình luận bài đăng (nội dung đi qua AI kiểm duyệt an toàn).
* **`POST /api/posts/{post_id}/repost`**: Chia sẻ lại bài viết của người khác (repost).
* **`GET /api/feed/{tab}`**: Lấy danh sách bài viết cho dòng thời gian bảng tin (Personal Feed / Trending Feed).
* **`POST /api/payment/vnpay_create`**: Tạo URL thanh toán VNPay Sandbox nâng cấp VIP.
* **`GET /api/payment/vnpay_return` & `GET /api/payment/vnpay_ipn`**: Xử lý kết quả giao dịch VNPay trả về từ cổng thanh toán.

---

## ⚙️ Hướng Dẫn Cài Đặt & Chạy Server Backend

### Bước 1: Tạo Môi Trường Ảo (Virtual Environment)
Di chuyển vào thư mục backend và khởi tạo môi trường venv để cô lập thư viện phụ thuộc:
```bash
cd backend
python -m venv venv
```

### Bước 2: Kích Hoạt Môi Trường Ảo
* **Trên Windows (PowerShell):**
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
* **Trên Windows (Command Prompt):**
  ```cmd
  .\venv\Scripts\activate.bat
  ```
* **Trên macOS/Linux:**
  ```bash
  source venv/bin/activate
  ```

*(Khi kích hoạt thành công, bạn sẽ thấy ký hiệu `(venv)` xuất hiện ở đầu dòng Terminal).*

### Bước 3: Cài Đặt Các Thư Viện Phụ Thuộc
Cập nhật `pip` và tải toàn bộ các gói phần mềm cần thiết:
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Bước 4: Tích Hợp Firebase Private Key JSON
Tải tệp Service Account private key `.json` từ **Firebase Console > Project Settings > Service accounts > Generate new private key**. Đổi tên tệp thành `firebase-service-account.json` và đặt trực tiếp tại thư mục `/backend`.

### Bước 5: Khởi Chạy Server
Khởi chạy dịch vụ FastAPI bằng trình chủ Uvicorn:
```bash
python -m app.main
```
Hoặc chạy trực tiếp bằng lệnh uvicorn:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Địa chỉ chạy thực tế**: **http://localhost:8000**
* **Trang tài liệu tương tác tự động Swagger UI**: **http://localhost:8000/docs**
* **Trang Redoc**: **http://localhost:8000/redoc**

---

## 🎨 Lưu Ý Quan Trọng Về Định Tuyến Frontend
Backend FastAPI được thiết lập cấu hình tích hợp để tự động phục vụ (serve) toàn bộ tài nguyên tĩnh của Frontend:
* Toàn bộ mã nguồn thư mục `/frontend` được mount tại đường dẫn `/` (phải khai báo sau cùng sau khi đã đăng ký toàn bộ các endpoint API).
* Người dùng chỉ cần truy cập **http://localhost:8000** trên trình duyệt để trải nghiệm toàn bộ ứng dụng (bao gồm cả giao diện lẫn API) mà không cần phải chạy thêm máy chủ web riêng cho frontend.