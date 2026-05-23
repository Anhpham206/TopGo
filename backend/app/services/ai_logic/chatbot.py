import os
import json
from google import genai
from google.genai import types
from dotenv import load_dotenv

# Load biến môi trường
load_dotenv()
API_KEY_AI1 = os.getenv("GEMINI_API_KEY_FOR_CHATBOT")
API_KEY_AI2 = os.getenv("GEMINI_API_KEY_FOR_CHATBOT_RCM")

if not API_KEY_AI1 or not API_KEY_AI2:
    raise ValueError("❌ Không tìm thấy GEMINI_API_KEY! Hãy kiểm tra lại file .env")

# Khởi tạo client
client_ai1 = genai.Client(api_key=API_KEY_AI1)
client_ai2 = genai.Client(api_key=API_KEY_AI2)

MODEL_ID = "gemini-3.1-flash-lite"

TOPGO_INFO = """
[THÔNG TIN VỀ TOPGO]
TopGo là một nền tảng du lịch thông minh (Smart Tourism) được thiết kế theo hướng ứng dụng thực tế.
Mục tiêu của TopGo là hỗ trợ người dùng lên kế hoạch du lịch, đánh giá điểm đến, và cung cấp các tiện ích thông minh cho chuyến đi.
Đội ngũ phát triển của TopGo bao gồm các thành viên tâm huyết: Kiên, Thư, Toàn, Tuấn, Uyên, Diệp, Anh. 

[QUY ĐỊNH HỆ THỐNG]
TopGo là một không gian thân thiện, chuyên nghiệp, tập trung hoàn toàn vào trải nghiệm du lịch. 
Do đó, hệ thống nghiêm cấm và sẽ từ chối thảo luận về các chủ đề sau:
- Chính trị, luật pháp quốc gia hoặc quốc tế.
- Tôn giáo, tín ngưỡng.
- Các nội dung nhạy cảm, đồi trụy.
- Thông tin cá nhân riêng tư của người khác.
- Hướng dẫn các hoạt động vi phạm pháp luật.
- Bất kỳ vấn đề nào nằm ngoài phạm vi du lịch và các dịch vụ do TopGo cung cấp.
Nếu được yêu cầu lên lịch trình thì hãy gửi lời nhắn tới người dùng hãy sử dụng tính năng tạo lịch trình của TopGo và KHÔNG ĐƯỢC PHÉP lên lịch trình dù được yêu cầu dưới bất cứ hình thức nào.
"""

SYSTEM_INSTRUCTION = f"""
Bạn là một hướng dẫn viên du lịch ảo VÔ CÙNG NHÍ NHẢNH, ĐÁNG YÊU và NĂNG ĐỘNG của nền tảng TopGo. 🌟✨

Tính cách của bạn:
- Luôn tràn đầy năng lượng, sử dụng hợp lý các biểu tượng cảm xúc (emoji) trong mọi câu trả lời để tạo sự vui vẻ. 
- Xưng hô cực kỳ thân mật: Gọi người dùng là "bạn", "cậu", hoặc "mình". Xưng là "TopGo" hoặc "tớ".
- Giọng văn trẻ trung, bắt trend, sử dụng các từ cảm thán hợp lý. 💖

DƯỚI ĐÂY LÀ TÀI LIỆU THÔNG TIN CỦA TOPGO:
--------------------------------------------------
{TOPGO_INFO}
--------------------------------------------------

Nhiệm vụ của bạn:
1. Đọc và nắm rõ "TÀI LIỆU THÔNG TIN CỦA TOPGO". Dùng thông tin này để giới thiệu với giọng văn dễ thương, lịch sự.
2. Hỗ trợ người dùng gợi ý địa điểm, giải đáp thắc mắc về chuyến đi một cách nhiệt tình nhất! 🌍🔥

Quy tắc quan trọng:
- Luôn giữ thái độ tích cực, vui vẻ.
- Dựa vào phần [QUY ĐỊNH HỆ THỐNG], nếu khách hỏi chủ đề cấm, hãy từ chối một cách lịch sự và khéo léo.
- Không tự bịa đặt thông tin sai lệch.
"""

class TopGoChatbot:
    def __init__(self):
        # Đường dẫn tới thư mục dataset
        self.base_dir = os.path.dirname(os.path.abspath(__file__))
        self.dataset_dir = os.path.abspath(os.path.join(self.base_dir, "../../../../dataset"))

        # 1. Cấu hình AI chatbot hỏi đáp
        self.config = types.GenerateContentConfig(
            system_instruction=SYSTEM_INSTRUCTION,
            temperature=0.7,
        )
        self.chat_session = client_ai1.chats.create(
            model=MODEL_ID,
            config=self.config
        )

        # 2. Cấu hình AI 1 (Trích xuất địa điểm - Không cần nhớ ngữ cảnh)
        self.extractor_config = types.GenerateContentConfig(
            temperature=0.1,
            system_instruction="Bạn là một công cụ trích xuất dữ liệu. Nhiệm vụ của bạn là tìm tên tỉnh/thành phố trong câu của người dùng và chuyển sang định dạng tiếng Việt không dấu, viết thường, thay khoảng trắng bằng dấu gạch dưới. Ví dụ: 'Đà Lạt' -> 'da_lat', 'Hà Nội' -> 'ha_noi'. CHỈ TRẢ VỀ DUY NHẤT chuỗi định dạng đó, không thêm dấu câu hay từ ngữ nào khác. Nếu không tìm thấy địa danh, trả về chữ 'none'."
        )

        # 3. Cấu hình AI 2 (Lọc Top 5 quán ăn - Không cần nhớ ngữ cảnh)
        self.recommender_config = types.GenerateContentConfig(
            temperature=0.7,
            system_instruction=SYSTEM_INSTRUCTION + "\n\nNhiệm vụ đặc biệt: Dựa vào yêu cầu cụ thể của người dùng và danh sách dữ liệu JSON được cung cấp, hãy lọc ra đúng 5 quán ăn phù hợp nhất. Trình bày danh sách thật đẹp mắt và giải thích ngắn gọn, hợp lý lý do tớ chọn các quán này cho cậu nhé! 🍜✨"
        )

        # 4. Cấu hình AI Phân loại ý định (Intent Classifier)
        self.classifier_config = types.GenerateContentConfig(
            temperature=0.0, 
            system_instruction="""Bạn là một bộ phân loại ý định (Intent Classifier) cho hệ thống du lịch.
            Nhiệm vụ: Đọc câu nói của người dùng và phân loại thành 1 trong 2 nhãn sau:
            - "FIND_FOOD": Nếu người dùng có ý định tìm kiếm quán ăn, nhà hàng, hỏi món ngon, ẩm thực, đặc sản, hoặc ngụ ý đang đói bụng và muốn đi ăn.
            - "GENERAL_CHAT": Nếu người dùng hỏi các vấn đề khác (địa điểm tham quan, lên lịch trình, hỏi đáp chung chung, chào hỏi...).
            QUY ĐỊNH NGHIÊM NGẶT: CHỈ TRẢ VỀ ĐÚNG TÊN NHÃN (FIND_FOOD hoặc GENERAL_CHAT), tuyệt đối không giải thích hay thêm bất kỳ từ ngữ nào khác."""
        )

    def extract_location(self, message: str) -> str:
        """Dùng AI 1 để phân tích và lấy tên thành phố định dạng thanh_pho"""
        try:
            response = client_ai1.models.generate_content(
                model=MODEL_ID,
                contents=message,
                config=self.extractor_config
            )
            return response.text.strip()
        except Exception as e:
            print(f"❌ Lỗi trích xuất địa điểm: {e}")
            return "none"
        
    def get_top_5_restaurants(self, user_message: str, location_slug: str) -> str:
        """Đọc file JSON và gọi AI 2 để lọc top 5"""
        file_path = os.path.join(self.dataset_dir, f"{location_slug}.json")
        
        # Kiểm tra xem file có tồn tại không
        if not os.path.exists(file_path):
            return f"Ui cha, TopGo chưa cập nhật cẩm nang ẩm thực cho khu vực này rồi! 🥺 Cậu thử hỏi tớ địa điểm khác xem sao nhé! ✨"
        
        # Đọc dữ liệu từ file
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                restaurant_data = json.load(f)
        except Exception as e:
            return f"❌ Ây da, có lỗi khi mở sổ tay ẩm thực rồi: {e}"

        # Đóng gói dữ liệu gửi cho AI 2
        prompt_for_ai2 = f"""
        Yêu cầu của người dùng: "{user_message}"
        
        Danh sách dữ liệu quán ăn:
        {json.dumps(restaurant_data, ensure_ascii=False)}
        """
        
        try:
            response = client_ai2.models.generate_content(
                model=MODEL_ID,
                contents=prompt_for_ai2,
                config=self.recommender_config
            )
            return response.text
        except Exception as e:
            return f"❌ Lỗi khi nhờ AI 2 chọn lọc: {e}"
        
    def classify_intent(self, message: str) -> str:
        """Dùng AI để xác định xem người dùng có đang muốn tìm đồ ăn không"""
        try:
            response = client_ai1.models.generate_content(
                model=MODEL_ID,
                contents=message,
                config=self.classifier_config
            )
            intent = response.text.strip()
            # Đảm bảo kết quả trả về luôn chuẩn xác kể cả khi AI thỉnh thoảng bị 'lệch'
            if "FIND_FOOD" in intent:
                return "FIND_FOOD"
            return "GENERAL_CHAT"
        except Exception as e:
            print(f"❌ Lỗi phân loại ý định: {e}")
            return "GENERAL_CHAT" # Fallback an toàn: Có lỗi thì cứ cho chat bình thường
        
    def send_message(self, message: str) -> str:
        """Hàm chính xử lý tin nhắn người dùng gửi tới"""
        # 1. Phân loại ý định bằng AI thay vì dùng từ khóa cứng
        intent = self.classify_intent(message)
        print(f"🔍 [System Log] Intent detected: {intent}")

        if intent == "FIND_FOOD":
            # AI 1 phân tích tên thành phố
            location_slug = self.extract_location(message)
            
            if location_slug != "none":
                # Chuyển qua luồng đọc file và gửi AI 2 lọc quán ăn
                return self.get_top_5_restaurants(message, location_slug)

        # 2. Nếu intent là GENERAL_CHAT hoặc intent FIND_FOOD nhưng không nhắc tới địa danh cụ thể
        try:
            response = self.chat_session.send_message(message)
            return response.text
        except Exception as e:
            return f"❌ Lỗi khi giao tiếp với AI: {e}"