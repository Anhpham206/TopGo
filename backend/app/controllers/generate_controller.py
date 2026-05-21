import json
import os
import datetime
import asyncio
from app.services.ai_logic.ai_logic import call_ai_1, call_ai_2
from app.services.routing_service.routing_service import generate_itinerary
from app.services.hotel.hotel import quet_khach_san_quanh_trung_vi

BASE_DIR = os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__))))  # backend/
DATASET_DIR = os.path.abspath(os.path.join(BASE_DIR, "../dataset"))
FRONTEND_LOGS_DIR = os.path.abspath(os.path.join(BASE_DIR, "../frontend/logs"))


async def generate_itinerary_stream(payload: dict):
    try:
        # Step 0: Lưu log yêu cầu
        # code tao lich trinh

        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        os.makedirs(FRONTEND_LOGS_DIR, exist_ok=True)
        log_file = os.path.join(FRONTEND_LOGS_DIR, f"payload_{timestamp}.json")
        with open(log_file, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        yield json.dumps({"step": 1}) + "\n"

        city_id = payload.get("city_id")
        city_name = payload.get("city_name")
        places = payload.get("places", [])
        budget = payload.get("budget", 0)
        pax = payload.get("pax", 1)
        notes = payload.get("notes", "")
        transport_type = payload.get("transport", "")

        date_start = payload.get("date_start")
        date_end = payload.get("date_end")
        time_start = payload.get("departure_time", "08:00")
        time_end = payload.get("return_time", "22:00")

        # Tính toán ngày
        start_dt = datetime.datetime.strptime(date_start, "%Y-%m-%d")
        end_dt = datetime.datetime.strptime(date_end, "%Y-%m-%d")
        days = max(1, (end_dt - start_dt).days + 1)

        dataset_file = os.path.join(DATASET_DIR, f"{city_id}.json")
        dataset_data = []
        dataset_places = {}
        city_dataset = {}
        if os.path.exists(dataset_file):
            with open(dataset_file, "r", encoding="utf-8") as f:
                city_dataset_raw = json.load(f)
                if city_dataset_raw and isinstance(city_dataset_raw, dict):
                    first_key = list(city_dataset_raw.keys())[0]
                    city_dataset = city_dataset_raw[first_key]
                    dataset_data = city_dataset.get("diem_tham_quan", [])
        for dp in dataset_data:
            dataset_places[dp.get("id")] = {
                "ten": dp.get("ten"),
                "tags": dp.get("tags", []),
                "gia_ve": dp.get("gia_ve", 0),
                "toa_do": dp.get("toa_do", {}),
                "gio_hoat_dong": dp.get("gio_hoat_dong", {}),
                "rating": dp.get("rating", 0.0),
            }
        min_places = 3 * days

        selected_places_formatted = []
        selected_ids = set()

        for p in places:
            p_id = p.get("id")
            selected_ids.add(p_id)
            full_p = dataset_places[p_id]
            selected_places_formatted.append({
                "id": p_id,
                "ten": full_p.get("ten", "Unknown"),
                "tags": full_p.get("tags", []),
                "gia_ve": full_p.get("gia_ve", 0)
            })

        kiem_tra = len(selected_places_formatted) >= min_places

        dataset_ai1 = []
        if (not kiem_tra):
            for dp in dataset_data:
                dataset_ai1.append({
                    "id": dp.get("id"),
                    "ten": dp.get("ten"),
                    "tags": dp.get("tags", []),
                    "gia_ve": dp.get("gia_ve", 0),
                })

        ai1_input = {
            "so_luong_hanh_khach": pax,
            "dia_diem_xuat_phat": payload.get("dep_city_id", ""),
            "dia_diem_den": city_name,
            "diem_tham_quan": selected_places_formatted,
            "dataset": dataset_ai1,
            "kiem_tra_diem_tham_quan": "true" if kiem_tra else "false",
            "thoi_gian": {
                "ngay_khoi_hanh": start_dt.strftime("%d/%m/%Y"),
                "gio_khoi_hanh": time_start,
                "ngay_ket_thuc": end_dt.strftime("%d/%m/%Y"),
                "gio_ket_thuc": time_end,
                "tong_thoi_gian": {
                    "so_ngay": days,
                    "so_dem": days - 1
                }
            },
            "ngan_sach_tong_k": budget,
            "ghi_chu_nguoi_dung": notes,
            "cac_mau": {
                "mau_1": "Du lịch tiết kiệm (Sinh viên/Đi phượt): Ngân sách thấp, 1-4 người, xe máy/bus. Đi tối đa điểm (~10 điểm), di chuyển dày đặc, không ngại xa.",
                "mau_2": "Nghỉ dưỡng với gia đình: Ngân sách khá-cao, 3-8 người, cần hồ bơi/phù hợp gia đình. Lịch trình thưa (2-3 điểm/ngày), ưu tiên điểm nhẹ nhàng, gần nhau.",
                "mau_3": "Cặp đôi tận hưởng (Lãng mạn): Ngân sách khá-cao, 2 người, cần view đẹp/yên tĩnh/riêng tư. Cân bằng đi chơi/nghỉ ngơi, ngắm bình minh/hoàng hôn.",
                "mau_4": "Team Building: Ngân sách TB, 8-50 người, cần bãi xe rộng/BBQ. Di chuyển theo đoàn, không gian rộng, ở lại điểm lâu.",
                "mau_5": "Du lịch chữa lành 1 mình: Ngân sách linh hoạt, 1 người, gần thiên nhiên/yên tĩnh. Ít điểm, chủ yếu văn hóa/thiên nhiên, ở lại 1 điểm lâu.",
                "mau_6": "Công tác kết hợp nghỉ (Bleisure): Ngân sách cao, 1-3 người, 1-2 ngày. Tối ưu thời gian, đi chơi tối hoặc nửa ngày cuối.",
                "mau_7": "Đi food tour: Ngân sách khá, cần gần khu ăn uống/chợ đêm/ẩm thực địa phương. Di chuyển ngắn, linh hoạt, mật độ cao vào giờ ăn.",
                "mau_8": "Check-in Sống ảo: Ngân sách khá-cao, cần view đẹp/chụp ảnh/cafe. Ưu tiên điểm có gu, ở lại lâu chụp ảnh, đi vào giờ vàng.",
                "mau_9": "Trải nghiệm mạo hiểm: 1-4 người, xe máy, trekking/leo núi/thiên nhiên. Điểm ở xa trung tâm, tốn thể lực, ít điểm, kết thúc sớm.",
                "mau_10": "Du lịch theo sự kiện: 1-2 ngày, có điểm cố định. Lịch trình xoay quanh sự kiện, điểm phụ nằm trên trục đường chính.",
                "mau_11": "Khám phá văn hóa lịch sử: Mọi ngân sách, bảo tàng/di tích. Nhịp độ chậm, tìm hiểu lâu, đi ban ngày theo giờ mở cửa."
            },
            "cac_phep_bien_doi": {
                "ngan_sach_phong": "Rẻ/Tiết kiệm < 500.000 VNĐ; Trung bình/Khá: 500.000 - 1.500.000 VNĐ; Cao cấp/Sang trọng > 1.500.000 VNĐ.",
                "khoang_cach": "Gần/Đi bộ được < 1.5km (hoặc < 15 phút đi bộ); Không xa lắm: 1.5km - 5km; Xa/Ngoại ô > 5km.",
                "khung_gio": "Bình minh: 05:30 - 07:30; Hoàng hôn/Giờ vàng: 16:30 - 18:00; Chơi đêm: 20:00 - 23:00.",
                "thoi_luong_tham_quan": "Ghé qua/Chụp ảnh nhanh: 30-45 phút; Tham quan/Cà phê: 1-1.5 giờ; Tìm hiểu/Chữa lành: 2-4 giờ."
            }
        }

        # AI 1
        ai1_output = call_ai_1(ai1_input)

        # Lưu log AI 1
        ai_logic_logs_dir = os.path.join(
            BASE_DIR, "app", "services", "ai_logic", "logs")
        os.makedirs(ai_logic_logs_dir, exist_ok=True)
        with open(os.path.join(ai_logic_logs_dir, f"output_ai1_{timestamp}.json"), "w", encoding="utf-8") as f:
            json.dump(ai1_output, f, ensure_ascii=False, indent=2)

        yield json.dumps({"step": 2}) + "\n"

        # Routing (Bước 4.2)
        routing_logs_dir = os.path.join(
            BASE_DIR, "app", "services", "routing_service", "logs")
        os.makedirs(routing_logs_dir, exist_ok=True)

        ai_places = ai1_output.get("diem_tham_quan", [])
        so_luong_diem_tham_quan = ai1_output.get("so_luong_diem_tham_quan", 3)
        w = ai1_output.get("trong_so_danh_gia", [0.25, 0.25, 0.25, 0.25])
        ngan_sach_luu_tru = ai1_output.get("ngan_sach_luu_tru", 0)
        tag_nguoi_dung = ai1_output.get("tag_nguoi_dung", [])

        routing_input_places = []
        for ap in ai_places:
            ap_id = ap.get("id")
            full_p = dataset_places.get(ap_id)
            if full_p:
                lat = full_p.get("toa_do", {}).get("lat", 0)
                lon = full_p.get("toa_do", {}).get("lng", 0)
                open_t = full_p.get("gio_hoat_dong", {}).get("mo_cua", 0.0)
                close_t = full_p.get("gio_hoat_dong", {}).get("dong_cua", 24.0)
                routing_input_places.append({
                    "id": ap_id,
                    "name": full_p.get("ten", ""),
                    "lat": lat,
                    "lon": lon,
                    "open": open_t,
                    "close": close_t
                })
            else:
                routing_input_places.append({
                    "id": ap_id,
                    "name": ap.get("ten", "Unknown"),
                    "lat": 0,
                    "lon": 0,
                    "open": 0,
                    "close": 24
                })

        with open(os.path.join(routing_logs_dir, f"input_routing_{timestamp}.json"), "w", encoding="utf-8") as f:
            json.dump(routing_input_places, f, ensure_ascii=False, indent=2)

        routing_output = await generate_itinerary(routing_input_places, days, so_luong_diem_tham_quan)

        # Lưu log Routing
        with open(os.path.join(routing_logs_dir, f"output_routing_{timestamp}.json"), "w", encoding="utf-8") as f:
            json.dump(routing_output, f, ensure_ascii=False, indent=2)

        yield json.dumps({"step": 3}) + "\n"

        # Lọc kết quả cho AI 2 (Bước 4.3)
        filtered_daily_routes = []
        otm_coordinate = {}
        if routing_output.get("status") == "success":
            otm_coordinate = routing_output.get("optimal_coordinate", {})
            for dr in routing_output.get("daily_routes", []):
                new_dr = dr.copy()
                new_dr.pop("places", None)
                new_dr.pop("route_geometry", None)
                filtered_daily_routes.append(new_dr)
        

        hotel_output = await quet_khach_san_quanh_trung_vi(otm_coordinate.get(
            "lat", 0), otm_coordinate.get("lon", 0), ngan_sach_luu_tru, "khách sạn", w)
        danh_sach_goi_y = []
        if hotel_output.get("status") == "success":
            danh_sach_goi_y = hotel_output.get("danh_sach_goi_y")

        db_data_dict = {
            "w2": w[1] if len(w) > 1 else 0.25,
            "ngan_sach_luu_tru": ngan_sach_luu_tru,
            "tag_nguoi_dung": tag_nguoi_dung,
            "lo_trinh_toi_uu": filtered_daily_routes,
            "thoi_gian": ai1_input["thoi_gian"],
            "phuong_tien_di_chuyen": transport_type,
            "danh_sach_goi_y": danh_sach_goi_y,
        }

        yield json.dumps({"step": 4}) + "\n"

        # AI 2
        ai2_output = call_ai_2(ai1_output, db_data_dict)

        # Lưu log AI 2
        with open(os.path.join(ai_logic_logs_dir, f"output_ai2_{timestamp}.json"), "w", encoding="utf-8") as f:
            json.dump(ai2_output, f, ensure_ascii=False, indent=2)

        yield json.dumps({"step": 5}) + "\n"

        # Gửi dữ liệu xuống client
        data_output = {
            "output": ai2_output.get("output", ai2_output),
            "routing": routing_output
        }
        final_output = {
            "status": "success",
            "output": data_output
        }

        yield json.dumps({"step": "done", "result": final_output}) + "\n"

    except Exception as e:
        yield json.dumps({"step": "done", "result": {"status": "error", "errors": [str(e)]}}) + "\n"
