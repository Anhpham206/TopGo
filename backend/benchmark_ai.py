import os
import time
import asyncio
import logging
from dotenv import load_dotenv

load_dotenv()
import google.generativeai as genai

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("benchmark")

api_key = os.environ.get("GEMINI_API_KEY_FOR_MODERATION")
genai.configure(api_key=api_key)

async def test_speed(text: str):
    prompt = f"""
Bạn là một hệ thống AI kiểm duyệt nội dung (Content Moderator) nghiêm ngặt cho một mạng xã hội, áp dụng tiêu chuẩn cộng đồng tương tự Facebook và TikTok.
Hãy phân tích đoạn văn sau và xác định xem nó có vi phạm bất kỳ tiêu chuẩn nào dưới đây không:
1. Tự tử và tự gây thương tích.
2. Bạo lực, máu me, kinh dị, và xúi giục bạo lực.
3. Ngôn từ đả kích, thù địch.
4. Đồi trụy, tình dục.
5. Lừa đảo, spam, mua bán hàng cấm.

Đoạn văn cần kiểm duyệt:
"{text}"

Hãy trả lời DUY NHẤT bằng định dạng JSON theo cấu trúc sau:
{{"is_safe": false, "reason": "Lý do"}}
hoặc:
{{"is_safe": true, "reason": "OK"}}
"""
    model = genai.GenerativeModel('gemini-flash-latest')
    start_time = time.time()
    
    response = await model.generate_content_async(prompt)
    
    end_time = time.time()
    duration = end_time - start_time
    
    print(f"Time taken: {duration:.2f} seconds")
    try:
        print(f"Output length: {len(response.text)} chars")
    except Exception as e:
        print(f"Error reading response: {e}")

if __name__ == "__main__":
    asyncio.run(test_speed("Hôm nay đi biển rất vui!"))
