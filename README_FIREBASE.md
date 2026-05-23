# 🔥 Hướng Dẫn Cấu Hình & Kiểm Thử Hệ Thống Firebase (TopGo)

Tài liệu này ghi nhận chi tiết tất cả các chức năng, cấu trúc file, hướng dẫn thiết lập và kiểm thử các cấu phần liên quan đến **Firebase (Authentication & Firestore)** được thêm mới vào dự án TopGo.

---

## 📁 1. Các Tệp Tin Được Thêm Mới & Cải Tiến

### Phía Backend (FastAPI)
* **`app/services/firebase_service.py`**:
  * Khởi tạo Firebase Admin SDK sử dụng file Private Key (Service Account).
  * Triển khai middleware dependency `verify_firebase_token` để trích xuất và xác thực Firebase ID Token (`Bearer <Token>`) gửi từ Frontend.
* **`app/controllers/saved_plans_controller.py`**: 
  * Xử lý các nghiệp vụ lưu lịch trình (`save_plan`), liệt kê danh sách lịch trình (`list_plans`) và xóa lịch trình (`delete_plan`) trên Firestore.
  * Tự động chuyển đổi `itinerary` sang dạng chuỗi JSON (`JSON String`) trước khi lưu nhằm giải quyết triệt để lỗi mảng lồng nhau (nested arrays) của Firestore.
* **`app/controllers/user_controller.py`**:
  * Quản lý đọc thông tin hồ sơ người dùng (`get_user_profile`) từ Firestore tài liệu `/users/{uid}`.
  * Quản lý ghi nhận cập nhật hồ sơ (`update_user_profile`) bằng set merge.
* **`app/routes/api.py`**: Đăng ký các route API mới được bảo vệ bằng token:
  * `POST /api/plans/save`: Lưu lịch trình.
  * `GET /api/plans/list`: Lấy danh sách lịch trình đã lưu.
  * `DELETE /api/plans/{plan_id}`: Xóa lịch trình.
  * `GET /api/users/profile`: Tải dữ liệu hồ sơ.
  * `POST /api/users/profile`: Cập nhật dữ liệu hồ sơ.

### Phía Frontend (HTML & JavaScript)
* **`js/firebaseConfig.js`**: File cấu hình Web SDK cho client.
* **`js/auth.js`**:
  * Tích hợp Firebase Web SDK v10.8.0.
  * Xử lý Google Sign-In qua Popup (`signInWithPopup`).
  * Đồng bộ trạng thái đăng nhập Firebase, tự động tải hồ sơ cá nhân khi đăng nhập và lưu vào bộ nhớ cache `localStorage` để không bị mất thông tin khi đăng xuất/đăng nhập lại.
  * Trực quan hóa thông báo lỗi đăng ký/đăng nhập màu đỏ trực tiếp trên form thay vì dùng hàm `alert()`. Riêng lỗi trùng email (`email-already-in-use`) được hiển thị trực tiếp bên dưới trường nhập Email.
  * Đồng bộ hóa cập nhật avatar thông qua nén ảnh `canvas` thành chuỗi Base64 JPEG gọn nhẹ (150x150px) để lưu trữ lên Firestore.
* **`js/shared.js`**: Tự động đồng bộ ảnh đại diện Google (photoURL) và tên hiển thị lên Header của các trang khi trạng thái đăng nhập thay đổi (`topgo-auth-change`).
* **`profile.html`**:
  * Giao diện Hộ chiếu thành viên (Passport Book) hiển thị thông tin cá nhân và danh sách lịch trình đã lưu dưới dạng Lưới (Grid) hoặc Danh sách (List), hỗ trợ bộ lọc tìm kiếm nâng cao.
  * Thêm nút chụp/chọn ảnh đại diện từ camera thiết bị bằng thẻ `<input type="file" accept="image/*">`.

---

## 🚀 2. Các Bước Thiết Lập Firebase Console

Để hệ thống hoạt động thực tế, bạn cần liên kết ứng dụng với dự án Firebase của mình qua các bước sau:

### Bước 2.1: Tạo dự án & Bật dịch vụ trên Firebase Console
1. Truy cập vào [Firebase Console](https://console.firebase.google.com/) và đăng nhập bằng tài khoản Google.
2. Click **Add project**, đặt tên dự án và nhấn tiếp tục để tạo dự án.
3. **Kích hoạt Google Authentication**:
   * Vào mục **Build** > **Authentication** > nhấp chọn **Get Started**.
   * Tại tab **Sign-in method**, chọn nhà cung cấp **Google** > Bật nút **Enable** > Chọn Email hỗ trợ dự án và nhấn **Save**.
   * Chọn thêm nhà cung cấp **Email/Password** > Bật nút **Enable** > nhấn **Save**.
4. **Kích hoạt Cloud Firestore**:
   * Vào mục **Build** > **Firestore Database** > chọn **Create database**.
   * Chọn chế độ bảo mật **Start in test mode** > chọn khu vực lưu trữ gần Việt Nam (ví dụ: `asia-southeast1`) > nhấn **Create**.

### Bước 2.2: Lấy file Private Key JSON cho Backend (Service Account)
1. Trên giao diện dự án Firebase Console, nhấp vào biểu tượng bánh răng cưa ⚙️ (**Project settings**).
2. Chọn tab **Service accounts**.
3. Nhấp vào nút **Generate new private key** > Chọn **Generate key** ở hộp thoại cảnh báo để tải file `.json` về máy.
4. Đổi tên tệp này thành `firebase-service-account.json` và di chuyển tệp vào thư mục chứa Backend:
   `TopGo/backend/firebase-service-account.json`

### Bước 2.3: Cấu hình Firebase Web SDK cho Frontend
1. Tại trang **Project settings** trên Firebase Console, cuộn xuống phần **Your apps** > chọn biểu tượng Web (`</>`) để đăng ký ứng dụng.
2. Sao chép các thuộc tính cấu hình trong đối tượng `firebaseConfig` được hiển thị:
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
3. Mở file [firebaseConfig.js](file:///d:/HCMUS/25-26%20HK2/TDTT/TopGo_Project_v3/TopGo/frontend/js/firebaseConfig.js) trên mã nguồn của bạn và dán đè đối tượng cấu hình của bạn vào.

---

## 🔍 3. Hướng Dẫn Kiểm Thử Luồng Chức Năng

Bạn mở trình duyệt và truy cập `http://localhost:3000` để tiến hành kiểm thử các kịch bản sau:

### 1. Đăng nhập Google & Thay đổi trạng thái Header
* Nhấp vào nút **Đăng nhập** trên Header > Chọn **Tiếp tục với Google** tại trang `auth.html`.
* Đăng nhập tài khoản Google thành công > Chuyển hướng về trang `profile.html`.
* Kiểm tra Header: Ảnh đại diện tròn và tên của tài khoản Google phải xuất hiện trên thanh điều hướng.

### 2. Đăng ký & Kiểm tra lỗi trùng Email
* Nhấp **Đăng xuất** > Quay lại trang `auth.html` > Bấm **Đăng ký ngay** để chuyển sang Form đăng ký.
* Nhập chính xác Email của tài khoản Google bạn đã đăng nhập ở bước trước, thiết lập mật khẩu hợp lệ (từ 6 ký tự trở lên và khớp nhau) và nhấn **Tạo tài khoản**.
* Trình duyệt sẽ hiển thị thông báo lỗi màu đỏ ngay phía dưới ô nhập Email: *"Email này đã được sử dụng bởi một tài khoản khác."* thay vì bật hộp cảnh báo `alert()`.

### 3. Lưu lịch trình khi Đã Đăng Nhập
* Tại trang `planner.html`, tạo một kế hoạch du lịch (ví dụ: Nha Trang, 3 ngày).
* Nhấn **Lưu lịch trình**: Hệ thống hiện Toast thông báo thành công.
* Vào trang `profile.html` kiểm tra: Lịch trình Nha Trang sẽ hiển thị trong danh sách "Lịch trình đã lưu".

### 4. Chụp/Chọn ảnh đại diện bằng Camera hoặc File
* Trong trang `profile.html`, nhấp vào nút icon **Camera** ở góc ảnh đại diện.
* Chọn tệp từ máy hoặc chụp trực tiếp bằng camera trên thiết bị di động.
* Sau khi chọn, ảnh sẽ được tự động nén về kích thước 150x150px JPEG và đồng bộ trực tiếp lên Firestore. Ảnh đại diện trên hộ chiếu thành viên và trên header sẽ tự động làm mới tương ứng.

### 5. Xem lại lịch trình (Review)
* Tại trang `profile.html`, nhấn nút **Xem lại** ở chuyến đi đã lưu.
* Hệ thống tự động chuyển hướng bạn về trang `planner.html` và hiển thị nguyên vẹn lộ trình, bản đồ cùng timeline của chuyến đi đó mà **không cần gọi lại AI (Gemini)**.
