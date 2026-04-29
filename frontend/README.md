# Giao diện người dùng (HTML, CSS, JS) - TopGo Frontend

Đây là thư mục chứa mã nguồn Frontend tĩnh (Vanilla JS, CSS, HTML) của hệ thống lên lịch trình du lịch thông minh TopGo.

## 1. Tổ chức dữ liệu giả lập (Mock Data) Tạm Thời

Hiện tại, toàn bộ dữ liệu mẫu (mock data) được đóng gói và **cô lập hoàn toàn** trong file `js/mockFallback.js`. 
Dữ liệu này được tổng hợp đầy đủ từ toàn bộ các file JSON trong thư mục `dataset` của dự án (gồm 12 tỉnh/thành phố: Hà Nội, Đà Nẵng, TP.HCM, Nha Trang, Đà Lạt, Phú Quốc, Hội An,...) cũng như các cấu trúc giao diện tĩnh hard-code trước đó (lịch trình mẫu 3 ngày, gợi ý chatbot, chi phí, thời tiết, món ăn...).

### Mục đích của `mockFallback.js`:
- **Chạy Demo độc lập:** Cho phép đội ngũ thiết kế UI/UX và front-end xem giao diện hoạt động 100% trơn tru, test các tính năng thả xuống (dropdown), lọc địa điểm mà không cần phải bật server Backend.
- **Graceful Fallback (Dự phòng an toàn):** Tầng gọi API (`js/api.js`) được thiết kế bọc trong khối `try...catch`. Nếu không gọi được API thật (do Backend sập hoặc chưa chạy), hệ thống sẽ log ra cảnh báo và tự động rẽ nhánh sang dùng dữ liệu từ `mockFallback.js`.

### Cách gỡ bỏ Mock Data để tích hợp thật (Zero-friction Merge):
Mã nguồn đã được tối ưu và làm gọn. Để hệ thống hoàn toàn chạy bằng dữ liệu thật từ Backend API trong tương lai, bạn **KHÔNG CẦN** phải sửa đổi logic trong `main.js` hay `api.js`. Chỉ cần thực hiện 2 thao tác dọn dẹp đơn giản:
1. Xóa (Delete) file `js/mockFallback.js` khỏi thư mục.
2. Xóa các dòng thẻ `<script src="./js/mockFallback.js"></script>` ở cuối file `index.html` và `chatbot.html`.
Ngay lập tức, code chính sẽ tự động nhận biết không còn biến Mock, và chuyển sang báo lỗi chính xác trên UI nếu Backend lỗi, hoặc render dữ liệu thật từ API trả về.

## 2. Nhận diện môi trường và gán cứng API (Environment Detection)

Trong file `js/api.js`, hệ thống thiết lập cơ chế tự động nhận diện môi trường để kết nối với Backend linh hoạt:
```javascript
const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE = _isLocal 
    ? 'http://localhost:8000' 
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
```

- **Khi code ở máy tính (Local):** `hostname` là `localhost`, hệ thống mặc định gọi Backend chạy ở `http://localhost:8000`.
- **Khi deploy lên mạng (VD: Vercel, GitHub Pages):** Hệ thống hiểu là Production và sẽ dùng địa chỉ `API_BASE` thật (`https://api.topgo.vn` hoặc địa chỉ do bạn cấu hình trên nền tảng cloud như Render/Heroku).

### Giải thích thiết kế:
Do dự án TopGo hiện đang viết bằng Vanilla JS thuần túy (không sử dụng các bộ đóng gói Build Tool như Webpack, Vite hay React), không thể chèn biến `.env` trực tiếp vào file JS khi deploy. Do đó, kỹ thuật gán cứng (hardcode) chuỗi trực tiếp hoặc thông qua biến toàn cục `window.__TOPGO_API_BASE__` là **cách xử lý khôn ngoan, nhẹ nhàng và chuẩn mực nhất** cho kiến trúc HTML tĩnh. 

Sau này, nếu nâng cấp lên các Framework JS (React, Vue), cơ chế này sẽ được thay thế bằng Biến môi trường lúc build (Build-time Environment Variables).

## 3. Kiến trúc hệ thống Frontend (Architecture & Organization)

Dự án TopGo được phát triển bằng **Vanilla JS (ES6 Modules)**, **CSS thuần**, và **HTML5**. Kiến trúc này được lựa chọn để tối đa hóa tốc độ tải trang, loại bỏ sự cồng kềnh của các build tools (như Webpack, Vite) nhưng vẫn duy trì tính module hóa (Modular Design) mạnh mẽ nhằm dễ dàng mở rộng và bảo trì.

### Cơ chế Component (HTML Fragments)
Mặc dù không dùng React/Vue, hệ thống vẫn áp dụng tư duy Component.
- Các phần chung như `header.html`, `footer.html`, `loading.html`, `result.html` được tách riêng trong thư mục `components/`.
- Khi ứng dụng khởi chạy, hệ thống dùng Fetch API (`fragmentLoader.js`) để nạp các tệp HTML tĩnh này và nhúng (inject) trực tiếp vào DOM. Điều này giúp tránh trùng lặp code và duy trì một mã nguồn sạch sẽ (Single Source of Truth).

### Cây thư mục chi tiết (Directory Tree)

```text
frontend/
├── index.html           # Trang nhập liệu chính (AI Planner Form) và hiển thị kết quả
├── chatbot.html         # Giao diện Chatbot AI riêng biệt
├── home.html            # Trang chủ (Landing Page) giới thiệu TopGo
├── README.md            # Tài liệu dự án (File bạn đang đọc)
│
├── components/          # Thư mục chứa các mảnh HTML dùng chung (Fragments)
│   ├── header.html      # Thanh điều hướng (Nav Bar)
│   ├── footer.html      # Chân trang (Footer)
│   ├── loading.html     # Màn hình chờ AI xử lý
│   └── result.html      # Cấu trúc hiển thị kết quả (Bản đồ + Lịch trình)
│
├── css/                 # Thư mục chứa các tệp định dạng giao diện
│   ├── base.css         # Các biến toàn cục (colors, fonts), reset CSS
│   ├── shared.css       # Style cho các components dùng chung (Header, Footer, Popup, Toast)
│   ├── home.css         # Style riêng cho trang chủ (home.html)
│   ├── form.css         # Style cho Form nhập liệu (index.html)
│   ├── result.css       # Style cho Màn hình kết quả và Bản đồ
│   └── chatbot.css      # Style riêng cho giao diện TopChat (chatbot.html)
│
├── js/                  # Thư mục chứa logic xử lý (ES6 Modules)
│   ├── main.js          # Entry point chính của AI Planner, khởi tạo App và điều phối luồng
│   ├── ui.js            # View Controller: Tương tác DOM, Validation Form, render UI
│   ├── data.js          # Quản lý State cục bộ và xử lý dữ liệu địa lý
│   ├── api.js           # Xử lý giao tiếp với Backend (Fetch API, bắt lỗi)
│   ├── utils.js         # Các hàm tiện ích thuần (Pure Functions) xử lý logic nghiệp vụ
│   ├── map.js           # Xử lý thư viện bản đồ Leaflet (vẽ tuyến đường, markers)
│   ├── fragmentLoader.js# Hàm tiện ích Fetch HTML fragments
│   ├── shared.js        # Logic chung: Khởi tạo Header/Footer, Event Delegation toàn cục, Toast
│   ├── chatbot.js       # Logic xử lý giao tiếp riêng của TopChat
│   └── mockFallback.js  # Tệp dữ liệu giả lập (sẽ bị xóa khi có Backend thực tế)
│
└── assets/              # Thư mục chứa ảnh minh họa, icon (nếu có)
```

### Logic phân bổ File (Separation of Concerns)

1. **State & Logic Nghiệp vụ (Data & Utils):**
   - `data.js`: Hoạt động như một store cục bộ (giống Redux thu nhỏ). Nó giữ trạng thái hiện tại (địa điểm đã chọn, thành phố đang focus).
   - `utils.js`: Xử lý những bài toán không dính tới thao tác DOM trực tiếp. Ví dụ: Validation luật phương tiện, kiểm tra ngân sách, kiểm tra chữ vô nghĩa. Được tách riêng để code sạch và dễ viết Unit Test nếu cần.

2. **Tương tác Giao diện (View Controllers - UI & Map):**
   - `ui.js`: Chuyên trách *thay đổi hiển thị HTML*. Từ việc đóng/mở dropdown, hiện lỗi đỏ, đổi màn hình (form -> loading -> result), đến việc vẽ ra thẻ địa điểm, danh sách kết quả. Mọi tương tác chạm (DOM Event) trên Form đều được gộp quản lý tập trung.
   - `map.js`: Tách biệt độc lập để làm việc riêng với hệ sinh thái phức tạp của thư viện LeafletJS (vẽ bản đồ, vẽ Polyline, cắm Marker), giúp mã nguồn chính không bị rối.

3. **Điều phối & Kết nối (Main & API):**
   - `main.js`: Nhạc trưởng điều phối (Controller). Nó import `api.js` để lấy dữ liệu, lưu vào `data.js`, sai khiến `ui.js` cập nhật màn hình. Khi ấn tạo lịch trình, nó gom data, kiểm tra bằng `utils.js`, gọi API và rẽ nhánh luồng.
   - `api.js`: Đóng gói chuẩn hóa Fetch Request. Đảm nhiệm việc nối với Backend, bắt lỗi timeout/mạng, và tự động fallback về dữ liệu giả lập (Mock) nếu cần.

4. **Kiến trúc CSS (Modular CSS):**
   - Việc bẻ nhỏ CSS thành từng nhóm chuyên biệt (`base`, `shared`, `form`, `result`...) giúp HTML load đúng thứ nó cần, tránh phình to CSS file. Đồng thời hỗ trợ lập trình viên định vị nhanh lỗi giao diện (CSS Isolation). Toàn bộ hệ thống tận dụng triệt để Biến CSS gốc (`var(--p1)`) ở `base.css` để bảo đảm chuẩn thiết kế và Theme luôn nhất quán.