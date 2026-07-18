# 🎨 Tài liệu Hệ thống Giao diện (CSS System)

Thư mục này chứa toàn bộ các tệp CSS định dạng giao diện cho ứng dụng **TopGo**. Hệ thống CSS được xây dựng theo triết lý **Vanilla Modular CSS** (CSS mô-đun hóa thuần túy), sử dụng các biến toàn cục (CSS Variables) để đồng nhất thiết kế mà không cần sử dụng các thư viện cồng kềnh như Tailwind hay Bootstrap.

---

## 📌 1. Danh sách các Tệp CSS và Vai trò

| Tệp CSS | Đối tượng áp dụng | Chức năng chính |
| :--- | :--- | :--- |
| [`base.css`](base.css) | Toàn bộ ứng dụng | Khởi tạo hệ thống màu sắc (Color Tokens), phông chữ (Typography), Reset CSS và các lớp tiện ích (Utility Classes) toàn cục. |
| [`shared.css`](shared.css) | Các component dùng chung | Định dạng giao diện cho Header, Footer, Hộp thoại Popup, Toast thông báo, và các cấu trúc layout cơ sở. |
| [`home.css`](home.css) | Trang chủ (`index.html`) | Thiết kế giao diện giới thiệu dịch vụ (Landing Page), các hiệu ứng cuộn và phần giới thiệu tính năng. |
| [`form.css`](form.css) | Trang Planner (`planner.html`) | Định dạng Form nhập liệu lập lịch trình, các dropdown gợi ý thông minh, nút bấm và hoạt ảnh chuyển động mượt mà. |
| [`result.css`](result.css) | Màn hình kết quả | Thiết kế giao diện hiển thị Timeline lịch trình AI tạo ra, bản đồ Leaflet, thẻ địa điểm chi tiết, và dự toán chi phí. |
| [`chatbot.css`](chatbot.css) | Trang TopChat (`chatbot.html`) | Khung giao diện bong bóng trò chuyện, thẻ thông tin phản hồi của Bot, các khối dự toán ngân sách và bảng thời tiết đẹp mắt. |
| [`auth.css`](auth.css) | Giao diện Đăng nhập / Ký | Thiết kế hộp thoại đăng nhập, form đăng ký thành viên với hiệu ứng chuyển động gradient chuyên nghiệp. |
| [`pricing.css`](pricing.css) | Trang nâng cấp tài khoản | Thiết kế các thẻ bảng giá (Pricing Cards), so sánh tính năng gói dịch vụ. |
| [`newsfeed.css`](newsfeed.css) | Trang Newsfeed (`feed.html`) | Thiết kế các bài đăng (posts), bố cục dòng thời gian và các khối tương tác mạng xã hội. |
| [`post.css`](post.css) | Chi tiết bài viết | Định dạng chi tiết bài đăng và khu vực hiển thị bình luận. |
| [`reviews.css`](reviews.css) | Đánh giá | Bố cục hiển thị danh sách đánh giá của các địa điểm du lịch. |
| [`aboutus.css`](aboutus.css) | Trang Giới thiệu | Thiết kế trang thông tin về đội ngũ phát triển dự án. |

---

## 🎨 2. Hệ thống Biến Toàn cục (Design Tokens)

Hệ thống màu sắc và cấu trúc khoảng cách được định nghĩa tập trung tại [`base.css`](base.css) dưới dạng CSS Variables. Điều này cho phép dễ dàng chỉnh sửa chủ đề (Theme) của toàn hệ thống chỉ bằng việc thay đổi các biến tại một nơi duy nhất:

### Bảng màu chủ đạo (Theme Colors)
- `--p1` (Primary - Màu xanh dương đậm): Chủ đề chính của TopGo, thể hiện sự chuyên nghiệp, tin cậy của dịch vụ du lịch.
- `--p2` (Primary Light): Màu nền nhẹ hoặc màu hover của nút.
- `--accent` (Màu cam/vàng nhấn): Sử dụng để làm nổi bật các thẻ quan trọng, xếp hạng sao (`⭐`) hoặc các nút kêu gọi hành động (CTA).
- `--bg-primary` & `--bg-secondary`: Các tông màu nền chính và phụ giúp phân cấp giao diện thị giác rõ ràng.
- `--text-main` & `--text-muted`: Màu chữ tiêu đề và chữ chú thích mờ.

### Hoạt ảnh & Bo góc (Radius & Transitions)
- `--r-lg`, `--r-md`: Các định mức bo góc tiêu chuẩn (8px, 12px, 20px) đem lại cảm giác hiện đại, mềm mại cho UI.
- `--transition-smooth`: Tốc độ chuyển động chuẩn `all 0.3s ease` được áp dụng cho toàn bộ hiệu ứng hover chuột.

---

## 🖥️ 3. Thiết kế Đáp ứng (Responsive Web Design)

Toàn bộ hệ thống giao diện CSS của TopGo được thiết kế theo hướng **Responsive di động trước (Mobile-Friendly)**, sử dụng:
1. **Flexbox & Grid**: Giúp co giãn linh hoạt các hàng, cột (ví dụ: chia lịch trình 3 cột trên Desktop, xếp dọc 1 cột trên Mobile).
2. **Media Queries**:
   - Thiết bị di động (`@media (max-width: 768px)`): Chuyển đổi thanh điều hướng thành menu hamburger, thu nhỏ kích cỡ font chữ tiêu đề, mở rộng các nút bấm để dễ tương tác bằng màn hình cảm ứng.
   - Máy tính bảng & Desktop (`@media (min-width: 1024px)`): Mở rộng không gian hiển thị song song giữa Bản đồ (Map) và Timeline lịch trình.

---

## 💡 4. Hướng dẫn Lập trình & Bảo trì CSS

Khi bổ sung hoặc chỉnh sửa giao diện cho ứng dụng, vui lòng tuân thủ các quy tắc sau:
- **Không viết Style nhúng (Inline Style)**: Luôn tách biệt định dạng ra tệp CSS để đảm bảo khả năng tối ưu hóa của trình duyệt.
- **Tận dụng Biến gốc**: Không viết trực tiếp các mã màu mã HEX (như `#3674B5` hay `#F5F7F8`), hãy sử dụng `var(--p1)` hoặc `var(--bg-primary)` để luôn đồng nhất với Design System của đồ án.
- **Cách ly CSS (CSS Isolation)**: Đặt tên class theo mô hình BEM hoặc phân cấp rõ ràng theo module (ví dụ: `.planner-form-wrapper`, `.chatbot-bubble-user`) để tránh xung đột kiểu dáng giữa các trang khác nhau.