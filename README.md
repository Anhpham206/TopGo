# 🌍 Smart Tourism - Website Du Lịch Thông Minh

Website hỗ trợ lập lịch trình du lịch thông minh tại Việt Nam. Người dùng tìm kiếm và chọn các địa điểm từ danh sách, hệ thống sẽ tự động tối ưu hóa lộ trình theo ngày và hiển thị trên bản đồ tương tác.

## 📁 Cấu Trúc Dự Án

```
/smart-tourism-project
├── /frontend               # Giao diện người dùng (HTML, CSS, JS)
│   ├── index.html          # File giao diện chính
│   ├── /css
│   │   └── style.css       # Toàn bộ CSS
│   ├── /js
│   │   ├── main.js         # Xử lý sự kiện trên giao diện (DOM)
│   │   └── api.js          # Gọi fetch() sang Backend
│   └── /assets             # Hình ảnh, icon, logo
├── /backend                # Server xử lý (Python + FastAPI)
│   ├── main.py             # File chạy server chính
│   ├── /app
│   │   ├── routes.py       # Định nghĩa các endpoint API
│   │   ├── /controllers
│   │   │   └── itinerary_controller.py  # Điều phối luồng xử lý
│   │   └── /services
│   │       └── routing_service.py       # Logic thuật toán (OSRM, Nearest Neighbor)
│   ├── /logs               # Thư mục lưu file JSON log để theo dõi (tự động tạo)
│   ├── requirements.txt    # Danh sách thư viện Python cần cài đặt
│   └── .env                # Lưu API Key (KHÔNG đẩy lên GitHub)
├── .gitignore
└── README.md
```

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Bước 1: Clone dự án (hoặc tải về)

```bash
git clone <đường_dẫn_repo>
cd smart-tourism-project
```

### Bước 2: Tạo môi trường ảo (khuyến nghị)

```bash
cd backend
# Tạo môi trường ảo
python -m venv venv
# Kích hoạt môi trường ảo
# Trên Windows (CMD):
venv\Scripts\activate

# Trên macOS/Linux:
source venv/bin/activate
```

> ⚠️ **Lưu ý:** Sau khi kích hoạt thành công, sẽ thấy `(venv)` xuất hiện ở đầu dòng lệnh.

### Bước 3: Cài đặt thư viện Python

```bash
# Đảm bảo đang ở trong thư mục backend/ và đã kích hoạt venv
pip install -r requirements.txt
```

**Danh sách thư viện được cài đặt:**

| Thư viện | Mô tả |
|---|---|
| `fastapi` | Framework web API hiệu suất cao |
| `uvicorn` | ASGI server để chạy FastAPI |
| `httpx` | HTTP client bất đồng bộ (gọi API OSRM) |
| `pydantic` | Kiểm tra và xác thực dữ liệu |
| `python-dotenv` | Đọc biến môi trường từ file `.env` |

### Bước 4: Cấu hình file `.env.example`, copy ra đổi tên thành `.env` (chứa các key API)
đổi tên .env.example thành .env và điền key API
```bash
GEMINI_API_KEY=your_api_key_here
GEMINI_API_KEY_2=your_api_key_here
```

### Bước 5: Chạy Backend Server

```bash
# Đảm bảo đang ở thư mục backend/ và đã kích hoạt venv
python -m app.main
```

> ✅ Server sẽ chạy tại: **http://localhost:8000**

### Bước 6: Mở Frontend
tạo 1 terminal mới để chạy
```bash
cd frontend
python -m http.server 3000
```
Sau đó truy cập `http://localhost:3000` trên trình duyệt.


## 🔧 Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|---|---|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Bản đồ | Leaflet.js + OpenStreetMap |
| Backend | Python + FastAPI |
| HTTP Client | httpx (bất đồng bộ) |
| Tìm kiếm địa điểm | Nominatim API (OpenStreetMap) |
| Ma trận khoảng cách | OSRM Table API |
| Tìm đường đi | OSRM Route API |
| Thuật toán | Nearest Neighbor (láng giềng gần nhất) |

## 📊 Thuật Toán Lập Lịch Trình

1. **Tính tọa độ tối ưu**: Sử dụng **trung vị (median)** của tất cả tọa độ lat/lon
2. **Lấy ma trận khoảng cách**: Gửi yêu cầu đến OSRM Table API
3. **Gom nhóm theo ngày**: Thuật toán Nearest Neighbor, mỗi ngày 3 địa điểm, bắt đầu từ tọa độ tối ưu
4. **Tìm đường đi**: OSRM Route API cho từng ngày (tọa độ tối ưu → điểm 1 → điểm 2 → điểm 3)

