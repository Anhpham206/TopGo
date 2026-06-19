import datetime
import math

CITY_DIST = {
    "ha_noi-hcm": 1700, "hcm-ha_noi": 1700, "ha_noi-da_nang": 764, "da_nang-ha_noi": 764,
    "ha_noi-hoi_an": 773, "hoi_an-ha_noi": 773, "ha_noi-nha_trang": 1278, "nha_trang-ha_noi": 1278,
    "ha_noi-lam_dong": 1480, "lam_dong-ha_noi": 1480, "ha_noi-phu_quoc": 2050, "phu_quoc-ha_noi": 2050,
    "ha_noi-ninh_binh": 93, "ninh_binh-ha_noi": 93, "ha_noi-ha_long": 165, "ha_long-ha_noi": 165,
    "ha_noi-quy_nhon": 1070, "quy_nhon-ha_noi": 1070, "ha_noi-hue": 666, "hue-ha_noi": 666,
    "hcm-da_nang": 964, "da_nang-hcm": 964, "hcm-hoi_an": 970, "hoi_an-hcm": 970,
    "hcm-nha_trang": 448, "nha_trang-hcm": 448, "hcm-lam_dong": 308, "lam_dong-hcm": 308,
    "hcm-phu_quoc": 460, "phu_quoc-hcm": 460, "hcm-binh_thuan": 198, "binh_thuan-hcm": 198,
    "hcm-ca_mau": 350, "ca_mau-hcm": 350, "hcm-can_tho": 170, "can_tho-hcm": 170,
    "hcm-ninh_thuan": 350, "ninh_thuan-hcm": 350, "hcm-hue": 1045, "hue-hcm": 1045,
    "da_nang-hoi_an": 30, "hoi_an-da_nang": 30, "da_nang-nha_trang": 534, "nha_trang-da_nang": 534,
    "da_nang-lam_dong": 420, "lam_dong-da_nang": 420, "da_nang-ninh_binh": 480, "ninh_binh-da_nang": 480,
    "da_nang-hue": 100, "hue-da_nang": 100, "nha_trang-lam_dong": 135, "lam_dong-nha_trang": 135,
    "nha_trang-ninh_thuan": 105, "ninh_thuan-nha_trang": 105, "nha_trang-binh_thuan": 250, "binh_thuan-nha_trang": 250,
    "lam_dong-binh_thuan": 160, "binh_thuan-lam_dong": 160, "can_tho-ca_mau": 180, "ca_mau-can_tho": 180,
    "can_tho-phu_quoc": 300, "phu_quoc-can_tho": 300,
}

TRANSPORT_MIN_PER_PAX = {
    "Máy bay": 700000, "Tàu hỏa": 200000, "Xe khách": 150000,
    "Ô tô riêng": 0, "Thuê ô tô tự lái": 400000, "Xe máy": 0, "Xe đạp": 0
}

TRAIN_COST_PER_KM = 1000
BUS_COST_PER_KM = 800

ACCOMMODATION_MIN_PER_NIGHT = {
    "Resort": 1200000, "Villa": 1500000, "Khách sạn": 400000,
    "Homestay": 250000, "Airbnb": 350000, "Căn hộ": 300000, "Khác": 200000
}

VALID_TRANSPORT_TYPES = ['Xe khách', 'Máy bay', 'Tàu hỏa', 'Ô tô riêng', 'Xe máy', 'Thuê ô tô tự lái', 'Xe đạp', 'Khác']
VALID_ACCOMMODATION_TYPES = ['Khách sạn', 'Homestay', 'Airbnb', 'Resort', 'Villa', 'Căn hộ', 'Khác']


def validate_payload_l3(payload: dict) -> list:
    """
    Thực hiện kiểm lỗi Lớp 3 (Xác thực Nghiệp vụ Chuyên sâu) ở Backend.
    Trả về danh sách chứa các thông báo lỗi (rỗng nếu không có lỗi).
    """
    errors = []
    
    city_id = payload.get("city_id")
    pax = payload.get("pax")
    date_start = payload.get("date_start")
    date_end = payload.get("date_end")
    budget = payload.get("budget", 0)
    transport = payload.get("transport")
    accommodation = payload.get("accommodation")
    places = payload.get("places", [])
    dep_city_id = payload.get("dep_city_id")
    departure_time = payload.get("departure_time", "08:00")
    return_time = payload.get("return_time", "22:00")

    # 1. Xác thực thành phố đích
    if not city_id:
        errors.append("Chưa chọn thành phố muốn đến.")

    # 2. Xác thực số lượng hành khách
    if pax is None or not isinstance(pax, int) or pax < 1 or pax > 50:
        errors.append("Số lượng hành khách phải từ 1 đến 50.")
        pax_val = 1
    else:
        pax_val = pax

    # 3. Tính trọn vẹn và hợp lý thời gian
    days = 1
    dates_valid = True
    if not date_start or not date_end:
        errors.append("Vui lòng chọn ngày bắt đầu và ngày kết thúc tham quan.")
        dates_valid = False
    else:
        try:
            start_dt = datetime.datetime.strptime(date_start, "%Y-%m-%d")
            end_dt = datetime.datetime.strptime(date_end, "%Y-%m-%d")
            
            # So sánh với ngày hiện tại (chỉ lấy phần ngày để tránh chênh lệch giờ phút giây)
            today = datetime.datetime.now()
            today_date = datetime.datetime(today.year, today.month, today.day)
            
            if start_dt < today_date:
                errors.append("Ngày bắt đầu tham quan không được ở quá khứ.")
                
            diff = (end_dt - start_dt).days
            days = max(1, diff + 1)
            
            if diff < 0:
                errors.append("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu.")
            elif diff > 7:
                errors.append(f"Khoảng thời gian vượt quá 7 ngày (hiện tại: {diff} ngày).")
                
            if diff == 0 and departure_time and return_time:
                try:
                    t_start = datetime.datetime.strptime(departure_time, "%H:%M")
                    t_end = datetime.datetime.strptime(return_time, "%H:%M")
                    if t_end <= t_start:
                        errors.append("Trong cùng một ngày, giờ kết thúc tham quan phải sau giờ bắt đầu.")
                except ValueError:
                    pass
        except ValueError:
            errors.append("Định dạng ngày không hợp lệ.")
            dates_valid = False

    # 4. Xác thực ngân sách
    try:
        budget_val = float(budget)
    except (ValueError, TypeError):
        budget_val = 0.0

    if budget_val <= 0:
        errors.append("Ngân sách phải là số dương lớn hơn 0.")
    else:
        min_budget = pax_val * days * 50000
        if budget_val < min_budget:
            errors.append(f"Ngân sách quá thấp. Tối thiểu {int(min_budget):,} ₫.".replace(",", "."))

    # 5. Xác thực loại phương tiện & loại hình lưu trú
    if transport and transport not in VALID_TRANSPORT_TYPES:
        errors.append("Loại phương tiện không hợp lệ. Vui lòng chọn lại từ danh sách.")
        
    if accommodation and accommodation not in VALID_ACCOMMODATION_TYPES:
        errors.append("Loại hình lưu trú không hợp lệ. Vui lòng chọn lại từ danh sách.")

    # 6. Giới hạn số lượng địa điểm tham quan
    if len(places) > 10:
        errors.append("Số lượng địa điểm tham quan không được vượt quá 10.")

    # 7. Ràng buộc di chuyển & lưu trú nâng cao
    if dates_valid and city_id:
        def normalize_city_id(cid):
            if not cid:
                return ""
            if cid == "thanh_pho_ho_chi_minh":
                return "hcm"
            return cid

        norm_dep = normalize_city_id(dep_city_id)
        norm_dest = normalize_city_id(city_id)
        is_intercity = norm_dep and norm_dest and norm_dep != norm_dest
        distance = CITY_DIST.get(f"{norm_dep}-{norm_dest}") or CITY_DIST.get(f"{norm_dest}-{norm_dep}") or 0

        # Ràng buộc xe đạp
        if transport == "Xe đạp":
            if is_intercity:
                errors.append("Xe đạp chỉ phù hợp khi di chuyển trong cùng một thành phố/tỉnh. Vui lòng chọn phương tiện khác cho chuyến đi liên tỉnh.")
        
        # Ràng buộc liên tỉnh
        elif is_intercity and distance > 0:
            if transport == "Xe máy" and distance > 200:
                errors.append(f"Khoảng cách quá xa ({int(distance)} km). Việc đi xe máy liên tỉnh trên 200km không được khuyến nghị để đảm bảo an toàn.")
            
            elif transport == "Tàu hỏa":
                cost = pax_val * distance * TRAIN_COST_PER_KM * 2
                if budget_val < cost:
                    errors.append(f"Ngân sách không đủ cho vé tàu hỏa khứ hồi (ước tính {int(cost):,} ₫ cho {pax_val} người).".replace(",", "."))
            
            elif transport == "Xe khách":
                if distance > 800:
                    errors.append(f"Khoảng cách quá xa ({int(distance)} km). Đi xe khách trên 800km sẽ rất mệt mỏi, hệ thống khuyên dùng máy bay hoặc tàu hỏa.")
                cost = pax_val * distance * BUS_COST_PER_KM * 2
                if budget_val < cost:
                    errors.append(f"Ngân sách không đủ cho vé xe khách khứ hồi (ước tính {int(cost):,} ₫ cho {pax_val} người).".replace(",", "."))

        # Ràng buộc máy bay
        if transport == "Máy bay":
            min_flight = pax_val * TRANSPORT_MIN_PER_PAX["Máy bay"] * 2
            if budget_val < min_flight:
                errors.append(f"Ngân sách quá thấp cho vé máy bay khứ hồi. Cần tối thiểu ~{int(min_flight):,} ₫.".replace(",", "."))

        # Ràng buộc thuê xe ô tô tự lái
        if transport == "Thuê ô tô tự lái":
            rental_cost = 500000 * days
            if budget_val < rental_cost:
                errors.append(f"Ngân sách không đủ cho thuê xe tự lái {days} ngày (tối thiểu {int(rental_cost):,} ₫).".replace(",", "."))

        # Ràng buộc chi phí lưu trú tối thiểu
        if accommodation and accommodation != "Khác":
            min_per_night = ACCOMMODATION_MIN_PER_NIGHT.get(accommodation, 200000)
            rooms_needed = math.ceil(pax_val / 2)
            total_min_accom = min_per_night * rooms_needed * days
            if budget_val < total_min_accom:
                errors.append(f"Ngân sách không đủ cho {accommodation} với {pax_val} người trong {days} ngày. Cần tối thiểu ~{int(total_min_accom):,} ₫.".replace(",", "."))

    return errors
