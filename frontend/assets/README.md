# 🖼️ Thư mục Tài nguyên Hình ảnh & Đồ họa (Assets)

Thư mục này chứa toàn bộ các tài nguyên tĩnh phục vụ cho thiết kế giao diện của hệ thống **TopGo**, bao gồm logo thương hiệu, hình ảnh đại diện các thành phố du lịch, và các file cấu hình hiệu ứng động (Lottie Animations).

---

## 📌 1. Chi tiết Tài nguyên & Thư mục Con

| Tài nguyên / Thư mục | Định dạng | Vai trò & Mục đích sử dụng |
| :--- | :---: | :--- |
| [`logo.png`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/assets/logo.png) | PNG | Logo chính thức của thương hiệu TopGo hiển thị trên thanh điều hướng (Navbar) và chân trang (Footer). |
| [`globe-icon.json`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/assets/globe-icon.json) | JSON (Lottie) | Dữ liệu hoạt ảnh vector (Lottie Animation) mô tả quả địa cầu đang xoay, được dùng làm icon động tại nút bấm tạo lịch trình để tăng tính thẩm mỹ và hiện đại. |
| [`img/`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/assets/img) | Folder | Thư mục chứa các tài nguyên ảnh chụp tĩnh. |
| [`img/cities/`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/assets/img/cities) | Folder | Chứa hình ảnh thu nhỏ (thumbnails) đại diện cho 12 tỉnh thành du lịch được hiển thị trên danh sách lựa chọn của AI Planner. |

---

## ⚡ 2. Kỹ thuật Tối ưu hóa Hiệu năng Hình ảnh (WebP Optimization)

Để phục vụ cho yêu cầu tối ưu hóa tốc độ tải trang cực nhanh và triệt tiêu hoàn toàn độ trễ (lag) khi mở danh sách thành phố, toàn bộ hình ảnh trong thư mục [`img/cities/`](file:///c:/Users/Trung%20Kien/Downloads/FOR%20STUDYING/TDTT/main%20project/TopGo/frontend/assets/img/cities) đã được tối ưu hóa sâu sắc:

- **Định dạng thế hệ mới WebP**: Thay vì dùng JPEG hay PNG truyền thống, các ảnh được chuyển hoàn toàn sang đuôi `.webp` giúp nén dung lượng mà không làm suy giảm chất lượng hiển thị.
- **Kích thước Thumbnail siêu nhỏ**: Mỗi ảnh được crop chuẩn về kích thước hiển thị thực tế trên UI (40x30px). 
- **Siêu nén dung lượng**: Dung lượng mỗi tệp ảnh chỉ còn **dưới 500 byte** (0.5 KB). Tổng dung lượng của cả 12 thành phố cộng lại chưa tới 5 KB (so với file ảnh gốc chưa nén lên tới hơn 27 MB).
- **Kết quả**: Triệt tiêu hoàn toàn hiện tượng nghẽn luồng xử lý hoặc giật lag giao diện (laggy UI) khi trình duyệt phải render danh sách hình ảnh thành phố trong dropdown lựa chọn.

---

## 💡 3. Quy chuẩn khi thêm Tài nguyên Mới

- **Nén ảnh trước khi commit**: Luôn chạy qua các công cụ tối ưu dung lượng ảnh (như TinyPNG hoặc công cụ chuyển đổi `.webp`) trước khi đưa tài nguyên mới vào dự án.
- **Giữ cấu trúc thư mục sạch sẽ**:
  - Đưa ảnh đại diện của thành phố/địa danh vào đúng `img/cities/`.
  - Các ảnh nền lớn (Backgrounds/Hero) đưa vào thư mục chung `img/`.
  - Đặt tên tệp theo định dạng viết thường, phân tách bằng dấu gạch ngang (ví dụ: `ha-noi.webp`, `phu-quoc.webp`).