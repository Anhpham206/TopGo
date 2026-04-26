from tour_engine import (
    tinh_tam_diem,
    quet_khach_san_serpapi,
    loc_va_xu_ly_tien_te,
    cham_diem_min_max
)

# Chuẩn bị 5 kịch bản (Test Cases) trải dài 3 miền Bắc - Trung - Nam
TEST_CASES = [
    {
        "id": "TC_01",
        "thanh_pho": "Hà Nội",
        "ngan_sach": 1200000, # 1.2M/đêm
        "diem_den": ["Lăng Chủ tịch Hồ Chí Minh", "Hồ Hoàn Kiếm", "Văn Miếu – Quốc Tử Giám", "Chợ Đồng Xuân", "Cầu Long Biên"]
    },
    {
        "id": "TC_02",
        "thanh_pho": "Đà Nẵng",
        "ngan_sach": 800000, # 800K/đêm
        "diem_den": ["Cầu Rồng", "Bãi biển Mỹ Khê", "Chùa Linh Ứng Sơn Trà", "Chợ Hàn", "Bảo tàng Điêu khắc Chăm"]
    },
    {
        "id": "TC_03",
        "thanh_pho": "TP. Hồ Chí Minh",
        "ngan_sach": 1500000, # 1.5M/đêm
        "diem_den": ["Chợ Bến Thành", "Dinh Độc Lập", "Nhà thờ Đức Bà", "Bưu điện Trung tâm", "Phố đi bộ Nguyễn Huệ"]
    },
    {
        "id": "TC_04",
        "thanh_pho": "Đà Lạt",
        "ngan_sach": 600000, # 600K/đêm
        "diem_den": ["Hồ Xuân Hương", "Chợ Đà Lạt", "Quảng trường Lâm Viên", "Vườn hoa thành phố", "Nhà thờ Con Gà"]
    },
    {
        "id": "TC_05",
        "thanh_pho": "Huế",
        "ngan_sach": 9000000, # 900K/đêm
        "diem_den": ["Đại Nội Huế", "Chùa Thiên Mụ", "Chợ Đông Ba", "Lăng Tự Đức", "Cầu Trường Tiền"]
    }
]

def run_tests():
    print("🚀 BẮT ĐẦU CHẠY KIỂM THỬ THUẬT TOÁN CHẤM ĐIỂM KHÁCH SẠN (MIN-MAX SCALING)")
    print("Tiêu chí đánh giá: Rating (Max), Khoảng cách Tâm (Min), Giá (Min). Khớp Tag giao cho AI bỏ qua.\n")
    
    for tc in TEST_CASES:
        print(f"[{tc['id']}] Đang xử lý: {tc['thanh_pho']} | Ngân sách: {tc['ngan_sach']:,} VNĐ")
        
        # 1. Tính tâm trung vị
        tam_lat, tam_lng, diem_co_toa_do = tinh_tam_diem(tc["diem_den"])
        if not tam_lat:
            print("  ❌ Lỗi: Không tính được tọa độ tâm.\n")
            continue
            
        # 2. Cào khách sạn
        ks_tho = quet_khach_san_serpapi(tam_lat, tam_lng)
        if not ks_tho:
            print("  ❌ Lỗi: Không cào được khách sạn.\n")
            continue
            
        # 3. Tiền xử lý (CỐ TÌNH TRUYỀN TAG RỖNG ĐỂ ÉP ĐỌ SỨC BẰNG RAW STATS)
        ds_loc = loc_va_xu_ly_tien_te(ks_tho, tc["ngan_sach"], tam_lat, tam_lng, tags_so_thich=[])
        if not ds_loc:
            print("  ❌ Không có khách sạn nào lọt qua bộ lọc ngân sách.\n")
            continue
            
        # 4. Chấm điểm
        ks_xep_hang = cham_diem_min_max(ds_loc)
        
        print(f"  ✅ Tọa độ Tâm (Trung vị): {tam_lat:.5f}, {tam_lng:.5f}")
        print(f"  🏆 TOP KHÁCH SẠN PHÙ HỢP NHẤT TẠI {tc['thanh_pho'].upper()}:")
        
        # Chỉ in ra Top 3 để dễ nhìn
        top_k = min(10, len(ks_xep_hang))
        for i in range(top_k):
            ks = ks_xep_hang[i]
            gia_in = f"{ks['gia']:,} ₫" if ks['gia'] > 0 else "Ẩn giá"
            print(f"    {i+1}. {ks['ten'][:40]:<42} | Điểm Tổng: {ks['diem']:.2f}")
            print(f"       ⭐ Rating: {ks['rating']} | 🎯 Cách tâm: {ks['kc_tam']:.2f} km | 💰 Giá: {gia_in}")
        print("-" * 80)

if __name__ == "__main__":
    run_tests()