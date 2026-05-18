import requests
import math
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Sử dụng Key SerpAPI từ file .env
SERPAPI_KEY = os.environ.get("SERPAPI_KEY")

def tinh_khoang_cach(lat1, lon1, lat2, lon2):
    """Tính khoảng cách đường chim bay bằng Haversine"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a))) 

def cham_diem_khach_san(danh_sach_ks):
    """Hàm tính điểm khách sạn (Chỉ tính rating, giá tiền, khoảng cách)"""
    if not danh_sach_ks: return []

    # Tìm Min/Max để chuẩn hóa
    max_rating = max(ks["rating"] for ks in danh_sach_ks) 
    min_rating = min(ks["rating"] for ks in danh_sach_ks) 
    max_kc = max(ks["khoang_cach_tam"] for ks in danh_sach_ks) 
    min_kc = min(ks["khoang_cach_tam"] for ks in danh_sach_ks) 
    
    # Bỏ qua khách sạn ẩn giá (giá = 0) khi tìm min/max
    max_gia = max((ks["gia_tien"] for ks in danh_sach_ks if ks["gia_tien"] > 0), default=0) 
    min_gia = min((ks["gia_tien"] for ks in danh_sach_ks if ks["gia_tien"] > 0), default=0) 

    # Trọng số
    w_rating = 2.0
    w_kc = 1.5
    w_gia = 1.0

    for ks in danh_sach_ks:
        # Chuẩn hóa (Min-Max Scaling)
        norm_rating = (ks["rating"] - min_rating) / (max_rating - min_rating) if max_rating > min_rating else 1.0 
        norm_kc = (max_kc - ks["khoang_cach_tam"]) / (max_kc - min_kc) if max_kc > min_kc else 1.0
        
        if ks["gia_tien"] == 0 or max_gia == min_gia:
            norm_gia = 0.5 # Mức điểm trung bình cho KS bị ẩn giá
        else:
            norm_gia = (max_gia - ks["gia_tien"]) / (max_gia - min_gia)

        # Tính điểm tổng
        ks["diem_tong"] = (w_rating * norm_rating) + (w_kc * norm_kc) + (w_gia * norm_gia)

    # Sắp xếp giảm dần theo điểm tổng
    danh_sach_ks.sort(key=lambda x: x["diem_tong"], reverse=True) #[cite: 20]
    return danh_sach_ks

# Mapping các loại hình từ Frontend sang từ khóa tìm kiếm tối ưu trên Google Maps
ACCOMMODATION_TYPES = {
    "Khách sạn": "Khách sạn",
    "Homestay": "Homestay",
    "Resort": "Resort nghỉ dưỡng",
    "Villa": "Biệt thự Villa",
    "Căn hộ": "Căn hộ dịch vụ"
}

def quet_khach_san_quanh_trung_vi(tam_lat, tam_lng, ngan_sach, loai_hinh_luu_tru="khách sạn"):
    """Hàm quét API Google Maps và lọc dữ liệu thô theo loại hình lưu trú"""
    
    # 1. Xử lý loại hình lưu trú (Fallback về Khách sạn nếu không hợp lệ)
    loai_hinh_key = loai_hinh_luu_tru.lower().strip()
    search_query = ACCOMMODATION_TYPES.get(loai_hinh_key, "Khách sạn")

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps",
        "q": search_query,
        "ll": f"@{tam_lat},{tam_lng},14z",
        "hl": "vi",
        "gl": "vn",
        "google_domain": "google.com.vn",
        "api_key": SERPAPI_KEY
    } #[cite: 20]

    try:
        res = requests.get(url, params=params)
        data_ks = res.json() #[cite: 20]

         # Log toàn bộ dữ liệu trả về từ SerpApi ra file để dễ quan sát cấu trúc
        # Sử dụng os.path để tính đường dẫn tuyệt đối, tránh lỗi sai đường dẫn (cwd) và lỗi escape char (\b, \a)
        current_dir = os.path.dirname(os.path.abspath(__file__))
        result_dir = os.path.join(current_dir, "result_test")
        os.makedirs(result_dir, exist_ok=True) # Tạo thư mục nếu chưa có
        
        log_file_path = os.path.join(result_dir, "serpapi_raw_log.json")
        with open(log_file_path, "w", encoding="utf-8") as f:
            json.dump(data_ks, f, indent=4, ensure_ascii=False)

        
        if "error" in data_ks:
            return {"status": "error", "message": data_ks["error"]}
        ks_tho = data_ks.get("local_results", [])
    except Exception as e:
        return {"status": "error", "message": str(e)}

    danh_sach_hop_le = []
    for ks in ks_tho:
        ten = ks.get("title", "Không tên") #[cite: 20]
        lat = ks.get("gps_coordinates", {}).get("latitude") #[cite: 20]
        lng = ks.get("gps_coordinates", {}).get("longitude") #[cite: 20]
        rating = ks.get("rating", 3.0) #[cite: 20]
        gia_tien = ks.get("extracted_price", 0) #[cite: 20]

        if not lat: continue
        if gia_tien > 0 and gia_tien > ngan_sach: continue #[cite: 20]

        khoang_cach = tinh_khoang_cach(tam_lat, tam_lng, lat, lng) #[cite: 20]

        # 2. Trích xuất các trường "ngon" như nhóm trưởng yêu cầu
        website = ks.get("website", "")
        url_img = ks.get("thumbnail", ks.get("serpapi_thumbnail", ""))
        tags = ks.get("amenities", [])
        reviews_link = ks.get("reviews_link", "")

        danh_sach_hop_le.append({
            "ten": ten,
            "lat": lat,
            "lng": lng,
            "gia_tien": gia_tien,
            "rating": rating,
            "khoang_cach_tam": khoang_cach,
            # Thêm các field mới
            "website": website,
            "url_img": url_img,
            "tags": tags,
            "reviews_link": reviews_link,
            "loai_hinh_tim_kiem": search_query # Track xem tìm theo loại gì
        })

    if not danh_sach_hop_le:
        return {"status": "error", "message": "Không có khách sạn nào thỏa mãn ngân sách."}

    # Gọi hàm chấm điểm
    danh_sach_da_cham_diem = cham_diem_khach_san(danh_sach_hop_le)

    return {
        "status": "success",
        "khach_san_chon": danh_sach_da_cham_diem[0], # Trả về KS top 1 
        "danh_sach_goi_y": danh_sach_da_cham_diem[:10] # Trả về top 5 để hiển thị 
    }

# ==========================================
# YÊU CẦU TUẦN 5: In log cấu trúc JSON ra Terminal
# ==========================================
if __name__ == "__main__":
    # Dữ liệu giả lập test module độc lập
    test_lat = 16.0544
    test_lng = 108.2022
    test_ngan_sach = 1000000
    loai_hinh_test = "resort" # Test thử với resort

    # Chạy hàm và in kết quả ra terminal
    ket_qua_json = quet_khach_san_quanh_trung_vi(test_lat, test_lng, test_ngan_sach, loai_hinh_test)
    
    # Ghi đè ra file để bạn dễ đọc vì terminal dễ bị lỗi font tiếng việt
    current_dir = os.path.dirname(os.path.abspath(__file__))
    result_dir = os.path.join(current_dir, "result_test")
    os.makedirs(result_dir, exist_ok=True)
    
    test_result_path = os.path.join(result_dir, "ket_qua_xu_ly.json")
    with open(test_result_path, "w", encoding="utf-8") as f:
        json.dump(ket_qua_json, f, indent=4, ensure_ascii=False)
        
    print(f"--- ĐÃ CHẠY XONG! Hãy kiểm tra file ket_qua_xu_ly.json tại: {test_result_path} ---")