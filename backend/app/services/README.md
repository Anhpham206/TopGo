# 🛠️ Thư mục Services - Trọng Tâm Xử Lý Thuật Toán & Tích Hợp Hệ Thống

Thư mục `services` chứa các lõi dịch vụ chính của hệ thống TopGo, bao gồm tích hợp Firebase, thuật toán tối ưu hóa tuyến đường, dịch vụ tìm kiếm nơi lưu trú SerpAPI và hệ thống Trí tuệ nhân tạo (Gemini AI).

---

## 📁 Chi Tiết Các Hợp Phần & Thuật Toán

### 1. `firebase_service.py` - Tích Hợp Firebase Admin SDK
* **Khởi tạo Hệ thống**: Tự động tìm kiếm và nạp tệp xác thực Service Account (`firebase-service-account.json`). Hỗ trợ cấu hình đường dẫn tuyệt đối/tương đối linh hoạt qua biến môi trường `FIREBASE_CREDENTIALS_PATH`.
* **Xác thực Token Dependency (`verify_firebase_token`)**:
  * Đóng vai trò là một FastAPI Dependency để bảo vệ các API bảo mật.
  * Trích xuất JWT Token dạng `Bearer <Token>` từ HTTP Authorization Header.
  * Sử dụng Admin SDK để kiểm tra chữ ký và tính hợp lệ của Token (`auth.verify_id_token`).
  * Trả về thông tin giải mã chi tiết của Token (bao gồm `uid`, `email`, `name`, `picture`...) cho controller xử lý tiếp.

---

### 2. Phân Hệ AI (`ai_logic/`)
Sử dụng thư viện Google GenAI SDK chính thức (`google-genai`) tương tác với các mô hình Gemini tiên tiến.

#### 📄 `ai_logic.py` - Hệ Thống Tạo Lịch Trình Thông Minh
* **AI 1 (`call_ai_1`)**: Sử dụng mô hình `gemini-3.1-flash-lite`.
  * **Nhận diện Mẫu Người Dùng (11 Mẫu Hành Vi)**: Tự động phân tích yêu cầu để xếp người dùng vào các nhóm: *Tiết kiệm/Phượt*, *Nghỉ dưỡng gia đình*, *Cặp đôi lãng mạn*, *Team Building*, *Chữa lành 1 mình*, *Công tác Bleisure*, *Food Tour*, *Sống ảo Check-in*, *Mạo hiểm/Trekking*, *Du lịch sự kiện*, *Khám phá văn hóa*.
  * **Tính Toán Bộ Trọng Số $W$**: Phân tích thời gian, ngân sách, ghi chú để đưa ra bộ trọng số $[w_1, w_2, w_3, w_4]$ tối ưu (tổng bằng 1.0) nhằm định hình công thức lọc khách sạn ở các bước sau.
  * **Tìm Kiếm Thêm Địa Điểm**: Nếu số địa điểm do người dùng chọn chưa đủ (`3 * số ngày`), AI sẽ tự động truy vấn thêm các địa điểm đặc trưng tại thành phố đó từ dataset mà vẫn đảm bảo nằm trong tầm kiểm soát ngân sách.
* **AI 2 (`call_ai_2`)**: Sử dụng mô hình `gemini-3.5-flash`.
  * **Chuẩn Hóa Điểm Số Khách Sạn (Min-Max Scaling)**: So sánh `tag_nguoi_dung` với danh sách tiện ích của khách sạn để tính Số tag khớp ($x_i$). Sau đó chuẩn hóa bằng Min-Max Scaling để ra Điểm Tag (`TagScore`):
    $$\text{TagScore} = \frac{x_i - \min}{\max - \min}$$
    Tính điểm tổng hợp cuối cùng: $\text{AIScore\_Moi} = \text{diem\_tong} + w_2 \times \text{TagScore}$.
    Sắp xếp và giữ lại Top 3 khách sạn tối ưu nhất, hiển thị dưới dạng phần trăm (VD: 96% Phù hợp).
  * **Biên Soạn Lịch Trình Chi Tiết**: Phân bổ mốc thời gian (timeline), viết lời giới thiệu hấp dẫn cho từng địa điểm, thêm các mốc ăn uống đi kèm câu kêu gọi trải nghiệm chatbot của hệ thống.
  * **Gợi Ý Khởi Hành/Đặt Vé**: Tính toán thời gian di chuyển, đề xuất thời gian đặt vé máy bay/xe khách hoặc các cung đường dừng chân nghỉ ngơi nếu đi bằng xe cá nhân.

#### 📄 `chatbot.py` - Trợ Lý Ảo TopGo
Xây dựng lớp `TopGoChatbot` sử dụng mô hình `gemini-3.1-flash-lite` với 4 phân hệ AI riêng biệt hoạt động bất đồng bộ:
1. **Bộ Phân Loại Ý Định (Intent Classifier)**: Đọc tin nhắn và gán nhãn chính xác bằng AI giữa `FIND_FOOD` (tìm món ngon, quán ăn) hoặc `GENERAL_CHAT` (hỏi đáp chung).
2. **Bộ Trích Xuất Địa Danh (Location Extractor)**: Trích xuất chính xác tên tỉnh/thành phố trong câu chat và chuẩn hóa về dạng slug không dấu viết thường (Ví dụ: "Đà Lạt Lâm Đồng" -> `da_lat`).
3. **Bộ Đọc Dataset & Bộ Đề Xuất Ẩm Thực (Restaurant Recommender)**: Khi phát hiện ý định tìm đồ ăn kèm địa danh cụ thể, hệ thống tự động tìm và đọc tệp dataset ẩm thực tương ứng (ví dụ: `dataset/da_lat.json`). AI sẽ lọc ra chính xác **Top 5 quán ăn phù hợp nhất** kèm theo lời giới thiệu chi tiết và lý do đề xuất.
4. **Hệ Thống Trò Chuyện Trực Tuyến (Interactive Chat Session)**:
  * **Tính cách nhí nhảnh, đáng yêu**: Xưng hô "tớ - cậu/bạn", sử dụng nhiều emoji phong phú, ngôn từ bắt trend trẻ trung.
  * **Bộ quy tắc an toàn nghiêm ngặt**: Từ chối thảo luận các chủ đề nhạy cảm (chính trị, tôn giáo, đồi trụy, vi phạm pháp luật).
  * **Từ chối tạo lịch trình thủ công**: Nếu người dùng yêu cầu lên lịch trình trong khung chat, chatbot sẽ khéo léo từ chối và hướng dẫn người dùng sử dụng tính năng "Tạo lịch trình" chuyên dụng trên trang Planner của TopGo.

---

### 3. Phân Hệ Khách Sạn (`hotel/`)
#### 📄 `hotel.py` - Quét & Đánh Giá Nơi Lưu Trú
* **Quét Dữ Liệu Thực Tế Google Maps**: Kết nối API SerpAPI tìm kiếm các khách sạn, resort, homestay xung quanh tọa độ trung vị được tính từ dịch vụ định tuyến.
* **Quy Đổi Tiền Tệ Tự Động**: Giải quyết vấn đề SerpAPI sử dụng IP bot ngẫu nhiên trả về các loại tiền tệ quốc tế không cố định (USD, MXN, KZT, EUR...). Module tự động nhận diện ký hiệu tiền tệ và gọi API tỷ giá mở (`open.er-api.com`) để quy đổi chính xác về đơn vị **VNĐ** theo thời gian thực trước khi lọc theo ngân sách người dùng.
* **Tính Khoảng Cách Địa Lý**: Sử dụng công thức toán học **Haversine** tính toán khoảng cách đường chim bay chính xác giữa tọa độ khách sạn và tâm hành trình.
* **Chấm Điểm Sơ Bộ (Partial Scoring)**: Tính toán điểm số sơ bộ dựa trên bộ trọng số $[w_1, w_3, w_4]$ nhận từ AI 1:
  $$\text{diem\_tong} = w_{\text{rating}} \times \text{NormRating} + w_{\text{kc}} \times \text{NormDistance} + w_{\text{gia}} \times \text{NormPrice}$$
* **Thu Thập Tags Reviews Nâng Cao**: Chỉ lấy Top 5 khách sạn điểm cao nhất để gọi SerpAPI Reviews Endpoint, trích xuất các từ khóa chủ đề thịnh hành (topics/keywords) từ đánh giá thực tế của khách hàng để làm phong phú bộ tags tiện ích (amenities) có sẵn.

---

### 4. Phân Hệ Định Tuyến (`routing_service/`)
#### 📄 `routing_service.py` - Tối Ưu Hóa Tuyến Đường & Quỹ Đạo
Chịu trách nhiệm giải quyết bài toán phân cụm địa điểm theo ngày và sắp xếp thứ tự di chuyển tối ưu:
* **Tọa Độ Trung Vị (Median Coordinates Center)**: Tính toán tọa độ trung vị của tất cả các địa điểm tham quan để xác định vị trí "Trọng tâm hành trình" (Hub), làm mốc xuất phát và quét khách sạn lý tưởng.
* **Ma Trận Khoảng Cách Bất Đồng Bộ**: Gửi yêu cầu đến OSRM Table API để lấy ma trận khoảng cách và thời gian di chuyển giữa tất cả các điểm. Hỗ trợ cơ chế **tự động Fallback**: Nếu OSRM gặp lỗi hoặc timeout, hệ thống tự động chuyển sang tính toán thủ công bằng công thức Haversine để bảo đảm dịch vụ không bị gián đoạn.
* **Thuật Toán Gom Nhóm Địa Điểm Theo Ngày**:
  * **Far-First Seed (Gieo điểm xa nhất)**: Chọn địa điểm xa tọa độ trung vị (Hub) nhất làm điểm xuất phát đầu tiên của ngày mới để gom nhóm các khu vực ngoại thành/xa trung tâm vào một ngày riêng.
  * **Savings Heuristic (Tối ưu hóa hành trình)**: Các địa điểm tiếp theo trong ngày được lựa chọn dựa trên khoảng cách ngắn nhất đến điểm hiện tại, kết hợp kiểm tra độ khớp khung giờ mở/đóng cửa và cộng thêm trọng số phạt khi quay về Hub.
* **Vẽ Hình Học Tuyến Đường**: Gọi OSRM Route API để lấy dữ liệu GeoJSON đường đi chi tiết từng ngày (chu trình khép kín Hub -> Điểm 1 -> Điểm 2 -> ... -> Hub) cùng với khoảng cách/thời gian cụ thể của từng chặng (legs) để hiển thị trực quan lên bản đồ Leaflet ở Frontend.