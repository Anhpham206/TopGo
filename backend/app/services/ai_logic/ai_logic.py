import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# 1. Load môi trường và Client
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise ValueError("❌ Không tìm thấy GEMINI_API_KEY! Hãy kiểm tra lại file .env")

client = genai.Client(api_key=API_KEY)

# 2. Cấu hình Model & Generation Config
MODEL_ID = "gemini-3.1-flash-lite-preview"
generation_config = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.2,
)

PROMPT_AI1 = """
    - Vai trò của bạn: Bạn là một trợ lý AI chuyên gia về lên kế hoạch du lịch và hệ thống phân tích dữ liệu.
    Đầu vào: Bạn sẽ nhận được một đối tượng JSON chứa các thông tin yêu cầu chuyến đi của người dùng, bao gồm cả các mẫu hành vi (cac_mau) và các quy tắc chuẩn hóa định lượng (cac_phep_bien_doi).
    - Nhiệm vụ:
    Hãy đọc kỹ dữ liệu JSON đầu vào và thực hiện tuần tự 2 bước sau:
        + Bước 1: Xử lý danh sách Điểm tham quan
        Đối chiếu các thông tin của người dùng (ngân sách, số người, sở thích...) với trường cac_mau để xác định người dùng thuộc mẫu du lịch nào.
        Sử dụng cac_phep_bien_doi để quy đổi các yêu cầu chung chung thành tiêu chuẩn định lượng (ví dụ: khoảng cách, mức giá, khung giờ).
        Đọc giá trị của trường kiem_tra_diem_tham_quan.
        Nếu giá trị là "cần bổ sung" (hoặc True):
        Kiểm tra trường so_thich_phong_cach. Nếu trường này có dữ liệu, hãy tìm kiếm trong dataset các điểm tham quan phù hợp với phong cách đó và thêm chúng vào mảng diem_tham_quan.
        Nếu trường so_thich_phong_cach trống hoặc null, hãy tự động chọn các địa điểm du lịch nổi tiếng và đặc trưng nhất tại dia_diem_den từ dataset để thêm vào mảng diem_tham_quan.
        Sau khi thêm xong, chuyển sang Bước 2.
        Nếu giá trị là "không cần bổ sung" (hoặc False): Giữ nguyên mảng diem_tham_quan như ban đầu và bỏ qua việc tìm kiếm, chuyển thẳng sang Bước 2.
        + Bước 2: Phân tích thông tin và tính toán trọng số (Weights)
        Từ các dữ liệu như ngân sách (ngan_sach_tong_k), thời gian (thoi_gian), và sở thích (so_thich_phong_cach), hãy suy luận và tính toán 4 trọng số w_1, w_2, w_3, w_4 để phục vụ công thức của Backend:
        Điểm ưu tiên = w1 * rating + w2 * lượng tag khớp - w3 * khoảng cách - w4 * giá phòng.
        Quy tắc tính toán trọng số:
        Tổng các trọng số phải bằng 1: w_1 + w_2 + w_3 + w_4 = 1.
        Gợi ý suy luận:
        Nếu ngan_sach_tong_k thấp/hạn hẹp: Tăng trọng số w_4 (ưu tiên giá rẻ).
        Nếu so_thich_phong_cach chi tiết và đặc thù: Tăng trọng số w_2 (ưu tiên độ khớp tag).
        Nếu thoi_gian chuyến đi ngắn (ít ngày): Tăng trọng số w_3 (ưu tiên khoảng cách gần để tránh mất thời gian di chuyển).
        Nếu người dùng không có ràng buộc khắt khe nào: Cân bằng các trọng số hoặc ưu tiên w_1 (rating cao).
    YÊU CẦU ĐẦU RA (STRICT OUTPUT): Trả về ĐÚNG cấu trúc JSON đầu vào, bổ sung thêm trường 'trong_so_danh_gia' ở cuối. Chỉ trả về JSON hợp lệ.
    DỮ LIỆU CẦN XỬ LÝ:
    """

PROMPT_AI2 = """
    - Vai trò của bạn: Bạn là một hệ thống phân tích dữ liệu và chuyên gia lên kế hoạch du lịch tự động.
    - Dữ liệu đầu vào: Bạn sẽ nhận được chuỗi JSON chứa các thông tin yêu cầu của người dùng, đặc biệt chú ý đến:
        cho_o_partialscore_tags: Danh sách các chỗ ở (gồm tên, rating, AIScore ban đầu, giá, url, và mảng các tag).
        so_thich_phong_cach: Chuỗi mô tả sở thích của người dùng.
        Giá trị trọng số w2 (đã được tính từ bước trước).
        lo_trinh_toi_uu và thoi_gian: Dữ liệu để xây dựng lịch trình.
    - Nhiệm vụ của bạn: Thực hiện tuần tự 2 bước sau:
        + Bước 1: Tính toán số tag khớp và Cập nhật AIScore cho từng chỗ ở
        Đếm số tag khớp ($x$): So sánh mảng tag của từng chỗ ở thứ $i$ trong cho_o_partialscore_tags với so_thich_phong_cach. Đếm xem có bao nhiêu tag khớp nhau (về mặt ngữ nghĩa hoặc từ khóa). Gọi số lượng này là x_i.
        Tìm Min / Max: Tìm ra số lượng tag khớp lớn nhất (max) và nhỏ nhất (min) trong toàn bộ danh sách chỗ ở.
        Chuẩn hóa (Min-Max Scaling): Đối với mỗi chỗ ở, tính Điểm Tag (TagScore) theo công thức:
        Nếu max > min: TagScore = frac{x_i - min}{max - min}
        Nếu max = min (tất cả chỗ ở có số tag khớp bằng nhau): TagScore = 1
        Cập nhật AIScore: Tính điểm số mới cho từng chỗ ở:
        AIScore_Moi = AIScore_Ban_Dau + w_2 * TagScore
        Chọn lọc: Sắp xếp danh sách chỗ ở theo AIScore_Moi từ cao xuống thấp và chỉ giữ lại TOP 3 chỗ ở có điểm cao nhất để đưa vào kết quả đầu ra. Đổi AIScore_Moi thành định dạng phần trăm (VD: 95%).
        + Bước 2: Xây dựng Lịch trình Tối ưu
        Dựa vào lo_trinh_toi_uu, diem_tham_quan, và thoi_gian, hãy xây dựng một lịch trình chi tiết theo từng ngày.
        Sắp xếp thời gian hợp lý (có thời gian di chuyển, thời gian tham quan).
        Viết lời giới thiệu ngắn gọn, hấp dẫn cho từng địa điểm.
        Ước tính phương tiện, khoảng cách và thời gian di chuyển giữa các điểm.
    - YÊU CẦU ĐẦU RA (STRICT OUTPUT):
    Bạn PHẢI trả về dữ liệu theo ĐÚNG MẪU JSON được cung cấp dưới đây. Thay thế các giá trị trong ngoặc [] bằng dữ liệu thực tế đã xử lý.
"""

TEMPLATE_AI2 = """
{
    "output": {
        "Thong_tin_chung": {
            "Ten_hanh_trinh": "[Tạo một tên hành trình hấp dẫn]",
            "So_nguoi": "[Lấy từ so_luong_hanh_khach]",
            "Tong_ngan_sach": "[Lấy từ ngan_sach_tong_k, format VNĐ]",
            "Thoi_tiet": "[Dự báo hoặc mô tả ngắn gọn]",
            "AIScore_Hanh_trinh": "[Điểm đánh giá chung độ phù hợp, VD: 98% Phù hợp]"
        },
        "Lich_trinh": [
            [
                {
                    "Thoi_gian": "hh:mm - hh:mm",
                    "Thoi_luong": "[Thời lượng tham quan]",
                    "Dia_diem": "[Tên địa điểm 1]",
                    "Gioi_thieu": "[Giới thiệu ngắn gọn 2-3 câu]",
                    "Di_chuyen": {
                        "Phuong_tien": "[Loại phương tiện]",
                        "Khoang_cach": "[Khoảng cách km/m]",
                        "Thoi_gian_di_chuyen": "[Thời gian di chuyển]",
                        "Du_kien_den_luc": "hh:mm"
                    }
                },
                {
                    "Thoi_gian": "hh:mm - hh:mm",
                    "Thoi_luong": "[Thời lượng tham quan]",
                    "Dia_diem": "[Tên địa điểm 2]",
                    "Gioi_thieu": "[Giới thiệu ngắn gọn]",
                    "Di_chuyen": {
                        "Phuong_tien": "[Loại phương tiện]",
                        "Khoang_cach": "[Khoảng cách km/m]",
                        "Thoi_gian_di_chuyen": "[Thời gian di chuyển]",
                        "Du_kien_den_luc": "hh:mm"
                    }
                }
            ],
            [
                {
                    "Thoi_gian": "hh:mm - hh:mm",
                    "Thoi_luong": "[Thời lượng tham quan]",
                    "Dia_diem": "[Tên địa điểm ngày 2]",
                    "Gioi_thieu": "[Giới thiệu ngắn gọn]",
                    "Di_chuyen": {
                        "Phuong_tien": "[Loại phương tiện]",
                        "Khoang_cach": "[Khoảng cách km/m]",
                        "Thoi_gian_di_chuyen": "[Thời gian di chuyển]",
                        "Du_kien_den_luc": "hh:mm"
                    }
                }
            ]
        ],
        "Khach_san_goi_y": [
            {
                "Ten": "[Tên Top 1]",
                "rate": "[Rating Top 1]",
                "AIScore": "[AIScore_Moi Top 1 %]",
                "Gia_tien": "[Giá tiền Top 1]",
                "url_img": "[Link]"
            },
            {
                "Ten": "[Tên Top 2]",
                "rate": "[Rating Top 2]",
                "AIScore": "[AIScore_Moi Top 2 %]",
                "Gia_tien": "[Giá tiền Top 2]",
                "url_img": "[Link]"
            },
            {
                "Ten": "[Tên Top 3]",
                "rate": "[Rating Top 3]",
                "AIScore": "[AIScore_Moi Top 3 %]",
                "Gia_tien": "[Giá tiền Top 3]",
                "url_img":"[Link]"
            }
        ]
    }
}
"""

def call_ai_1(user_input_dict):
    """
    Trả về Dictionary kết quả.
    """
    print("⏳ AI 1 đang phân tích logic...")
    user_data_str = json.dumps(user_input_dict, ensure_ascii=False)
    full_prompt = f"{PROMPT_AI1}\n{user_data_str}"

    # Gọi API
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=generation_config
    )

    return json.loads(response.text)

def call_ai_2(ai1_result_dict, db_data_dict):
    """Nhận kết quả từ AI1"""
    print("⏳ AI 2 đang tổng hợp lịch trình và tính điểm theo mẫu...")
    
    combined_data = {**ai1_result_dict, **db_data_dict}

    full_prompt = (
        f"{PROMPT_AI2}\n"
        f"DỮ LIỆU ĐẦU VÀO: {json.dumps(combined_data, ensure_ascii=False)}\n"
        f"MẪU JSON YÊU CẦU: {TEMPLATE_AI2}"
    )
    
    # Gọi API
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=generation_config
    )

    return json.loads(response.text)

def generate_itinerary_flow(fe_input):
    try:
        ai1_output = call_ai_1(fe_input)
        # Chỗ này chưa code lấy dl be trả ra -> lấy tạmtừ file mock 
        db_mock_file = os.path.join(BASE_DIR, "db_mock.json")
        with open(db_mock_file, "r", encoding="utf-8") as f:
            db_data = json.load(f)
            
        final_output = call_ai_2(ai1_output, db_data)
        
        return final_output
        
    except Exception as e:
        print(f"❌ Lỗi trong luồng xử lý: {e}")
        return {"error": str(e)}