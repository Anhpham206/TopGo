# import requests
# import math
# import time
# import statistics
# SERPAPI_KEY = "a39aa607f980bf1f586c96a24350f95db5984fc96d9f461d42537548786ee5d2" # Ví dụ: a39aa607...

# #tính khoảng cách giữa hai điểm khi biết kinh, vĩ độ của 2 điểm đó
# def tinh_khoang_cach(lat1, lon1, lat2, lon2):
#     R = 6371.0
#     dlat = math.radians(lat2 - lat1); dlon = math.radians(lon2 - lon1)
#     a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
#     return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

# #hàm lấy tọa độ
# def lay_toa_do(ten_dia_diem):
#     url = "https://nominatim.openstreetmap.org/search"
#     headers = {"User-Agent": "SmartTour_App_KHTN_TuanPC_v1"} 
    
#     try:
#         # Ép Nominatim phải dính thêm chữ "Việt Nam" vào đuôi từ khóa
#         tu_khoa_tim_kiem = f"{ten_dia_diem}, Việt Nam"
        
#         res = requests.get(url, params={"q": tu_khoa_tim_kiem, "format": "json", "limit": 1}, headers=headers)
#         data = res.json()
        
#         if isinstance(data, list) and len(data) > 0:
#             return float(data[0]["lat"]), float(data[0]["lon"])
#         else:
#             print(f"⚠️ Cảnh báo: Không tìm thấy tọa độ cho '{ten_dia_diem}' tại Việt Nam.")
#             return None, None
            
#     except Exception as e:
#         print(f"❌ Lỗi gọi API: {e}")
#         return None, None

# #hàm chạy chính
# def chay_he_thong_goi_y(danh_sach_diem, ngan_sach, tags_so_thich):
#     # 1. Lấy tọa độ và Tính Tâm
#     diem_co_toa_do = []
#     for ten in danh_sach_diem:
#         lat, lng = lay_toa_do(ten)
#         if lat and lng: 
#             diem_co_toa_do.append({"ten": ten, "lat": lat, "lng": lng})
#         time.sleep(1) # <--- Thêm dòng này để ngủ 1 giây giữa mỗi lần tìm tọa độ
    
#     if not diem_co_toa_do: return {"error": "Không tìm thấy tọa độ các điểm đến."}
    
#     tam_lat = statistics.median(d["lat"] for d in diem_co_toa_do)
#     tam_lng = statistics.median(d["lng"] for d in diem_co_toa_do)

# # 2. Quét SerpApi lấy khách sạn thô
#     res = requests.get("https://serpapi.com/search.json", params={
#         "engine": "google_maps", 
#         "q": "Khách sạn", 
#         "ll": f"@{tam_lat},{tam_lng},15z", 
#         "hl": "vi",   # Ép Google Maps trả về Tiếng Việt
#         "gl": "vn",   # Ép Google Maps định vị ở Việt Nam (để lấy giá VNĐ)
#         "google_domain": "google.com.vn", # Thêm dòng này vào
#         "api_key": SERPAPI_KEY
#     })
    
#     try:
#         data_ks = res.json()
        
#         # Kiểm tra xem SerpApi có trả về thông báo lỗi dạng JSON không (ví dụ: Hết credit)
#         if "error" in data_ks:
#             print("⚠️ SerpApi từ chối phục vụ:", data_ks["error"])
#             return {"error": f"Lỗi từ máy chủ khách sạn: {data_ks['error']}"}
            
#         ks_tho = data_ks.get("local_results", [])
        
#     except Exception as e:
#         # Nếu nó trả về HTML hoặc trang trắng, in thẳng nội dung ra Terminal để bắt lỗi
#         print(f"❌ Lỗi vỡ JSON từ SerpApi. Mã lỗi HTTP: {res.status_code}")
#         print(f"Nội dung thật sự mà SerpApi trả về là: {res.text}")
#         return {"error": "Hệ thống khách sạn đang bảo trì hoặc từ chối kết nối."}
    
    
#    # 3. BỘ LỌC & XẾP HẠNG (Thuật toán Trọng số của Backend)
#     ks_hop_le = []
    
#     # --- IN LOG RA TERMINAL CHO ĐẸP VÀ DỄ THEO DÕI ---
#     print("\n" + "="*90)
#     print(f"🎯 TỌA ĐỘ TÂM ĐIỂM (Của các điểm đến): Lát {tam_lat:.6f}, Lng {tam_lng:.6f}")
#     print("🏨 DANH SÁCH KHÁCH SẠN CÀO ĐƯỢC TỪ SERPAPI (CHƯA LỌC)")
#     print("="*90)
    
#     for i, ks in enumerate(ks_tho, 1):
#         # Rút trích tạm dữ liệu để in Log
#         ten_log = ks.get("title", "Không tên")
#         lat_log = ks.get("gps_coordinates", {}).get("latitude")
#         lng_log = ks.get("gps_coordinates", {}).get("longitude")
#         gia_txt_log = str(ks.get("price", "Ẩn giá"))
#         gia_so_log = ks.get("extracted_price", 0)
#         rating_log = ks.get("rating", "-")
        
#         # Xử lý Tags (Amenities)
#         amenities = ks.get("amenities", [])
#         if isinstance(amenities, list) and amenities:
#             tags_log = ", ".join(amenities)
#         else:
#             tags_log = "Không có thông tin tag"
            
#         # Tính toán khoảng cách tới tâm
#         if lat_log and lng_log:
#             kc_log = tinh_khoang_cach(tam_lat, tam_lng, lat_log, lng_log)
#             kc_str = f"{kc_log:.2f} km"
#             toa_do_str = f"({lat_log:.4f}, {lng_log:.4f})"
#         else:
#             kc_str = "Không rõ"
#             toa_do_str = "(Không có tọa độ)"

#         # In ra màn hình theo cấu trúc 3 dòng cực kỳ gọn gàng
#         print(f"[{i:02d}] {ten_log[:40]:<42} | ⭐ {rating_log:<3} | 🎯 Cách tâm: {kc_str}")
#         print(f"     📍 Tọa độ: {toa_do_str:<25} | 💰 Giá: {gia_txt_log:<12} (Lõi: {gia_so_log})")
#         print(f"     🏷️ Tags: {tags_log[:75]}..." if len(tags_log) > 75 else f"     🏷️ Tags: {tags_log}")
#         print("-" * 90)
        
#     print("="*90 + "\n")
#     # --------------------------------------------------

   
   
#     # BƯỚC 3.1: LỌC CỨNG & TÍNH TOÁN CÁC CHỈ SỐ THÔ
#     danh_sach_tho_da_loc = []
#     for ks in ks_tho:
#         ten = ks.get("title", "Khách sạn")
#         lat = ks.get("gps_coordinates", {}).get("latitude")
#         lng = ks.get("gps_coordinates", {}).get("longitude")
#         rating = ks.get("rating", 3.0)
#         mo_ta = str(ks.get("amenities", "")) + str(ks.get("description", ""))
        
#       # --- BỘ XỬ LÝ TIỀN TỆ QUỐC TẾ TỰ ĐỘNG ---
#         gia_text = str(ks.get("price", "")).upper()
#         gia_tri_gia = ks.get("extracted_price", 0) 
        
#         # Bảng tỉ giá tham khảo (1 Ngoại tệ = ? VNĐ)
#         TI_GIA = {
#             "USD": 25000, "$": 25000,
#             "RUB": 270,    # Rúp Nga ~ 270 đ
#             "PKR": 90,     # Rupee Pakistan ~ 90 đ
#             "INR": 300,    # Rupee Ấn Độ ~ 300 đ
#             "IDR": 1.6,    # Rupiah Indo ~ 1.6 đ
#             "THB": 700,    # Baht Thái ~ 700 đ
#             "EUR": 27000, "€": 27000
#         }
        
#         da_xu_ly = False
        
#         # 1. Nếu là tiền Việt chuẩn (VND, VNĐ, ₫) -> Bỏ qua, lấy số gốc
#         if "₫" in gia_text or "VND" in gia_text or "VNĐ" in gia_text:
#             da_xu_ly = True
            
#         # 2. Quét xem có dính ngoại tệ nào trong Bảng tỉ giá không
#         elif gia_text != "":
#             for ma_tien, ti_gia in TI_GIA.items():
#                 if ma_tien in gia_text:
#                     # Nhân số tiền lõi với tỉ giá
#                     gia_tri_gia = int(gia_tri_gia * ti_gia)
#                     da_xu_ly = True
#                     break # Tìm thấy rồi thì dừng vòng lặp
        
#         # 3. Nếu rớt vào 1 đồng tiền quá lạ chưa có trong từ điển -> Ép về 0 (Ẩn giá)
#         if not da_xu_ly and gia_text != "":
#             gia_tri_gia = 0
            
#         # ----------------------------------------
            
#         if not lat: continue
#         if gia_tri_gia > 0 and gia_tri_gia > ngan_sach: continue
        
#         khoang_cach_tam = tinh_khoang_cach(tam_lat, tam_lng, lat, lng)
#         so_tag_khop = sum(1 for tag in tags_so_thich if tag.lower() in mo_ta.lower())
        
#         # Lưu trữ tạm thời vào danh sách nháp
#         danh_sach_tho_da_loc.append({
#             "ten": ten, "lat": lat, "lng": lng, "gia": gia_tri_gia, 
#             "rating": rating, "so_tag": so_tag_khop, "kc_tam": khoang_cach_tam
#         })

#     if not danh_sach_tho_da_loc: return {"error": "Không có khách sạn nào thỏa mãn ngân sách."}

#     # BƯỚC 3.2: TÌM GIÁ TRỊ LỚN NHẤT & NHỎ NHẤT (MIN/MAX)
#     max_rating = max(ks["rating"] for ks in danh_sach_tho_da_loc)
#     min_rating = min(ks["rating"] for ks in danh_sach_tho_da_loc)
    
#     max_tags = max(ks["so_tag"] for ks in danh_sach_tho_da_loc)
#     min_tags = min(ks["so_tag"] for ks in danh_sach_tho_da_loc)
    
#     max_kc = max(ks["kc_tam"] for ks in danh_sach_tho_da_loc)
#     min_kc = min(ks["kc_tam"] for ks in danh_sach_tho_da_loc)

#     max_gia = max((ks["gia"] for ks in danh_sach_tho_da_loc if ks["gia"] > 0), default=0)
#     min_gia = min((ks["gia"] for ks in danh_sach_tho_da_loc if ks["gia"] > 0), default=0)

#     # BƯỚC 3.3: CHUẨN HÓA VÀ CHẤM ĐIỂM
#     w1_rating = 2.0
#     w2_tags = 3.0
#     w3_distance = 1.5 
#     w4_price = 1.0 # Giá càng rẻ càng cộng nhiều điểm
    
#     ks_hop_le_moi = []
    
#     for ks in danh_sach_tho_da_loc:
#         # Nhóm Lợi ích (Càng cao càng tốt)
#         norm_rating = (ks["rating"] - min_rating) / (max_rating - min_rating) if max_rating > min_rating else 1.0
#         norm_tags = (ks["so_tag"] - min_tags) / (max_tags - min_tags) if max_tags > min_tags else 1.0
        
#         # Nhóm Chi phí (Đảo ngược: Càng thấp càng tốt)
#         norm_kc = (max_kc - ks["kc_tam"]) / (max_kc - min_kc) if max_kc > min_kc else 1.0
        
#         # Riêng giá tiền: Xử lý ngoại lệ nếu ẩn giá (gia=0) thì cho 0.5 điểm (mức trung bình)
#         if ks["gia"] == 0 or max_gia == min_gia:
#             norm_gia = 0.5 
#         else:
#             norm_gia = (max_gia - ks["gia"]) / (max_gia - min_gia)

#         # Công thức TỔNG hoàn hảo (Chỉ cộng)
#         diem_tong = (w1_rating * norm_rating) + (w2_tags * norm_tags) + (w3_distance * norm_kc) + (w4_price * norm_gia)
        
#         ks["diem"] = diem_tong
#         ks_hop_le_moi.append(ks)

#     # Sắp xếp giảm dần theo Điểm số
#     ks_hop_le_moi.sort(key=lambda x: x["diem"], reverse=True)
#     khach_san_chon = ks_hop_le_moi[0] # Chọn Top 1

#     # Format lại giá tiền cho đẹp
#     if khach_san_chon["gia"] == 0:
#         khach_san_chon["gia"] = "Đang cập nhật"
#     else:
#         khach_san_chon["gia"] = f"{khach_san_chon['gia']:,}".replace(",", ".")

#     # 4. THUẬT TOÁN TSP (Tham lam)
#     diem_hien_tai = khach_san_chon
#     chua_di = diem_co_toa_do.copy()
#     lo_trinh = [{"ten": f"🏨 Khách sạn: {khach_san_chon['ten']} (Bắt đầu)"}]
    
#     while chua_di:
#         diem_tiep = min(chua_di, key=lambda d: tinh_khoang_cach(diem_hien_tai["lat"], diem_hien_tai["lng"], d["lat"], d["lng"]))
#         lo_trinh.append({"ten": f"📍 {diem_tiep['ten']}"})
#         diem_hien_tai = diem_tiep
#         chua_di.remove(diem_tiep)
#     lo_trinh.append({"ten": f"🏨 Về lại {khach_san_chon['ten']} nghỉ ngơi"})

#     return {"khach_san": khach_san_chon, "lo_trinh": lo_trinh}



import requests
import math
import time
import statistics

SERPAPI_KEY = "a39aa607f980bf1f586c96a24350f95db5984fc96d9f461d42537548786ee5d2"

# ---------------------------------------------------------
# CÁC HÀM CÔNG CỤ CƠ BẢN
# ---------------------------------------------------------
def tinh_khoang_cach(lat1, lon1, lat2, lon2):
    R = 6371.0
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon/2)**2
    return R * (2 * math.atan2(math.sqrt(a), math.sqrt(1-a)))

def lay_toa_do(ten_dia_diem):
    url = "https://nominatim.openstreetmap.org/search"
    headers = {"User-Agent": "SmartTour_App_KHTN_TuanPC_v1"} 
    try:
        tu_khoa_tim_kiem = f"{ten_dia_diem}, Việt Nam"
        res = requests.get(url, params={"q": tu_khoa_tim_kiem, "format": "json", "limit": 1}, headers=headers)
        data = res.json()
        if isinstance(data, list) and len(data) > 0:
            return float(data[0]["lat"]), float(data[0]["lon"])
        else:
            print(f"⚠️ Cảnh báo: Không tìm thấy tọa độ cho '{ten_dia_diem}' tại Việt Nam.")
            return None, None
    except Exception as e:
        print(f"❌ Lỗi gọi API: {e}")
        return None, None

# ---------------------------------------------------------
# MODULE 1: TÍNH TÂM ĐIỂM (TRUNG VỊ)
# ---------------------------------------------------------
def tinh_tam_diem(danh_sach_diem):
    diem_co_toa_do = []
    for ten in danh_sach_diem:
        lat, lng = lay_toa_do(ten)
        if lat and lng: 
            diem_co_toa_do.append({"ten": ten, "lat": lat, "lng": lng})
        time.sleep(1) 
    
    if not diem_co_toa_do: 
        return None, None, None
    
    tam_lat = statistics.median(d["lat"] for d in diem_co_toa_do)
    tam_lng = statistics.median(d["lng"] for d in diem_co_toa_do)
    
    return tam_lat, tam_lng, diem_co_toa_do

# ---------------------------------------------------------
# MODULE 2: GỌI API SERPAPI VÀ IN LOG
# ---------------------------------------------------------
def quet_khach_san_serpapi(tam_lat, tam_lng):
    res = requests.get("https://serpapi.com/search.json", params={
        "engine": "google_maps", 
        "q": "Khách sạn", 
        "ll": f"@{tam_lat},{tam_lng},13z", # Dùng 13z cho tối ưu
        "hl": "vi", "gl": "vn",
        "google_domain": "google.com.vn",
        "api_key": SERPAPI_KEY
    })
    try:
        data_ks = res.json()
        if "error" in data_ks:
            print("⚠️ SerpApi từ chối phục vụ:", data_ks["error"])
            return None
        return data_ks.get("local_results", [])
    except Exception as e:
        print(f"❌ Lỗi vỡ JSON từ SerpApi. Mã lỗi HTTP: {res.status_code}")
        return None

def in_log_terminal(ks_tho, tam_lat, tam_lng):
    print("\n" + "="*90)
    print(f"🎯 TỌA ĐỘ TÂM ĐIỂM: Lát {tam_lat:.6f}, Lng {tam_lng:.6f}")
    print("🏨 DANH SÁCH KHÁCH SẠN CÀO ĐƯỢC TỪ SERPAPI (CHƯA LỌC)")
    print("="*90)
    
    for i, ks in enumerate(ks_tho, 1):
        ten_log = ks.get("title", "Không tên")
        lat_log = ks.get("gps_coordinates", {}).get("latitude")
        lng_log = ks.get("gps_coordinates", {}).get("longitude")
        gia_txt_log = str(ks.get("price", "Ẩn giá"))
        gia_so_log = ks.get("extracted_price", 0)
        rating_log = ks.get("rating", "-")
        
        tags_log = ", ".join(ks.get("amenities", [])) if isinstance(ks.get("amenities", []), list) and ks.get("amenities", []) else "Không có thông tin tag"
        
        if lat_log and lng_log:
            kc_log = tinh_khoang_cach(tam_lat, tam_lng, lat_log, lng_log)
            kc_str = f"{kc_log:.2f} km"
            toa_do_str = f"({lat_log:.4f}, {lng_log:.4f})"
        else:
            kc_str, toa_do_str = "Không rõ", "(Không có tọa độ)"

        print(f"[{i:02d}] {ten_log[:40]:<42} | ⭐ {rating_log:<3} | 🎯 Cách tâm: {kc_str}")
        print(f"     📍 Tọa độ: {toa_do_str:<25} | 💰 Giá: {gia_txt_log:<12} (Lõi: {gia_so_log})")
        print(f"     🏷️ Tags: {tags_log[:75]}..." if len(tags_log) > 75 else f"     🏷️ Tags: {tags_log}")
        print("-" * 90)
    print("="*90 + "\n")

# ---------------------------------------------------------
# MODULE 3: LỌC CỨNG, XỬ LÝ TIỀN TỆ & TÍNH RAW STATS
# ---------------------------------------------------------
def loc_va_xu_ly_tien_te(ks_tho, ngan_sach, tam_lat, tam_lng, tags_so_thich=[]):
    danh_sach_tho_da_loc = []
    
    # Từ điển quy đổi tỷ giá
    TI_GIA = {"USD": 25000, "$": 25000, "RUB": 270, "PKR": 90, "INR": 300, "IDR": 1.6, "THB": 700, "EUR": 27000, "€": 27000}
    
    for ks in ks_tho:
        ten = ks.get("title", "Khách sạn")
        lat = ks.get("gps_coordinates", {}).get("latitude")
        lng = ks.get("gps_coordinates", {}).get("longitude")
        rating = ks.get("rating", 3.0)
        mo_ta = str(ks.get("amenities", "")) + str(ks.get("description", ""))
        
        gia_text = str(ks.get("price", "")).upper()
        gia_tri_gia = ks.get("extracted_price", 0) 
        da_xu_ly = False
        
        if "₫" in gia_text or "VND" in gia_text or "VNĐ" in gia_text:
            da_xu_ly = True
        elif gia_text != "":
            for ma_tien, ti_gia in TI_GIA.items():
                if ma_tien in gia_text:
                    gia_tri_gia = int(gia_tri_gia * ti_gia)
                    da_xu_ly = True
                    break
        if not da_xu_ly and gia_text != "":
            gia_tri_gia = 0
            
        if not lat: continue
        if gia_tri_gia > 0 and gia_tri_gia > ngan_sach: continue
        
        khoang_cach_tam = tinh_khoang_cach(tam_lat, tam_lng, lat, lng)
        so_tag_khop = sum(1 for tag in tags_so_thich if tag.lower() in mo_ta.lower())
        
        danh_sach_tho_da_loc.append({
            "ten": ten, "lat": lat, "lng": lng, "gia": gia_tri_gia, 
            "rating": rating, "so_tag": so_tag_khop, "kc_tam": khoang_cach_tam
        })
    return danh_sach_tho_da_loc

# ---------------------------------------------------------
# MODULE 4: CHUẨN HÓA MIN-MAX & CHẤM ĐIỂM (Cốt lõi)
# ---------------------------------------------------------
def cham_diem_min_max(danh_sach_tho_da_loc):
    if not danh_sach_tho_da_loc: return []
    
    max_rating = max(ks["rating"] for ks in danh_sach_tho_da_loc)
    min_rating = min(ks["rating"] for ks in danh_sach_tho_da_loc)
    max_tags = max(ks["so_tag"] for ks in danh_sach_tho_da_loc)
    min_tags = min(ks["so_tag"] for ks in danh_sach_tho_da_loc)
    max_kc = max(ks["kc_tam"] for ks in danh_sach_tho_da_loc)
    min_kc = min(ks["kc_tam"] for ks in danh_sach_tho_da_loc)
    max_gia = max((ks["gia"] for ks in danh_sach_tho_da_loc if ks["gia"] > 0), default=0)
    min_gia = min((ks["gia"] for ks in danh_sach_tho_da_loc if ks["gia"] > 0), default=0)

    # Trọng số
    w1_rating = 2.0
    w2_tags = 3.0
    w3_distance = 1.5 
    w4_price = 1.0 
    
    ks_hop_le_moi = []
    
    for ks in danh_sach_tho_da_loc:
        norm_rating = (ks["rating"] - min_rating) / (max_rating - min_rating) if max_rating > min_rating else 1.0
        norm_tags = (ks["so_tag"] - min_tags) / (max_tags - min_tags) if max_tags > min_tags else 1.0
        norm_kc = (max_kc - ks["kc_tam"]) / (max_kc - min_kc) if max_kc > min_kc else 1.0
        
        if ks["gia"] == 0 or max_gia == min_gia:
            norm_gia = 0.5 
        else:
            norm_gia = (max_gia - ks["gia"]) / (max_gia - min_gia)

        ks["diem"] = (w1_rating * norm_rating) + (w2_tags * norm_tags) + (w3_distance * norm_kc) + (w4_price * norm_gia)
        ks_hop_le_moi.append(ks)

    ks_hop_le_moi.sort(key=lambda x: x["diem"], reverse=True)
    return ks_hop_le_moi

# ---------------------------------------------------------
# MODULE 5: THUẬT TOÁN TSP (THAM LAM)
# ---------------------------------------------------------
def tao_lo_trinh_tsp(khach_san_chon, diem_co_toa_do):
    diem_hien_tai = khach_san_chon
    chua_di = diem_co_toa_do.copy()
    lo_trinh = [{"ten": f"🏨 Khách sạn: {khach_san_chon['ten']} (Bắt đầu)"}]
    
    while chua_di:
        diem_tiep = min(chua_di, key=lambda d: tinh_khoang_cach(diem_hien_tai["lat"], diem_hien_tai["lng"], d["lat"], d["lng"]))
        lo_trinh.append({"ten": f"📍 {diem_tiep['ten']}"})
        diem_hien_tai = diem_tiep
        chua_di.remove(diem_tiep)
    lo_trinh.append({"ten": f"🏨 Về lại {khach_san_chon['ten']} nghỉ ngơi"})
    
    return lo_trinh

# ---------------------------------------------------------
# TỔNG TƯ LỆNH: HÀM CHẠY CHÍNH
# ---------------------------------------------------------
def chay_he_thong_goi_y(danh_sach_diem, ngan_sach, tags_so_thich=[]):
    # Bước 1
    tam_lat, tam_lng, diem_co_toa_do = tinh_tam_diem(danh_sach_diem)
    if not tam_lat: return {"error": "Không tìm thấy tọa độ các điểm đến."}
    
    # Bước 2
    ks_tho = quet_khach_san_serpapi(tam_lat, tam_lng)
    if not ks_tho: return {"error": "Lỗi cào dữ liệu SerpApi."}
    in_log_terminal(ks_tho, tam_lat, tam_lng)
    
    # Bước 3
    ds_da_loc = loc_va_xu_ly_tien_te(ks_tho, ngan_sach, tam_lat, tam_lng, tags_so_thich)
    if not ds_da_loc: return {"error": "Không có khách sạn nào thỏa mãn ngân sách."}
    
    # Bước 4
    ks_da_cham_diem = cham_diem_min_max(ds_da_loc)
    khach_san_chon = ks_da_cham_diem[0]
    
    if khach_san_chon["gia"] == 0:
        khach_san_chon["gia"] = "Đang cập nhật"
    else:
        khach_san_chon["gia"] = f"{khach_san_chon['gia']:,}".replace(",", ".")
        
    # Bước 5
    lo_trinh = tao_lo_trinh_tsp(khach_san_chon, diem_co_toa_do)
    
    return {"khach_san": khach_san_chon, "lo_trinh": lo_trinh}