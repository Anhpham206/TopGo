import os
import json
import random
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# Khởi tạo Firebase Admin SDK
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
try:
    cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Khởi tạo Firebase Admin thành công.")
except Exception as e:
    print(f"Lỗi khởi tạo Firebase: {e}")
    print("Vui lòng đảm bảo file firebase-service-account.json tồn tại và hợp lệ.")
    exit(1)

# Danh sách các file dataset cần seed (thêm bớt tùy ý)
DATASET_FILES = [
    'ha_noi.json',
    'da_nang.json',
    'thanh_pho_ho_chi_minh.json'
]

# Dữ liệu mẫu (Clone phong cách Google Maps)
SAMPLE_USERS = [
    ("Phạm Văn A", "12345_seed"),
    ("Trần Thị B", "23456_seed"),
    ("Nguyễn Văn C", "34567_seed"),
    ("Lê Hoàng D", "45678_seed"),
    ("Hoàng Kim E", "56789_seed"),
    ("Traveler_Pro", "67890_seed"),
    ("Foodie_VN", "78901_seed")
]

SAMPLE_COMMENTS_HIGH = [
    "Địa điểm tuyệt vời, rất đáng để trải nghiệm!",
    "Phong cảnh đẹp, nhân viên nhiệt tình, mình sẽ quay lại.",
    "Khung cảnh ở đây đẹp như trong tranh vậy, chụp ảnh bao ảo.",
    "Một nơi lý tưởng để thư giãn cuối tuần cùng gia đình.",
    "Không khí trong lành, mọi thứ đều được sắp xếp rất gọn gàng sạch sẽ.",
    "Trải nghiệm tuyệt vời nhất trong chuyến đi của mình. 10 điểm không có nhưng!"
]

SAMPLE_COMMENTS_MID = [
    "Cũng tạm ổn, giá vé hơi cao so với mặt bằng chung.",
    "Khá đông người vào cuối tuần, nên đi vào ngày thường sẽ thoải mái hơn.",
    "Chỗ này chụp ảnh thì đẹp nhưng dịch vụ đi kèm chưa thực sự xuất sắc.",
    "Bình thường, không có gì quá nổi bật."
]

def generate_random_date(days_back=365):
    """Tạo ngày ngẫu nhiên trong khoảng thời gian (mặc định 1 năm trở lại)"""
    return datetime.now() - timedelta(days=random.randint(0, days_back), hours=random.randint(0, 23))

def seed_reviews():
    dataset_dir = os.path.join(os.path.dirname(__file__), '..', 'dataset')
    
    total_reviews_added = 0
    
    for file_name in DATASET_FILES:
        file_path = os.path.join(dataset_dir, file_name)
        if not os.path.exists(file_path):
            print(f"Bỏ qua {file_name}: Không tìm thấy file.")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            # Lấy tên thành phố (key đầu tiên)
            city_name = list(data.keys())[0]
            places = data[city_name].get('diem_tham_quan', [])
            
            print(f"Đang xử lý {len(places)} địa điểm tại {city_name}...")
            
            # Chỉ seed cho 5 địa điểm ngẫu nhiên mỗi thành phố để tiết kiệm thời gian
            # Trong thực tế có thể bỏ random.sample để seed hết
            selected_places = random.sample(places, min(5, len(places)))
            
            for place in selected_places:
                place_id = place['id']
                place_name = place['ten']
                
                # Tạo 2-4 reviews ngẫu nhiên cho mỗi địa điểm
                num_reviews = random.randint(2, 4)
                
                for _ in range(num_reviews):
                    user_name, user_id = random.choice(SAMPLE_USERS)
                    
                    # Mô phỏng phân phối sao (thiên về 4-5 sao)
                    rating = random.choices([5, 4, 3, 2, 1], weights=[50, 30, 10, 5, 5])[0]
                    
                    if rating >= 4:
                        comment = random.choice(SAMPLE_COMMENTS_HIGH)
                    else:
                        comment = random.choice(SAMPLE_COMMENTS_MID)
                    
                    review_data = {
                        "location_id": place_id,
                        "user_id": user_id,
                        "user_name": user_name,
                        "rating": rating,
                        "comment": comment,
                        "timestamp": generate_random_date()
                    }
                    
                    # Push to Firestore
                    db.collection("Reviews").add(review_data)
                    total_reviews_added += 1
                
                print(f"  + Đã seed {num_reviews} reviews cho: {place_name}")

    print(f"\nHoàn tất! Đã thêm thành công {total_reviews_added} reviews giả lập vào Firestore.")

if __name__ == "__main__":
    seed_reviews()
