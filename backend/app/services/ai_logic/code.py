import json
import os
from google import genai
from google.genai import types

# 1. Khởi tạo Client
# Lưu ý: Client sẽ tự động tìm biến môi trường GEMINI_API_KEY trong hệ thống.
# Hãy đảm bảo bạn đã chạy lệnh export GEMINI_API_KEY="..." trong terminal trước khi chạy script.
client = genai.Client()

# 2. Cấu hình Model & Generation Config
MODEL_ID = "gemini-3.1-flash-lite-preview"
generation_config = types.GenerateContentConfig(
    response_mime_type="application/json",
    temperature=0.2,
)

def read_file(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        return f.read()

def call_ai_1(fe_input_file, prompt_file):
    """AI 1 đọc prompt và input từ file, xuất ra AI1_output.txt"""
    print("⏳ AI 1 đang phân tích logic từ file...")
    
    prompt_text = read_file(prompt_file)
    user_data = read_file(fe_input_file)
    
    # Kết hợp prompt và dữ liệu
    full_prompt = f"{prompt_text}\n{user_data}"
    
    # Gọi API
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=generation_config
    )
    result = json.loads(response.text)
    
    # Lưu kết quả trung gian
    with open("AI1_output.txt", "w", encoding="utf-8") as f:
        f.write(json.dumps(result, ensure_ascii=False, indent=4))
    print("✅ AI 1 hoàn tất. Đã lưu: AI1_output.txt")

def call_ai_2(ai1_txt_file, db_json_file, prompt_file, template_file):
    """AI 2 đọc prompt, dữ liệu AI 1, dữ liệu DB và mẫu JSON để xử lý"""
    print("⏳ AI 2 đang tổng hợp lịch trình và tính điểm theo mẫu...")
    
    prompt_text = read_file(prompt_file)
    json_template = read_file(template_file)
    
    with open(ai1_txt_file, "r", encoding="utf-8") as f:
        ai1_data = json.load(f)
    with open(db_json_file, "r", encoding="utf-8") as f:
        db_data = json.load(f)
        
    # Hợp nhất dữ liệu
    combined_data = {**ai1_data, **db_data}
    
    # Lắp ghép prompt hoàn chỉnh cho AI 2
    full_prompt = (
        f"{prompt_text}\n"
        f"DỮ LIỆU ĐẦU VÀO: {json.dumps(combined_data, ensure_ascii=False)}\n"
        f"MẪU JSON YÊU CẦU: {json_template}"
    )
    
    # Gọi API
    response = client.models.generate_content(
        model=MODEL_ID,
        contents=full_prompt,
        config=generation_config
    )
    final_result = json.loads(response.text)
    
    # Xuất kết quả cuối cùng cho Backend
    output_path = "AI2_output.txt"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(json.dumps(final_result, ensure_ascii=False, indent=4))
        
    print("\n=== LOG JSON TRẢ VỀ TERMINAL ===")
    print(json.dumps(final_result, ensure_ascii=False, indent=4))
    print(f"\n[+] Đã tạo file kết quả theo đúng mẫu: {output_path}")

if __name__ == "__main__":
    try:
        # 1. Chạy AI 1
        call_ai_1("input_mock.json", "prompt_AI1.txt")
        
        # 2. Chạy AI 2 (Đọc file txt trung gian và mẫu JSON)
        if os.path.exists("AI1_output.txt"):
            call_ai_2(
                "AI1_output.txt", 
                "db_mock.json", 
                "prompt_AI2.txt", 
                "AI2_output_template.txt"
            )
    except Exception as e:
        print(f"❌ Lỗi thực thi: {e}")