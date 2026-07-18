# 🌍 TopGo - Nền Tảng Hỗ Trợ Du Lịch Thông Minh (Smart Tourism)

**TopGo** là một giải pháp chuyển đổi số toàn diện trong ngành du lịch, được thiết kế dưới dạng nền tảng hỗ trợ lên kế hoạch du lịch thông minh, đánh giá địa điểm tối ưu, và cung cấp trợ lý ảo tư vấn hành trình. Hệ thống tự động phân cụm địa lý, tối ưu hóa chu trình đường đi theo ngày và đề xuất nơi lưu trú lý tưởng dựa trên công nghệ học máy tích hợp Trí tuệ Nhân tạo (Generative AI) và dữ liệu thực tế.

---

## 🎨 Các Tính Năng Nổi Bật của TopGo

* **🤖 Lập Lịch Trình Tự Động Với Generative AI**: Tích hợp các mô hình Gemini (`gemini-3.1-flash-lite` và `gemini-3.5-flash`) thông qua quy trình 5 bước streaming mạnh mẽ để nhận diện hành vi, phân tích trọng số người dùng và biên soạn lịch trình chi tiết từng giờ.
* **📍 Tối Ưu Hóa Tuyến Đường Địa Lý (Routing Service)**: Áp dụng thuật toán **Far-First Seed** (gieo điểm xa trung tâm trước) kết hợp **Savings Heuristic Nearest Neighbor** (tối ưu hóa quãng đường di chuyển và thời gian đóng/mở cửa của các điểm tham quan). Sử dụng **OSRM Table & Route API** để xuất bản đồ nhiệt và hình học GeoJSON trực quan.
* **🏨 Đề Xuất Nơi Lưu Trú Thực Tế (Hotel Service)**: Tìm kiếm khách sạn, resort, homestay quanh tâm hành trình qua **SerpAPI (Google Maps API)**. Tự động quy đổi tiền tệ sang VNĐ thời gian thực (tích hợp API tỷ giá) và thu thập đánh giá của khách hàng (Reviews topics) để làm tag tiện ích.
* **💬 Trợ Lý Ảo Chatbot Đa Nhiệm**: Đóng vai trò hướng dẫn viên ảo dễ thương với 4 phân hệ AI riêng: Tự động nhận diện ý định ăn uống (`Intent Classifier`), trích xuất địa danh (`Location Extractor`), đọc cẩm nang và gợi ý top 5 quán ăn đặc sản từ dữ liệu JSON địa phương, hoặc trò chuyện an toàn theo ngữ cảnh.
* **🔥 Tích Hợp Hệ Sinh Thái Firebase**:
  * **Firebase Authentication**: Hỗ trợ đăng nhập Google bằng Popup hoặc đăng ký bằng tài khoản Email/Password với cơ chế hiển thị lỗi trực tiếp (real-time validation) tinh tế.
  * **Cloud Firestore**: Lưu trữ thông tin cá nhân dạng **Hộ chiếu thành viên (Passport Book)**.
  * **Lưu Trữ Lịch Trình Cá Nhân**: Cho phép lưu, liệt kê và xóa hành trình. Xử lý đồng bộ hóa chuỗi dữ liệu phức tạp tránh lỗi mảng lồng nhau (nested arrays) và hỗ trợ xem lại lịch trình cũ tức thì không cần gọi lại AI.
  * **Avatar Upload**: Nén ảnh chân dung bằng thẻ Canvas thành chuỗi Base64 nhẹ nhàng để lưu trữ trực tiếp lên database.

---

## 📁 Cấu Trúc Mã Nguồn Dự Án

Dự án được phân cấp rõ ràng theo mô hình Client-Server hiện đại:

```
/TopGo
├── backend/                       # Hệ thống máy chủ (FastAPI + Python)
│   ├── app/
│   │   ├── main.py                # Điểm chạy FastAPI chính & Mount Static Frontend
│   │   ├── controllers/           # Điều phối luồng nghiệp vụ (Chatbot, Generate, Saved Plans, User, Feed, Post, Payment, Search, reviews,...)
│   │   ├── routes/                # Định nghĩa API Endpoints (api.py)
│   │   └── services/              # Logic thuật toán, Database & LLM (ai_logic, comment, hotel, routing_service, firebase_service, hot_search_service, idor_middleware, validation_service, vnpay_service)
│   ├── requirements.txt           # Danh sách thư viện Python
│   ├── .env                       # Chứa API Keys bảo mật (Cần tạo thủ công)
│   └── firebase-service-account.json # Private Key quản trị Firebase (Cần tải về console)
├── frontend/                      # Giao diện người dùng tĩnh (HTML5, CSS3, Vanilla JS)
│   ├── index.html                 # Trang Landing Page giới thiệu nền tảng
│   ├── planner.html               # Công cụ tạo và tương tác bản đồ hành trình du lịch (AI Planner)
│   ├── auth.html                  # Giao diện Đăng nhập / Đăng ký
│   ├── profile.html               # Trang Hộ chiếu thành viên & Quản lý lịch trình cá nhân/bài đăng
│   ├── chatbot.html               # Giao diện Trợ lý ảo tư vấn du lịch (TopChat)
│   ├── feed.html                  # Giao diện mạng xã hội du lịch (Newsfeed)
│   ├── trending.html              # Trang các bài viết nổi bật & Địa điểm tìm kiếm hot
│   ├── search.html                # Công cụ tìm kiếm bài viết, địa điểm, người dùng
│   ├── pricing.html               # Trang nâng cấp tài khoản VIP và thanh toán VNPay
│   ├── location.html              # Trang chi tiết địa điểm du lịch & bài viết liên quan
│   ├── aboutus.html               # Trang giới thiệu về dự án và đội ngũ TopGo
│   ├── terms.html                 # Trang điều khoản sử dụng nền tảng
│   ├── reviews.html               # Thành phần hiển thị đánh giá Google Reviews
│   ├── components/                # Các mảnh HTML dùng chung (header.html, footer.html, loading.html, result.html)
│   ├── css/                       # Toàn bộ mã nguồn CSS thiết kế tinh tế
│   └── js/                        # Logic JS tương tác giao diện và gọi API
└── dataset/                       # Sổ tay dữ liệu du lịch & ẩm thực (JSON) cho từng địa danh
```

---

## 🛠️ Công Nghệ Sử Dụng

| Hợp phần | Công nghệ tích hợp |
| :--- | :--- |
| **Giao diện (Frontend)** | HTML5, CSS3 (Vanilla), JavaScript (ES6+), Leaflet.js (Interactive Maps) |
| **Máy chủ (Backend)** | Python 3.10+, FastAPI (Asynchronous Framework), Uvicorn |
| **Xác thực & Cơ sở dữ liệu** | Firebase Authentication, Cloud Firestore Database (Firebase Admin SDK & Web SDK) |
| **Trí tuệ Nhân tạo** | Google Gemini (SDK `google-genai`), các mô hình `gemini-3.1-flash-lite` và `gemini-3.5-flash` |
| **Định vị & Đường đi** | OpenStreetMap (OSRM API), Nominatim Geocoding API |
| **Quét dữ liệu thực tế** | SerpAPI (Google Maps Local Search, Reviews API), Open Exchange Rates API |

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án Chi Tiết

Hệ thống được thiết kế để **FastAPI phục vụ cả giao diện Frontend**, vì vậy bạn chỉ cần khởi chạy một cổng máy chủ duy nhất để vận hành toàn bộ ứng dụng.

### Bước 1: Clone mã nguồn dự án
```bash
git clone <đường_dẫn_repository>
cd TopGo
```

### Bước 2: Cài đặt và cấu hình Hệ thống Backend

1. **Khởi tạo môi trường ảo (venv) và kích hoạt:**
   ```bash
   cd backend
   python -m venv venv
   
   # Kích hoạt trên Windows (PowerShell):
   .\venv\Scripts\Activate.ps1
   # Kích hoạt trên Windows (CMD):
   .\venv\Scripts\activate.bat
   # Kích hoạt trên macOS/Linux:
   source venv/bin/activate
   ```

2. **Cài đặt các gói thư viện phụ thuộc:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

3. **Cấu hình tệp biến môi trường (`.env`):**
   Copy nội dung từ file mẫu `.env.example` tạo thành file `.env` tại thư mục `/backend` và điền đầy đủ các khóa API của bạn:
   ```ini
   # API Keys của Google Gemini (Google GenAI)
   GEMINI_API_KEY_1="AIzaSyYourGeminiKey1..."
   GEMINI_API_KEY_2="AIzaSyYourGeminiKey2..."
   GEMINI_API_KEY_FOR_CHATBOT="AIzaSyYourGeminiKey3..."
   GEMINI_API_KEY_FOR_CHATBOT_RCM="AIzaSyYourGeminiKey4..."

   # SerpAPI (Google Maps Hotels API)
   SERP_API_KEY="your_serp_api_key_here"
   ```

---

## 🔥 Hướng Dẫn Thiết Lập & Đồng Bộ Firebase

Để đồng bộ hoàn hảo các tính năng đăng nhập Google, lưu trữ Hộ chiếu thành viên và hành trình cá nhân, hãy thực hiện các bước cấu hình Firebase sau (theo nội dung hướng dẫn thiết lập bên dưới):

### 1. Cấu hình Firebase Console (Phía Cloud)
1. Truy cập vào [Firebase Console](https://console.firebase.google.com/) và tạo một dự án mới tên là **TopGo**.
2. **Kích hoạt Authentication**:
   * Vào mục **Build** > **Authentication** > chọn **Get Started**.
   * Tại tab **Sign-in method**, bật trạng thái **Enable** cho nhà cung cấp **Google** và **Email/Password** (chỉ kích hoạt email/password cơ bản, không cần passwordless). Điền thông tin hỗ trợ và lưu lại.
3. **Kích hoạt Cloud Firestore Database**:
   * Vào mục **Build** > **Firestore Database** > chọn **Create database**.
   * Chọn khu vực lưu trữ gần Việt Nam nhất (Ví dụ: `asia-southeast1`).
   * Chọn chế độ bảo mật **Start in test mode** (Chế độ thử nghiệm) và nhấn tạo.

### 2. Thiết lập Private Key cho Backend (FastAPI)
1. Trên Firebase Console, nhấp biểu tượng bánh răng cưa ⚙️ (**Project settings**) > chọn tab **Service accounts**.
2. Nhấp nút **Generate new private key** > Xác nhận **Generate key** ở hộp thoại cảnh báo để tải file `.json` cấu hình.
3. Đổi tên tệp tin vừa tải về thành `firebase-service-account.json`.
4. Di chuyển tệp tin này trực tiếp vào thư mục backend của dự án:
   `TopGo/backend/firebase-service-account.json`

### 3. Thiết lập Web SDK Client cho Frontend
1. Tại tab **General** của trang **Project settings** trên Firebase Console, cuộn xuống phần **Your apps** > chọn biểu tượng Web (`</>`) để đăng ký ứng dụng.
2. Tạo file `firebaseConfig.js` tại thư mục `/frontend/js/`. Copy nội dung từ file mẫu `/frontend/js/firebaseConfig_example.js` sang và điền các thông số hiển thị từ Firebase Console của bạn:
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_PROJECT_ID.appspot.com",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   };
   ```
### 4. Hướng dẫn Thiết lập & Tích hợp Thanh toán VNPay (Sandbox)

Để tích hợp và kiểm thử tính năng mua gói VIP Premium thông qua VNPay Sandbox, thực hiện các bước sau:

### 1. Luồng Hoạt Động (Đa Cổng / Port-matching)
Do ứng dụng chạy trên hai cổng độc lập (Frontend chạy cổng `3000` và Backend chạy cổng `8000`), hệ thống sử dụng phương án xác thực chữ ký (Signature) tại Frontend thông qua AJAX:
1. Người dùng bấm **Mua gói VIP** tại trang `pricing.html`.
2. Frontend gửi yêu cầu tạo liên kết thanh toán sang Backend kèm `return_url` chỉ tới cổng `3000` (trùng khớp tên miền website đăng ký).
3. Backend tạo chữ ký số `HMAC-SHA512` theo tiêu chuẩn VNPay và trả lại link thanh toán.
4. Người dùng hoàn tất thanh toán trên VNPay Sandbox và được VNPay chuyển hướng ngược lại Frontend (`http://localhost:3000/pricing.html?...`).
5. Frontend trích xuất query parameters và gọi ngầm API Backend `/api/payment/vnpay_return` để kiểm tra chữ ký, cập nhật trạng thái VIP trong Firestore và hiển thị thông báo thành công.

### 2. Các Bước Thiết Lập
1. **Đăng ký tài khoản Sandbox**: Truy cập [https://sandbox.vnpayment.vn/devreg/](https://sandbox.vnpayment.vn/devreg/) để đăng ký một tài khoản Sandbox thử nghiệm miễn phí.
2. **Lấy thông tin cấu hình**: Nhận email từ VNPay chứa `vnp_TmnCode` (Mã website) và `vnp_HashSecret` (Chuỗi bí mật băm).
3. **Cấu hình Backend**: Điền các giá trị nhận được vào file `backend/.env` (tham khảo thêm mẫu tại [backend/.env.example](backend/.env.example)):
   ```env
   VNPAY_TMN_CODE=MÃ_TMN_CODE_CỦA_BẠN
   VNPAY_HASH_SECRET=CHUỖI_HASH_SECRET_CỦA_BẠN
   VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
   VNPAY_RETURN_URL=http://localhost:8000/api/payment/vnpay_return
   VNPAY_FRONTEND_REDIRECT=http://localhost:3000/pricing.html
   ```


---

## ⚙️ Vận Hành Hệ Thống

Sau khi cấu hình đầy đủ API Keys và tệp Firebase JSON, hãy thực hiện lệnh sau tại thư mục `/backend` (đảm bảo đã kích hoạt môi trường ảo `venv`):

```bash
python -m app.main
```
Hoặc:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

* **Trải nghiệm ứng dụng khách**: Mở trình duyệt và truy cập **http://localhost:8000** để sử dụng toàn bộ tính năng giao diện tương tác, bản đồ, tạo lịch trình, chatbot và quản lý hồ sơ.
* **Tài liệu API Swagger**: Truy cập **http://localhost:8000/docs** để thực hiện kiểm thử các API trực tuyến một cách dễ dàng.

---

## 🔍 Kịch Bản Kiểm Thử Trải Nghiệm Hệ Thống

Để đảm bảo toàn bộ hệ thống TopGo vận hành đồng bộ và chính xác, bạn có thể thực hiện kiểm thử theo các kịch bản sau:
1. **Đăng nhập Google**: Click **Đăng nhập** trên Header > chọn **Tiếp tục với Google**. Đăng nhập thành công, hệ thống tự động điều hướng sang trang cá nhân, đổi ảnh đại diện tròn và tên của bạn trên thanh điều hướng.
2. **Kiểm tra lỗi trùng Email**: Đăng xuất, bấm **Đăng ký ngay**, nhập đúng Email Google vừa dùng để đăng ký tài khoản mới. Trình duyệt hiển thị thông báo lỗi màu đỏ trực quan dưới trường nhập: *"Email này đã được sử dụng bởi một tài khoản khác"* thay vì sử dụng hàm `alert()`.
3. **Lập lịch trình thông minh**: Truy cập planner, điền thông tin du lịch và chọn địa điểm. Nhấn **Tạo lịch trình** để quan sát luồng streaming 5 bước vẽ đường đi. Bấm **Lưu lịch trình**, hệ thống hiển thị thông báo Toast thành công.
4. **Hộ chiếu thành viên**: Vào trang `profile.html` kiểm tra Hộ chiếu cá nhân và danh sách chuyến đi đã lưu. Tại đây bạn có thể cập nhật thông tin cá nhân, cập nhật avatar (chụp camera hoặc tải file ảnh nén canvas). Bấm nút **Xem lại** tại một chuyến đi đã lưu, hệ thống tự động chuyển hướng và vẽ lại nguyên vẹn lộ trình cũ mà không cần gọi lại AI Gemini.
5. **Chatbot tư vấn**: Mở khung chat, gõ *"Tôi muốn ăn phở ở Hà Nội"*. Hệ thống tự nhận diện Intent ẩm thực, trích xuất slug `ha_noi`, truy xuất dataset món ăn địa phương và dùng AI hiển thị danh sách 5 quán ăn nổi tiếng nhất Hà Nội đầy nhí nhảnh.

---



