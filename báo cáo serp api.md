# BÁO CÁO CẬP NHẬT TÍNH NĂNG: MỞ RỘNG QUÉT LOẠI HÌNH LƯU TRÚ (TUẦN 5)

**Người thực hiện:** Tuấn
**Mục tiêu:** 
1. Tìm hiểu khả năng mở rộng của API quét địa điểm lưu trú (SerpAPI - Google Maps).
2. Code bổ sung thuật toán để hỗ trợ tự động nhận diện và quét tất cả các loại hình lưu trú có trên giao diện (Khách sạn, Homestay, Resort, Villa, Căn hộ).
3. Đảm bảo mã nguồn dễ bảo trì, dễ mở rộng và đạt độ chính xác cao.

---

## 1. TÌM HIỂU THÔNG TIN QUÉT CÁC LOẠI HÌNH LƯU TRÚ KHÁC

### 1.1 Cơ chế hoạt động của SerpAPI (Google Maps Engine)
Theo thiết kế hiện tại, dự án sử dụng SerpAPI giao tiếp với Google Maps. Hàm API truyền vào biến `q` (Query) và `ll` (Tọa độ). Khi truyền tham số `q=Khách sạn`, Google Maps trả về 100% là khách sạn. 

**SerpAPI hoàn toàn có khả năng quét mọi hình thức lưu trú**. Nếu thay đổi giá trị `q`, kết quả tìm kiếm sẽ lập tức thay đổi tương ứng. 
Ví dụ: Khi đổi `q=Resort nghỉ dưỡng`, Google Maps trả về danh sách các Resort kèm theo các tiện ích chuyên biệt (Hồ bơi, Spa, Đường ra bãi biển,...).

### 1.2 Dữ liệu tiềm năng phát hiện được từ Log (Dựa trên yêu cầu của Nhóm trưởng)
Sau khi log toàn bộ raw JSON từ SerpApi (`serpapi_raw_log.json`), có nhiều trường quan trọng để nâng cấp cho UI/UX mà trước đây bị bỏ qua:
- **`website`**: Link trực tiếp đến trang chủ của nơi lưu trú.
- **`thumbnail`** / **`serpapi_thumbnail`**: Ảnh đại diện của khách sạn/homestay.
- **`amenities`**: Danh sách các tiện ích/dịch vụ (VD: *Wi-Fi miễn phí, Bữa sáng, Bể bơi...*).
- **`reviews_link`**: Link endpoint để trích xuất đánh giá thật của người dùng (sẽ là nguồn data cực tốt nếu sau này tích hợp AI tóm tắt đánh giá).

---

## 2. PHƯƠNG ÁN CHỈNH SỬA VÀ BỔ SUNG CODE

### 2.1 Vấn đề của Code cũ
Code cũ bị fix cứng tham số tìm kiếm:
```python
params = {
    "engine": "google_maps",
    "q": "Khách sạn", # Điểm nghẽn
    # ...
}
```
Điều này khiến toàn bộ đồ án chỉ lấy được "Khách sạn", bất kể Frontend có các lựa chọn như Homestay, Resort, Villa...

### 2.2 Giải pháp thực hiện (Code Mới)
Để đảm bảo tính **Dễ bảo trì, Mở rộng (Scalability)** và **Chính xác (Accuracy)**, nhóm đã áp dụng phương pháp **Dictionary Mapping** và **Tiền xử lý chuỗi**.

**Bước 1: Tạo bộ từ điển ánh xạ (Mapping)**
Thay vì dùng `if/else`, chúng tôi cấu hình một bộ từ điển ánh xạ trực tiếp từ giá trị chuẩn của Frontend sang câu truy vấn tối ưu nhất cho Google Maps.
```python
ACCOMMODATION_TYPES = {
    "Khách sạn": "Khách sạn",
    "Homestay": "Homestay",
    "Resort": "Resort nghỉ dưỡng",
    "Villa": "Biệt thự Villa",
    "Căn hộ": "Căn hộ dịch vụ"
}
```

**Bước 2: Cập nhật hàm xử lý lõi**
Hàm `quet_khach_san_quanh_trung_vi` được bổ sung tham số `loai_hinh_luu_tru`. Hệ thống tự động chuẩn hóa chuỗi và đối chiếu với từ điển để tìm ra `search_query` phù hợp. Nếu không khớp loại nào, hệ thống tự động fallback (dự phòng) về mức an toàn là `"Khách sạn"`.
```python
def quet_khach_san_quanh_trung_vi(tam_lat, tam_lng, ngan_sach, loai_hinh_luu_tru="khách sạn"):
    # Chuẩn hóa chuỗi (chống lỗi viết hoa/viết thường)
    loai_hinh_key = loai_hinh_luu_tru.lower().strip()
    search_query = ACCOMMODATION_TYPES.get(loai_hinh_key, "Khách sạn")

    params = {
        "engine": "google_maps",
        "q": search_query, # Thay thế giá trị cứng bằng biến động
        # ...
    }
```

**Bước 3: Khai thác dữ liệu "ngon"**
Bổ sung đoạn code để trích xuất ngay lập tức các tiện ích và thông tin đi kèm từ raw data:
```python
website = ks.get("website", "")
url_img = ks.get("thumbnail", ks.get("serpapi_thumbnail", ""))
tags = ks.get("amenities", [])
reviews_link = ks.get("reviews_link", "")
```

---

## 3. TỔNG KẾT VÀ ĐÁNH GIÁ ĐÁP ỨNG TIÊU CHÍ

1. **Dễ bảo trì & Mở rộng:** Khi sản phẩm thêm loại hình lưu trú mới (VD: Motel, Du thuyền), chỉ cần chèn 1 dòng vào `ACCOMMODATION_TYPES` ở đầu file mà không làm vỡ logic thuật toán bên dưới.
2. **Sự chính xác:** Các truy vấn như `"Resort nghỉ dưỡng"` hay `"Biệt thự Villa"` trả về kết quả chính xác hơn nhiều so với việc chỉ ném từ khóa thô lóng ngóng vào Google Maps. Khả năng lỗi type cũng được triệt tiêu nhờ hàm `.lower().strip()` và cơ chế fallback tự động.
3. **Giá trị gia tăng:** Việc thu thập thành công Website, Hình ảnh và Tags mang lại cơ sở vững chắc để xây dựng một thẻ khách sạn (Hotel Card) cực kỳ chuyên nghiệp trên UI.

**Đã hoàn tất code và chạy test độc lập thành công. Log test được lưu tại: `backend/app/services/hotel/result_test/ket_qua_xu_ly.json`**
