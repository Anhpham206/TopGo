import json
import os
from google import genai
from google.genai import types
from dotenv import load_dotenv

# 1. Load môi trường và Client
load_dotenv()
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
API_KEY = os.getenv("GEMINI_API_KEY")
API_KEY2 = os.getenv("GEMINI_API_KEY_2")

if not API_KEY:
    raise ValueError(
        "❌ Không tìm thấy GEMINI_API_KEY! Hãy kiểm tra lại file .env")

client = genai.Client(api_key=API_KEY)
client2 = genai.Client(api_key=API_KEY2)

# 2. Cấu hình Model & Generation Config
MODEL_ID = "gemini-2.5-flash-lite"
config_ai1 = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.0,
)
config_ai2 = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.5,
)

PROMPT_AI1 = """Vai trò của bạn: Bạn là một trợ lý AI chuyên gia về lên kế hoạch du lịch và hệ thống phân tích dữ liệu.
Đầu vào: Bạn sẽ nhận được một đối tượng JSON chứa các thông tin yêu cầu chuyến đi của người dùng, bao gồm cả các mẫu hành vi (cac_mau) và các quy tắc chuẩn hóa định lượng (cac_phep_bien_doi) như trên.
Nhiệm vụ:
Hãy đọc kỹ dữ liệu JSON đầu vào và thực hiện tuần tự 2 bước sau:

Bước 1: Xử lý danh sách Điểm tham quan
- Đối chiếu các thông tin của người dùng (ngân sách, số người, ghi chú...) với trường cac_mau để xác định người dùng thuộc mẫu du lịch nào nếu có.
- Sử dụng mẫu du lịch để xác định số lượng địa điểm tham quan (so_luong_diem_tham_quan)  trong 1 ngày (tối thiểu 3 địa điểm / ngày)
- Sử dụng cac_phep_bien_doi để quy đổi các yêu cầu chung chung trong ghi_chu_nguoi_dung thành tiêu chuẩn định lượng (ví dụ: khoảng cách, mức giá, khung giờ) nếu có.
- Đọc giá trị của trường kiem_tra_diem_tham_quan.
    - Nếu giá trị là "true": Giữ nguyên mảng diem_tham_quan như ban đầu và bỏ qua việc tìm kiếm, chuyển thẳng sang Bước 2.
    - Nếu giá trị là "false":
        - Kiểm tra trường ghi_chu_nguoi_dung và mẫu du lịch của người dùng. Nếu trường này có dữ liệu liên quan đến sở thích người dùng, hãy tìm kiếm trong dataset các điểm tham quan phù hợp với phong cách đó và thêm chúng vào mảng diem_tham_quan.
        - Nếu trường ghi_chu_nguoi_dung trống hoặc không có dữ liệu sở thích, hãy tự động chọn các địa điểm du lịch nổi tiếng và đặc trưng nhất tại dia_diem_den từ dataset để thêm vào mảng diem_tham_quan.
        - Số lượng địa điểm trong mảng diem_tham_quan sau khi thêm phải đáp ứng đủ {so_luong_diem_tham_quan*so_ngay} địa điểm.
        - LUẬT: 
            - lựa chọn các địa điểm thêm vào có tổng chi phí (gia_ve) mà ngan_sach_tong_k có thể đáp ứng được cho so_luong_hanh_khach
            - Các địa điểm lấy thêm từ dataset phải được GIỮ NGUYÊN giá trị các trường dữ của địa điểm đó như trong dataset, KHÔNG thay đổi giá trị của các trường dữ liệu id và ten.  
        - Sau khi thêm xong, chuyển sang Bước 2.

Bước 2: Phân tích thông tin và tính toán trọng số (Weights)
Từ các dữ liệu như ngân sách (ngan_sach_tong_k), thời gian (thoi_gian), sở thích (trong ghi_chu_nguoi_dung), mẫu người dùng đã nhận diện được, hãy thực hiện các công việc sau: 
1. suy luận và tính toán 4 trọng số w_1, w_2, w_3, w_4 để phục vụ công thức của Backend:
    - Điểm ưu tiên = w1 * rating + w2 * lượng tag khớp - w3 * khoảng cách - w4 * giá phòng.
    - Quy tắc tính toán trọng số:
        - Tổng các trọng số phải bằng 1: w1 + w2 + w3 + w4 = 1.
        - Gợi ý suy luận:
            - Nếu ngan_sach_tong_k thấp/hạn hẹp: Tăng trọng số w4 (ưu tiên giá rẻ).
            - Nếu người dùng có sở thích, phong cách chi tiết và đặc thù: Tăng trọng số w2 (ưu tiên độ khớp tag).
            - Nếu thoi_gian chuyến đi ngắn (ít ngày): Tăng trọng số w3 (ưu tiên khoảng cách gần để tránh mất thời gian di chuyển).
            - Nếu người dùng không có ràng buộc khắt khe nào: Cân bằng các trọng số.
2. Trích xuất dữ liệu từ ghi_chu_nguoi_dung:
- tag_nguoi_dung: các điểm lưu ý về nơi lưu trú người dùng yêu cầu (ví dụ: có hồ bơi -> “hồ bơi”)
- ngan_sach_luu_tru: giá trị ngân sách dùng cho việc lưu trú nếu có ghi trong ghi chú người dùng, nếu không có thì dùng 40% trong tong_ngan_sach_k 
Đầu ra yêu cầu:
Trả về ĐÚNG cấu trúc JSON đầu vào (đã cập nhật mảng diem_tham_quan nếu có (các đối tượng trong mảng diem_tham_quan chỉ có 2 trường dữ liệu: id và ten), bỏ trường kiem_tra_diem_tham_quan, cac_mau, cac_phep_bien_doi, dataset), và bổ sung các trường mới ở cuối:
- trong_so_danh_gia: để chứa các giá trị w đã tính toán dưới dạng mảng [w1,w2,w3,w4]. 
- ngan_sach_luu_tru: ngân sách dùng cho việc lưu trú
- tag_nguoi_dung: các lưu ý về nơi lưu trú của người dùng
- so_luong_diem_tham_quan: số lượng điểm tham quan trong 1 ngày đã nhận diện được.

Chỉ trả về duy nhất đối tượng JSON, không kèm theo lời giải thích hay văn bản bổ sung."""

PROMPT_AI2 = """Vai trò của bạn: Bạn là một hệ thống phân tích dữ liệu và chuyên gia lên kế hoạch du lịch tự động.
Dữ liệu đầu vào: chuỗi JSON chứa các thông tin yêu cầu của người dùng, đặc biệt chú ý đến:
    1. danh_sach_goi_y: Danh sách các chỗ ở (gồm các thông tin về nơi lưu trú).
    2. tag_nguoi_dung: những yêu cầu cụ thể về chỗ ở của người dùng
    3. Giá trị trọng số w2 (đã được tính từ bước trước).
    4. lo_trinh_toi_uu và thoi_gian: Dữ liệu để xây dựng lịch trình.
Nhiệm vụ của bạn: Thực hiện tuần tự 2 bước sau:

Bước 1: Tính toán số tag khớp và Cập nhật AIScore cho từng chỗ ở
    1. Đếm số tag khớp (x): So sánh mảng tag của từng chỗ ở thứ i trong danh_sach_goi_y với tag_nguoi_dung. Đếm xem có bao nhiêu tag khớp nhau (về mặt ngữ nghĩa hoặc từ khóa). Gọi số lượng này là x_i.
    2. Tìm Min / Max: Tìm ra số lượng tag khớp lớn nhất (max) và nhỏ nhất (min) trong toàn bộ danh sách chỗ ở.
    3. Chuẩn hóa (Min-Max Scaling): Đối với mỗi chỗ ở, tính Điểm Tag (TagScore) theo công thức:
        - Nếu max > min: TagScore = (x_i - min) / (max - min)
        - Nếu max = min (tất cả chỗ ở có số tag khớp bằng nhau): TagScore = 1
    4. Cập nhật AIScore: Tính điểm số mới cho từng chỗ ở:
        AIScore_Moi = diem_tong + w_2 * TagScore
    5. Chọn lọc: Sắp xếp danh sách chỗ ở theo AIScore_Moi từ cao xuống thấp và chỉ giữ lại Top 3 chỗ ở có điểm cao nhất để đưa vào kết quả đầu ra. Đổi AIScore_Moi thành định dạng phần trăm (VD: 95%).

Bước 2: Xây dựng Lịch trình Tối ưu
    1. Dựa vào lo_trinh_toi_uu, và thoi_gian, hãy xây dựng một lịch trình chi tiết theo từng ngày.
        - Sắp xếp thời gian hợp lý (có thời gian di chuyển, thời gian tham quan).
        - Viết lời giới thiệu ngắn gọn, hấp dẫn cho từng địa điểm.
        - Gợi ý  phương tiện di chuyển phù hợp với khoảng cách giữa các điểm.
    2. Dựa vào dia_diem_xuat_phat, dia_diem_den, ngay_khoi_hanh, phuong_tien_di_chuyen, hãy gợi ý thời gian đặt vé/ bắt đầu khởi hành để có thể kịp lịch trình du lịch đã tạo.

    YÊU CẦU ĐẦU RA: CHỈ trả về ĐÚNG cấu trúc JSON được cung cấp, không bọc trong markdown code block, không thêm bất kỳ văn bản giải thích nào khác. Thay thế các giá trị giả định bằng dữ liệu nhận được từ JSON và đã xử lý ở Bước 1 và Bước 2.
    LƯU Ý: Các dữ liệu khách sạn không được thay đổi, chỉ thêm 1 trường điểm AIScore_Moi”
"""

TEMPLATE_AI2 = """
{
    "output": {
        "Thong_tin_chung": {
            "Ten_hanh_trinh": "[Tạo một tên hành trình hấp dẫn]",
            "So_nguoi": "[Lấy từ so_luong_hanh_khach]",
            "Tong_ngan_sach": "[Lấy từ ngan_sach_tong_k, format VNĐ]",
            "Goi_y_khoi_hanh": [lời gợi ý về thời điểm đặt vé/ khỏi hành để kịp lịch trình],
            "AIScore_Hanh_trinh": "[Điểm đánh giá chung độ phù hợp, VD: 98% Phù hợp]"
        },
        "Lich_trinh": [
            [
                {
                    "Thoi_gian": "hh:mm - hh:mm",
                    "Thoi_luong": "[Thời lượng tham quan]",
                    "Dia_diem": "[Tên địa điểm 1 ngày 1]",
                    "Gioi_thieu": "[Giới thiệu ngắn gọn 2-3 câu]",
                    "Di_chuyen": {
                        "Phuong_tien": "[Loại phương tiện]",
                        "Khoang_cach": "[Khoảng cách km/m]",
                        "Thoi_gian_di_chuyen": "[Thời gian di chuyển]",
                        "Du_kien_den_luc": "hh:mm"
                    }
                },...
            ],
            [
                {
                    "Thoi_gian": "hh:mm - hh:mm",
                    "Thoi_luong": "[Thời lượng tham quan]",
                    "Dia_diem": "[Tên địa điểm 1 ngày 2]",
                    "Gioi_thieu": "[Giới thiệu ngắn gọn 2-3 câu]",
                    "Di_chuyen": {
                        "Phuong_tien": "[Loại phương tiện]",
                        "Khoang_cach": "[Khoảng cách km/m]",
                        "Thoi_gian_di_chuyen": "[Thời gian di chuyển]",
                        "Du_kien_den_luc": "hh:mm"
                    }
                }...
            ],...
        ],
        "Khach_san_goi_y": [
            {
                "AIScore": "[AIScore_Moi]",
                "ten": "Tên khách sạn",
                "lat": "lat",
                "lng": "lng",
                "gia_tien": "giá tiền",
                "rating": "rating",
                "khoang_cach_tam": khoang_cach,
                "website": "link website",
                "url_img": "url_img",
                "address": address,
            },
            ...
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
    full_prompt = f"{user_data_str}\n{PROMPT_AI1}"

    # Gọi API
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=config_ai1
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
    response = client2.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=config_ai2
    )
    print("AI 2 đã soạn xong nội dung lịch trình\n")

    return json.loads(response.text)
