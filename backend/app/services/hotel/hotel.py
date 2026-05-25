import requests
import math
import json
import os
import re
from dotenv import load_dotenv

load_dotenv()

# Sử dụng Key SerpAPI từ file .env
SERPAPI_KEY = os.environ.get("SERP_API_KEY") or os.environ.get("SERPAPI_KEY") or os.environ.get("SER_API_KEY")

# Đường dẫn thư mục log
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
RESULT_DIR = os.path.join(CURRENT_DIR, "result_test")

# ==========================================================
# XỬ LÝ QUY ĐỔI TIỀN TỆ (do SerpAPI bot IP không cố định)
# ==========================================================

# Mapping ký hiệu/viết tắt tiền tệ phổ biến → mã ISO 4217
CURRENCY_SYMBOLS = {
    "VND": "VND", "₫": "VND",
    "USD": "USD", "$": "USD", "US$": "USD",
    "MXN": "MXN", "MX$": "MXN",
    "KZT": "KZT", "₸": "KZT",
    "EUR": "EUR", "€": "EUR",
    "GBP": "GBP", "£": "GBP",
    "JPY": "JPY", "¥": "JPY", "JP¥": "JPY",
    "KRW": "KRW", "₩": "KRW",
    "THB": "THB", "฿": "THB",
    "CNY": "CNY", "CN¥": "CNY",
    "RUB": "RUB", "₽": "RUB",
    "INR": "INR", "₹": "INR",
    "BRL": "BRL", "R$": "BRL",
    "AUD": "AUD", "A$": "AUD",
    "CAD": "CAD", "C$": "CAD", "CA$": "CAD",
    "SGD": "SGD", "S$": "SGD",
    "TWD": "TWD", "NT$": "TWD",
    "HKD": "HKD", "HK$": "HKD",
    "PHP": "PHP", "₱": "PHP",
    "MYR": "MYR", "RM": "MYR",
    "IDR": "IDR", "Rp": "IDR",
    "ARS": "ARS", "AR$": "ARS",
    "CLP": "CLP", "CL$": "CLP",
    "COP": "COP", "CO$": "COP",
    "PEN": "PEN", "S/.": "PEN",
    "EGP": "EGP", "E£": "EGP",
    "TRY": "TRY", "₺": "TRY",
    "PLN": "PLN", "zł": "PLN",
    "CZK": "CZK", "Kč": "CZK",
    "SEK": "SEK", "kr": "SEK",
    "NOK": "NOK", "DKK": "DKK",
    "CHF": "CHF", "ZAR": "ZAR",
    "AED": "AED", "SAR": "SAR",
    "QAR": "QAR", "KWD": "KWD",
    "BHD": "BHD", "OMR": "OMR",
    "UAH": "UAH", "₴": "UAH",
    "NGN": "NGN", "₦": "NGN",
    "GHS": "GHS", "GH₵": "GHS",
    "KES": "KES", "KSh": "KES",
    "PKR": "PKR", "₨": "PKR",
    "BDT": "BDT", "৳": "BDT",
    "LKR": "LKR", "Rs": "LKR",
    "MMK": "MMK", "LAK": "LAK",
    "KHR": "KHR", "៛": "KHR",
}

# Cache tỷ giá (chỉ gọi API 1 lần mỗi phiên tìm kiếm)
_ty_gia_cache = {}


def nhan_dien_don_vi_tien(price_str):
    """
    Nhận diện đơn vị tiền tệ từ chuỗi price của SerpAPI.
    VD: "98.760 KZT" → "KZT", "275 MX$" → "MXN", "$120" → "USD"
    """
    if not price_str:
        return None
    
    # Loại bỏ số và dấu chấm/phẩy/khoảng trắng thừa để lấy phần ký hiệu tiền
    phan_tien = re.sub(r'[\d.,\s]', '', price_str).strip()
    
    if not phan_tien:
        return None
    
    # Tra trong bảng mapping
    return CURRENCY_SYMBOLS.get(phan_tien, phan_tien.upper())


def lay_ty_gia_ve_vnd(ma_tien_goc):
    """
    Lấy tỷ giá quy đổi từ ma_tien_goc → VND.
    Sử dụng API miễn phí open.er-api.com (không cần key).
    Kết quả được cache để không gọi lại nhiều lần.
    """
    if not ma_tien_goc or ma_tien_goc == "VND":
        return 1.0  # Đã là VND, không cần quy đổi
    
    # Kiểm tra cache trước
    if ma_tien_goc in _ty_gia_cache:
        return _ty_gia_cache[ma_tien_goc]
    
    try:
        api_url = f"https://open.er-api.com/v6/latest/{ma_tien_goc}"
        res = requests.get(api_url, timeout=10)
        data = res.json()
        
        if data.get("result") == "success":
            ty_gia = data["rates"].get("VND", 0)
            _ty_gia_cache[ma_tien_goc] = ty_gia
            return ty_gia
    except Exception as e:
        print(f"[HOTEL] Loi khi lay ty gia {ma_tien_goc}: {e}")
    
    return 0  # Trả về 0 nếu không lấy được tỷ giá


def quy_doi_gia_ve_vnd(extracted_price, price_str):
    """
    Quy đổi giá từ đơn vị bất kỳ (do SerpAPI trả về) sang VNĐ.
    Trả về giá đã quy đổi (int) hoặc 0 nếu không xác định được.
    """
    if not extracted_price or extracted_price <= 0:
        return 0
    
    don_vi = nhan_dien_don_vi_tien(price_str)
    
    if not don_vi or don_vi == "VND":
        return extracted_price  # Đã là VND
    
    ty_gia = lay_ty_gia_ve_vnd(don_vi)
    
    if ty_gia > 0:
        return int(extracted_price * ty_gia)
    
    return 0  # Không quy đổi được → coi như ẩn giá


def tinh_khoang_cach(lat1, lon1, lat2, lon2):
    """Tính khoảng cách đường chim bay bằng Haversine"""
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * \
        math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))


def cham_diem_khach_san(danh_sach_ks, w=None):
    """
    Hàm tính điểm khách sạn theo trọng số.
    w: mảng trọng số [w_rating, w_tag, w_kc, w_gia] được truyền từ AI 1.
       - w[0]: trọng số rating
       - w[1]: trọng số tag (sẽ được tính ở bước AI 2, ở đây chưa dùng)
       - w[2]: trọng số khoảng cách
       - w[3]: trọng số giá phòng
    Nếu không truyền w, dùng giá trị mặc định.
    """
    if not danh_sach_ks:
        return []

    # Trọng số mặc định nếu không truyền vào
    if w is None or len(w) < 4:
        w = [0.25, 0.25, 0.25, 0.25]

    w_rating = w[0]
    # w[1] (w_tag) sẽ được AI 2 sử dụng sau, ở đây bỏ qua
    w_kc = w[2]
    w_gia = w[3]

    # Tìm Min/Max để chuẩn hóa
    max_rating = max(ks["rating"] for ks in danh_sach_ks)
    min_rating = min(ks["rating"] for ks in danh_sach_ks)
    max_kc = max(ks["khoang_cach_tam"] for ks in danh_sach_ks)
    min_kc = min(ks["khoang_cach_tam"] for ks in danh_sach_ks)

    # Bỏ qua khách sạn ẩn giá (giá = 0) khi tìm min/max
    max_gia = max((ks["gia_tien"]
                  for ks in danh_sach_ks if ks["gia_tien"] > 0), default=0)
    min_gia = min((ks["gia_tien"]
                  for ks in danh_sach_ks if ks["gia_tien"] > 0), default=0)

    for ks in danh_sach_ks:
        # Chuẩn hóa (Min-Max Scaling)
        norm_rating = (ks["rating"] - min_rating) / (max_rating -
                                                     min_rating) if max_rating > min_rating else 1.0
        norm_kc = (max_kc - ks["khoang_cach_tam"]) / \
            (max_kc - min_kc) if max_kc > min_kc else 1.0

        if ks["gia_tien"] == 0 or max_gia == min_gia:
            norm_gia = 0.5  # Mức điểm trung bình cho KS bị ẩn giá
        else:
            norm_gia = (max_gia - ks["gia_tien"]) / (max_gia - min_gia)

        # Tính điểm tổng (partial score - chưa có w_tag, sẽ được AI 2 cộng thêm sau)
        ks["diem_tong"] = (w_rating * norm_rating) + \
            (w_kc * norm_kc) + (w_gia * norm_gia)

    # Sắp xếp giảm dần theo điểm tổng
    danh_sach_ks.sort(key=lambda x: x["diem_tong"], reverse=True)
    return danh_sach_ks


# Mapping các loại hình từ Frontend sang từ khóa TIẾNG ANH tối ưu trên Google Maps
# (Dùng tiếng Anh vì q="khách sạn" trả kết quả lẫn lộn hotel + homestay)
ACCOMMODATION_TYPES = {
    "Khách sạn": "Hotel",
    "Homestay": "Homestay",
    "Resort": "Resort",
    "Villa": "Villa",
    "Căn hộ": "Serviced apartment"
}


def lay_tags_tu_reviews(reviews_link):
    """
    Gọi SerpApi Reviews endpoint để lấy topics (keywords) làm tags bổ sung.
    Trả về danh sách các keyword string.
    """
    if not reviews_link or not SERPAPI_KEY:
        return []

    try:
        # Thêm api_key vào reviews_link
        separator = "&" if "?" in reviews_link else "?"
        url = f"{reviews_link}{separator}api_key={SERPAPI_KEY}"

        res = requests.get(url, timeout=15)
        data = res.json()

        # Log dữ liệu reviews ra file để quan sát cấu trúc
        os.makedirs(RESULT_DIR, exist_ok=True)
        log_path = os.path.join(RESULT_DIR, "du_lieu_reviews.json")
        with open(log_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=4, ensure_ascii=False)

        # Trích xuất keywords từ mảng topics
        topics = data.get("topics", [])
        keywords = [t.get("keyword", "") for t in topics if t.get("keyword")]

        return keywords
    except Exception as e:
        print(f"[HOTEL] Loi khi lay reviews: {e}")
        return []


def quet_khach_san_quanh_trung_vi(tam_lat, tam_lng, ngan_sach, loai_hinh_luu_tru="Khách sạn", w=None):
    """
    Hàm quét API Google Maps và lọc dữ liệu thô theo loại hình lưu trú.
    
    Args:
        tam_lat, tam_lng: Tọa độ trung vị (median) từ routing
        ngan_sach: Ngân sách lưu trú
        loai_hinh_luu_tru: Loại hình lưu trú từ Frontend (VD: "Khách sạn", "Resort"...)
        w: Mảng trọng số [w1, w2, w3, w4] từ AI 1
    """
    # 1. Xử lý loại hình lưu trú (Fallback về Hotel nếu không hợp lệ)
    search_query = ACCOMMODATION_TYPES.get(loai_hinh_luu_tru, "Hotel")

    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps",
        "q": search_query,
        "ll": f"@{tam_lat},{tam_lng},14z",
        "hl": "vi",
        "gl": "vn",
        "google_domain": "google.com.vn",
        "api_key": SERPAPI_KEY
    }

    try:
        res = requests.get(url, params=params)
        data_ks = res.json()

        # Log toàn bộ dữ liệu trả về từ SerpApi ra file để dễ quan sát cấu trúc
        os.makedirs(RESULT_DIR, exist_ok=True)
        log_file_path = os.path.join(RESULT_DIR, "serpapi_raw_log.json")
        with open(log_file_path, "w", encoding="utf-8") as f:
            json.dump(data_ks, f, indent=4, ensure_ascii=False)

        if "error" in data_ks:
            return {"status": "error", "message": data_ks["error"]}
        ks_tho = data_ks.get("local_results", [])
    except Exception as e:
        return {"status": "error", "message": str(e)}

    danh_sach_hop_le = []
    for ks in ks_tho:
        ten = ks.get("title", "Không tên")
        lat = ks.get("gps_coordinates", {}).get("latitude")
        lng = ks.get("gps_coordinates", {}).get("longitude")
        rating = ks.get("rating", 3.0)
        
        # Quy đổi giá về VNĐ (xử lý vấn đề SerpAPI bot IP trả sai đơn vị tiền)
        gia_goc = ks.get("extracted_price", 0)
        price_str = ks.get("price", "")
        gia_tien = quy_doi_gia_ve_vnd(gia_goc, price_str)

        if not lat:
            continue
        if gia_tien > 0 and gia_tien > ngan_sach:
            continue

        khoang_cach = tinh_khoang_cach(tam_lat, tam_lng, lat, lng)

        # 2. Trích xuất các trường dữ liệu quan trọng
        website = ks.get("website", "")
        url_img = ks.get("thumbnail", ks.get("serpapi_thumbnail", ""))
        tags = ks.get("amenities", [])  # Tags cơ bản từ amenities
        reviews_link = ks.get("reviews_link", "")
        address = ks.get("address", "")

        danh_sach_hop_le.append({
            "ten": ten,
            "lat": lat,
            "lng": lng,
            "gia_tien": gia_tien,
            "rating": rating,
            "khoang_cach_tam": khoang_cach,
            "website": website,
            "url_img": url_img,
            "tags": tags,
            "reviews_link": reviews_link,
            "address": address,
        })

    if not danh_sach_hop_le:
        return {"status": "error", "message": "Không có nơi lưu trú nào thỏa mãn ngân sách."}

    # 3. Chấm điểm sơ bộ (partial score) với trọng số w từ AI 1
    danh_sach_da_cham_diem = cham_diem_khach_san(danh_sach_hop_le, w)

    # 4. Giới hạn xuống Top 5 cao điểm nhất TRƯỚC KHI gọi Reviews (tiết kiệm credit SerpApi)
    top_5 = danh_sach_da_cham_diem[:5]

    # 5. Gọi Reviews API cho Top 5 để lấy topics keywords bổ sung vào tags
    for ks in top_5:
        review_keywords = lay_tags_tu_reviews(ks.get("reviews_link", ""))
        # Kết hợp amenities (tags cũ) + topics keywords (tags mới) → loại bỏ trùng lặp
        combined_tags = list(ks.get("tags", []))  # Copy amenities gốc
        for kw in review_keywords:
            if kw not in combined_tags:
                combined_tags.append(kw)
        ks["tags"] = combined_tags

    return {
        "status": "success",
        "khach_san_chon": top_5[0],                # Trả về nơi lưu trú top 1
        "danh_sach_goi_y": top_5                   # Trả về top 5 để hiển thị
    }


# ==========================================
# YÊU CẦU TUẦN 5: In log cấu trúc JSON ra Terminal
# ==========================================
if __name__ == "__main__":
    # Dữ liệu giả lập test module độc lập
    test_lat = 16.0544
    test_lng = 108.2022
    test_ngan_sach = 1000000
    loai_hinh_test = "Resort"
    test_w = [0.3, 0.2, 0.3, 0.2]  # Test với trọng số mẫu

    # Chạy hàm và in kết quả ra file
    ket_qua_json = quet_khach_san_quanh_trung_vi(
        test_lat, test_lng, test_ngan_sach, loai_hinh_test, test_w
    )
    
    # Ghi ra file để dễ đọc (tránh lỗi font tiếng Việt trên terminal Windows)
    os.makedirs(RESULT_DIR, exist_ok=True)
    test_result_path = os.path.join(RESULT_DIR, "ket_qua_xu_ly.json")
    with open(test_result_path, "w", encoding="utf-8") as f:
        json.dump(ket_qua_json, f, indent=4, ensure_ascii=False)
        
    print(f"--- DA CHAY XONG! Kiem tra file tai: {test_result_path} ---")
