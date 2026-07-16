import os
import google.generativeai as genai
import logging

logger = logging.getLogger("app.ai_moderation")

# Setup Gemini API key
api_key = os.environ.get("GEMINI_API_KEY_FOR_MODERATION")
if api_key:
    genai.configure(api_key=api_key)
else:
    logger.warning("GEMINI_API_KEY_FOR_MODERATION not found in environment. AI Moderation will fallback to safe.")

import json

async def check_content_safety(text: str) -> dict:
    """
    Sử dụng Gemini để kiểm duyệt nội dung theo tiêu chuẩn khắt khe (Facebook/TikTok).
    Trả về { "is_safe": bool, "reason": str }
    """
    if not text or not text.strip():
        return {"is_safe": True, "reason": "Empty content"}

    if not api_key:
        return {"is_safe": True, "reason": "No API key configured for moderation."}
    
    try:
        model = genai.GenerativeModel('gemini-flash-latest')
        prompt = f"""
Bạn là một hệ thống AI kiểm duyệt nội dung (Content Moderator) nghiêm ngặt cho một mạng xã hội, áp dụng tiêu chuẩn cộng đồng tương tự Facebook và TikTok.
Hãy phân tích đoạn văn sau và xác định xem nó có vi phạm bất kỳ tiêu chuẩn nào dưới đây không:
1. Tự tử và tự gây thương tích (tự tử, muốn chết, rạch tay, tự hủy hoại bản thân...).
2. Bạo lực, máu me, kinh dị, và xúi giục bạo lực (giết người, chém giết, đẫm máu...).
3. Ngôn từ đả kích, thù địch, phân biệt đối xử, quấy rối, chửi thề hoặc bắt nạt.
4. Đồi trụy, tình dục, hoặc quấy rối tình dục.
5. Lừa đảo, spam, mua bán hàng cấm, hoặc nội dung chống phá, vi phạm pháp luật.

Đoạn văn cần kiểm duyệt:
"{text}"

Hãy trả lời DUY NHẤT bằng định dạng JSON (chỉ JSON, không dùng markdown, không có text dư thừa) theo cấu trúc sau:
{{"is_safe": false, "reason": "Nội dung vi phạm chính sách về [Tên chính sách]"}}
hoặc nếu an toàn:
{{"is_safe": true, "reason": "OK"}}
"""
        response = await model.generate_content_async(prompt)
        
        # Kiểm tra xem AI có từ chối trả lời vì lý do an toàn không
        if not response.candidates:
            # Bị chặn hoàn toàn từ vòng gửi xe (Prompt level)
            return {"is_safe": False, "reason": "Nội dung vi phạm tiêu chuẩn cộng đồng (Bạo lực/Kích động)."}
            
        candidate = response.candidates[0]
        # finish_reason == 3 là SAFETY (Google chặn vì vi phạm)
        if candidate.finish_reason == 3:
            return {"is_safe": False, "reason": "Nội dung vi phạm tiêu chuẩn cộng đồng (Tự sát/Bạo lực/Kích động)."}
            
        try:
            result_text = response.text.strip()
        except ValueError:
            # Nếu gặp lỗi khác không phải SAFETY (như MAX_TOKENS, hoặc API lỗi rỗng), cho qua để không block nhầm người dùng
            return {"is_safe": True, "reason": "OK"}

        # Xóa markdown code block nếu AI lỡ sinh ra
        if result_text.startswith("```json"):
            result_text = result_text[7:]
        if result_text.startswith("```"):
            result_text = result_text[3:]
        if result_text.endswith("```"):
            result_text = result_text[:-3]
            
        result_text = result_text.strip()
        
        try:
            parsed = json.loads(result_text)
            return {
                "is_safe": bool(parsed.get("is_safe", True)),
                "reason": parsed.get("reason", "Lỗi phân tích JSON")
            }
        except json.JSONDecodeError:
            # Fallback nếu không parse được JSON nhưng có chứa từ khóa
            if "false" in result_text.lower() or "vi phạm" in result_text.lower():
                return {"is_safe": False, "reason": "Nội dung của bạn chứa từ ngữ vi phạm tiêu chuẩn cộng đồng."}
            return {"is_safe": True, "reason": "OK"}
            
    except Exception as e:
        logger.error(f"AI Moderation Error: {e}")
        
        # --- CƠ CHẾ DỰ PHÒNG (FALLBACK) KHI AI BỊ LỖI HOẶC QUÁ TẢI (LIMIT) ---
        # Danh sách các từ khóa nhạy cảm / cấm (Bao gồm cả Teencode và lách luật)
        BANNED_KEYWORDS = [
            # Tự tử / Gây thương tích
            "tự tử", "chết đi", "rạch tay", "tự sát", "tự kỷ", "trầm cảm", "muốn chết", "đăng xuất khỏi", "treo cổ", "nhảy cầu", "uống thuốc diệt chuột", "tự t*ử",
            # Bạo lực / Kinh dị
            "giết", "chém", "đâm", "máu me", "đẫm máu", "bạo lực", "cắt cổ", "múc nó", "đánh chết", "xử nó", "xiên", "phanh thây",
            # Tục tĩu / Chửi thề
            "đụ", "địt", "cặc", "lồn", "đĩ", "điếm", "phò", "đụ má", "đéo", "đĩ mẹ", "bitch", "mặt l", "cái l",
            # Teencode tục tĩu / Lách luật
            "đm", "đmm", "đcm", "vcl", "vl", "vkl", "vlon", "vloz", "đcmm", "đjt", "dkm", "đkm", "đkmm", "cax", "cak", "cạk", "lol", "loz", "lòn", "đũy", "đỉ", "ml", "xạo lồn", "xl", "đ*t", "đ*", "l*n",
            # Đồi trụy / Tình dục
            "nứng", "sex", "clip nóng", "nude", "khoe hàng", "dâm", "hiếp dâm", "ấu dâm", "sếch", "sẽ gầy", "phim heo", "jav", "jav", "xnxx", "xvideos",
            # Chất cấm / Tệ nạn
            "ma túy", "thuốc lắc", "cỏ mỹ", "hàng đá", "đập đá", "phê cần", "hít ke", "kẹo ke", "bay phòng", "xào ke", "chơi đồ", "tài xỉu", "đánh bạc", "cá độ", "lô đề",
            # Lừa đảo / Chống phá
            "lừa đảo", "đa cấp", "phản động", "chống phá", "khủng bố", "lùa gà", "úp sọt", "cướp giật"
        ]
        
        text_lower = text.lower()
        for word in BANNED_KEYWORDS:
            if word in text_lower:
                return {"is_safe": False, "reason": f"Nội dung chứa từ khóa nhạy cảm vi phạm tiêu chuẩn cộng đồng."}
        
        # Nếu không chứa từ cấm cơ bản thì cho phép qua tạm thời
        return {"is_safe": True, "reason": f"OK (Duyệt bằng cơ chế dự phòng)"}
