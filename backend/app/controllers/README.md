# 🎮 Thư mục Controllers - Điều Phối Luồng Xử Lý Nghiệp Vụ

Thư mục này chứa các bộ điều phối (Controllers) đóng vai trò trung gian giữa các Router (định nghĩa API Endpoint) và các Services (xử lý logic nghiệp vụ, thuật toán, kết nối cơ sở dữ liệu và AI). 

Các controller xử lý dữ liệu yêu cầu từ client, gọi các dịch vụ tương ứng để tính toán/truy vấn, và chuẩn bị cấu trúc phản hồi phù hợp để trả về cho người dùng.

---

## 📁 Danh Sách Các Tệp Tin & Vai Trò

### 1. `generate_controller.py` - Bộ Điều Phối Tạo Lịch Trình Tự Động
Đây là trái tim của hệ thống tạo lịch trình thông minh theo luồng (streaming). Tệp này chịu trách nhiệm điều phối toàn bộ chuỗi xử lý phức tạp tích hợp giữa Trí tuệ nhân tạo (Gemini AI) và Thuật toán tối ưu hóa tuyến đường:
* **Ghi nhận & Log Dữ liệu**: Tự động lưu vết dữ liệu yêu cầu (`payload`) từ frontend vào file JSON (`frontend/logs/payload_{timestamp}.json`) phục vụ mục đích giám sát và gỡ lỗi.
* **Xử lý Dữ liệu Điểm Tham Quan**: Đọc dữ liệu địa điểm du lịch từ tệp dataset tương ứng (ví dụ: `dataset/da_lat.json`). Giải quyết triệt để các lỗi không đồng bộ ID địa điểm (lệch tiền tố `BIT_` và `BTN_`) giữa client và dataset bằng các thuật toán so khớp hậu tố và so khớp tên địa điểm linh hoạt.
* **Quy Trình Tạo Lịch Trình 5 Bước (Streaming)**:
  1. **Bước 1**: Nhận diện thông tin cơ bản, khởi chạy luồng.
  2. **Bước 2 (Gọi AI 1)**: Đánh giá nhu cầu người dùng dựa trên 11 mẫu hành vi du lịch tiêu chuẩn (du lịch bụi, nghỉ dưỡng gia đình, chữa lành, ẩm thực...). Tự động lựa chọn thêm các địa điểm thích hợp từ dataset nếu người dùng chưa chọn đủ địa điểm tối thiểu (`3 * số ngày`). Tính toán bộ 4 trọng số tối ưu phục vụ công thức chấm điểm:
     $$\text{Điểm Ưu Tiên} = w_1 \times \text{rating} + w_2 \times \text{khớp tag} - w_3 \times \text{khoảng cách} - w_4 \times \text{giá phòng}$$
  3. **Bước 3 (Thuật toán Routing)**: Gửi các điểm tham quan đã chọn sang `routing_service` để tính toán tọa độ trung vị, lập ma trận khoảng cách qua OSRM API, phân nhóm địa điểm vào từng ngày bằng thuật toán Nearest Neighbor cải tiến và lấy hình học tuyến đường (GeoJSON).
  4. **Bước 4 (Dịch vụ Khách sạn)**: Dựa vào tọa độ tối ưu được tính từ bước Routing, hệ thống quét các nơi lưu trú xung quanh qua SerpAPI (Google Maps). Tiến hành quy đổi tiền tệ sang VNĐ thời gian thực và chấm điểm cơ bộ khách sạn theo trọng số đã tính ở Bước 2.
  5. **Bước 5 (Gọi AI 2 & Hoàn tất)**: Kết hợp kết quả phân cụm địa điểm của Routing và danh sách khách sạn đề xuất, gọi AI 2 để biên soạn lịch trình chi tiết từng giờ, thêm gợi ý ăn uống, tính toán tổng ngân sách, khoảng cách thực tế toàn tuyến và trả kết quả hoàn thiện về client.

### 2. `chatbot_controller.py` - Trợ Lý Ảo Chatbot
Điều phối các yêu cầu trò chuyện, tư vấn du lịch từ người dùng:
* **Quản lý Session Trò Chuyện**: Hỗ trợ giữ trạng thái lịch sử hội thoại riêng biệt cho từng người dùng/tab trình duyệt thông qua tham số `session_id`.
* **Cơ Chế In-Memory Store & Tránh Rò Rỉ Bộ Nhớ**: Sử dụng một singleton dictionary để lưu trữ các đối tượng chatbot trong bộ nhớ. Để tránh rò rỉ bộ nhớ (memory leak), controller giới hạn tối đa 100 sessions đồng thời. Khi vượt quá giới hạn, hệ thống tự động giải phóng session cũ nhất theo cơ chế **FIFO (First-In, First-Out)**.

### 3. `saved_plans_controller.py` - Quản Lý Lịch Trình Đã Lưu
Xử lý tương tác với Cloud Firestore liên quan đến việc lưu trữ lịch trình cá nhân của thành viên:
* **`save_plan`**: Lưu lịch trình hoàn chỉnh vào Firestore tại đường dẫn phân cấp `/users/{uid}/saved_plans/{plan_id}`. Dữ liệu lịch trình (itinerary) được lưu dưới dạng chuỗi JSON (`JSON String`) để giải quyết triệt để lỗi không tương thích mảng lồng nhau (nested arrays) của Firestore. Tự động sinh khóa `plan_id` dạng `trip-<timestamp>` nếu chưa có sẵn.
* **`list_plans`**: Truy xuất toàn bộ lịch trình đã lưu của người dùng theo luồng trực tiếp (stream). Áp dụng thuật toán sắp xếp giảm dần theo thời gian lưu (`savedAt`) thủ công trong bộ nhớ, đảm bảo hệ thống luôn hoạt động ổn định và chính xác mà không cần phải chờ đợi cấu hình Index từ Cloud Firestore Console.
* **`delete_plan`**: Xác thực tài liệu có tồn tại trước khi tiến hành xóa vĩnh viễn lịch trình khỏi bộ sưu tập của người dùng nhằm đảm bảo tính toàn vẹn dữ liệu.

### 4. `user_controller.py` - Quản Lý Hồ Sơ Người Dùng
Quản lý thông tin tài khoản, hộ chiếu thành viên và mối quan hệ theo dõi (Follow/Unfollow) trên Firestore:
* **`get_user_profile`**: Lấy thông tin cá nhân của người dùng từ tài liệu `/users/{uid}`.
* **`update_user_profile`**: Cập nhật thông tin hồ sơ (Họ tên, ngày sinh, giới tính, quốc tịch, ảnh đại diện...). Áp dụng giải pháp **Merge dữ liệu** tránh ghi đè làm mất mát dữ liệu khác.
* **`follow_user` & `unfollow_user`**: Thực hiện thiết lập liên kết theo dõi giữa hai người dùng (thêm/xóa UID vào danh sách `following` và `followers`).
* **`check_follow_status` & `get_follow_counts`**: Kiểm tra xem người dùng hiện tại đã follow đối tượng chưa và lấy số lượng người theo dõi/đang theo dõi.
* **`get_public_profile`**: Lấy hồ sơ công khai của một thành viên khác (bao gồm cả danh sách bài đăng và lịch trình công khai của họ).

### 5. `feed_controller.py` - Quản Lý Bảng Tin (Newsfeed)
Điều phối việc xây dựng các bài viết hiển thị trên dòng thời gian:
* **`get_personal_feed`**: Tự động truy cập danh sách người dùng đang theo dõi của tài khoản hiện tại, gom toàn bộ các bài đăng của họ, kết hợp lấy thông tin tác giả và thông tin lịch trình đi kèm để tạo luồng bài đăng cá nhân hóa (Personal Feed) sắp xếp giảm dần theo thời gian.
* **`_enrich_post_with_author` & `_enrich_post_with_itinerary`**: Các hàm phụ trợ làm giàu thông tin của bài đăng (nhúng thông tin avatar/tên người dùng và bản đồ/timeline lịch trình đính kèm) trước khi trả về phía client.

### 6. `post_controller.py` & `post_controller_extensions.py` - Quản Lý Bài Đăng & Tương Tác
Bộ điều phối toàn diện cho các tính năng mạng xã hội du lịch:
* **`create_post`, `update_post`, `delete_post`**: Thực hiện các thao tác CRUD bài viết trong Firestore. Bài đăng có thể gắn thẻ (tag) địa điểm du lịch và liên kết trực tiếp với một lịch trình chuyến đi đã lưu (`itinerary_id`).
* **`toggle_like` & `get_user_like_status`**: Thao tác thả tim/bỏ thích bài đăng của người dùng và kiểm tra trạng thái thích phục vụ hiển thị nút bấm frontend.
* **`add_comment` & `list_comments`**: Thêm bình luận mới dưới bài viết (nội dung tự động đi qua dịch vụ kiểm duyệt AI Moderation để ngăn chặn ngôn từ thù địch, đồi trụy) và truy xuất danh sách bình luận liên quan.
* **`create_repost`**: Cho phép người dùng chia sẻ lại bài đăng của người khác lên trang cá nhân của mình kèm lời bình luận riêng.
* **`get_posts_by_location`**: Lấy tất cả bài đăng được gắn thẻ một địa danh cụ thể để phục vụ trang chi tiết địa danh.

### 7. `payment_controller.py` - Tích Hợp Thanh Toán (VNPay)
Điều phối luồng đăng ký gói VIP thành viên thông qua cổng VNPay Sandbox:
* **`create_payment_url`**: Tiếp nhận yêu cầu mua gói VIP, tạo mã đơn hàng duy nhất và gọi VNPay Service để sinh chuỗi ký HMAC-SHA512 cùng liên kết chuyển hướng thanh toán VNPay Sandbox.
* **`handle_payment_return`**: Nhận redirect từ VNPay sau khi giao dịch hoàn tất, kiểm tra tính hợp lệ của chữ ký phản hồi. Nếu giao dịch thành công, tự động cập nhật trường `is_vip = True` và thời hạn hết hạn (`vip_expires_at`) trong tài liệu hồ sơ Firestore của người dùng.
* **`handle_payment_ipn`**: Đầu cuối IPN (Instant Payment Notification) nhận thông báo ngầm từ máy chủ VNPay để bảo đảm cập nhật database an toàn, tránh mất mát dữ liệu kể cả khi kết nối mạng của người dùng bị gián đoạn lúc chuyển hướng.

### 8. `search_controller.py` - Tìm Kiếm Đa Nhiệm
* **`perform_search`**: Thực hiện truy vấn đồng thời trên Firestore để tìm kiếm các bài viết (theo nội dung, địa danh), tài khoản người dùng (theo username, họ tên), hoặc thông tin địa điểm trong dataset. Ghi nhận từ khóa tìm kiếm để xếp hạng từ khóa hot.

### 9. `hot_search_controller.py` - Phân Tích Từ Khóa Hot
* **`get_hot_search`**: Truy xuất danh sách các từ khóa tìm kiếm thịnh hành nhất của hệ thống phục vụ tính năng gợi ý nhanh tại thanh tìm kiếm.

### 10. `itinerary_controller.py` - Chia Sẻ Lịch Trình
* **`share_itinerary`**: Đánh dấu một lịch trình du lịch là công khai (`isPublic = True`), tạo khóa chia sẻ công khai.
* **`get_itinerary`**: Truy xuất dữ liệu lịch trình công khai phục vụ người dùng chưa đăng nhập hoặc xem chung lộ trình.

### 11. `reviews_controller.py` - Tích Hợp Google Reviews
* **`get_google_reviews`**: Tiếp nhận tên địa danh du lịch từ client, gọi SerpAPI Reviews Endpoint để lấy danh sách đánh giá thực tế trên Google Maps giúp tăng tính khách quan của dữ liệu địa điểm.