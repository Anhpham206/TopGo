# 🧩 Thư mục HTML Fragments (Giao diện Thành phần Dùng chung)

Thư mục này chứa các phân mảnh HTML (HTML Fragments) hay còn gọi là các **Web Components tĩnh** dùng chung trong ứng dụng **TopGo**. 

Kiến trúc này giúp dự án loại bỏ việc lặp lại mã nguồn HTML trên nhiều trang khác nhau (giữ nguyên lý DRY - Don't Repeat Yourself) mà không cần phải cài đặt các Framework nặng nề như React, Angular hay Vue.

---

## 📌 1. Danh sách các Phân mảnh & Vai trò

| Tệp HTML | Mô tả thành phần | Cách sử dụng / Tải động |
| :--- | :--- | :--- |
| [`header.html`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/components/header.html) | **Thanh điều hướng toàn trang (Navbar)**: Chứa logo, các liên kết điều hướng (Lên lịch, Chatbot, Bảng giá, Tài khoản) và nút Đăng nhập/Đăng xuất. | Được tải tự động ở đầu tất cả các trang nhờ hàm khởi tạo trong [`shared.js`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/js/shared.js). |
| [`footer.html`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/components/footer.html) | **Chân trang (Footer)**: Thông tin bản quyền đồ án, nhóm thực hiện, mô tả dự án và liên kết mạng xã hội. | Tải tự động ở chân trang của tất cả các file HTML thông qua mô-đun shared logic. |
| [`loading.html`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/components/loading.html) | **Màn hình chờ lập lịch trình (AI Loading State)**: Chứa các vòng quay chờ đợi (spinner), thanh tiến trình động và các thông điệp gợi ý ngẫu nhiên kích thích trải nghiệm người dùng. | Trình hiển thị UI điều khiển bật/tắt động trong [`ui.js`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/js/ui.js) khi gửi dữ liệu lên AI Server. |
| [`result.html`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/components/result.html) | **Khung hiển thị lịch trình & bản đồ**: Chứa cấu trúc cột phân tách giữa khu vực bản đồ Leaflet (`#map`) và dòng thời gian lịch trình (`#itinerary-timeline`). | Được nạp và hiển thị ngay sau khi Backend trả về kết quả lập lịch thành công. |

---

## ⚙️ 2. Cơ chế Hoạt động (Tải động Phân mảnh)

Hệ thống sử dụng bộ nạp [`fragmentLoader.js`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/js/fragmentLoader.js) để thực hiện cuộc gọi AJAX không đồng bộ tải HTML:

1. **Khai báo vùng chứa (Placeholder)**:
   Trên các trang HTML chính (như `index.html` hay `chatbot.html`), ta khai báo các thẻ trống có ID định danh rõ ràng:
   ```html
   <div id="header-placeholder"></div>
   ```
2. **Nạp động bằng Javascript**:
   Khi trang web vừa tải, đoạn mã Javascript trong [`shared.js`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/js/shared.js) sẽ chạy hàm `loadFragment`:
   ```javascript
   loadFragment('header-placeholder', './components/header.html');
   ```
   Hàm này sử dụng `fetch()` để đọc nội dung của file fragment và gán trực tiếp vào thuộc tính `innerHTML` của vùng chứa placeholder, sau đó kích hoạt các sự kiện khởi tạo menu di động hoặc thiết lập trạng thái nút bấm đăng nhập dựa trên token đăng nhập hiện có.

---

## 💡 3. Lưu ý khi Phát triển & Sửa đổi Components

- **Không viết thẻ cấu trúc khung (`<html>`, `<head>`, `<body>`)**: Các file trong thư mục này chỉ chứa các thẻ HTML thuần túy mô tả cấu trúc của bản thân component đó (ví dụ bắt đầu thẳng bằng `<header>` hoặc `<div class="loading-container">`).
- **Tách biệt CSS/JS**: Các components chỉ mô tả cấu trúc xương (HTML). Phần định dạng giao diện phải được viết tại thư mục `frontend/css/` (ví dụ `shared.css`), và phần logic tương tác phải nằm tại `frontend/js/` (ví dụ `shared.js`). Điều này giúp mã nguồn gọn gàng và dễ theo dõi.
