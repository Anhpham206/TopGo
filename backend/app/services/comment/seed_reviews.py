import os
import json
import random
import time
import requests
import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load biến môi trường từ file .env ở thư mục backend
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '.env'))
load_dotenv(env_path)

# Khởi tạo Firebase Admin SDK
cred_path = os.path.join(os.path.dirname(__file__), 'firebase-service-account.json')
# Nếu không tìm thấy trong thư mục comment, thử tìm ở root backend
if not os.path.exists(cred_path):
    cred_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', 'firebase-service-account.json'))

try:
    cred = credentials.Certificate(cred_path)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Khởi tạo Firebase Admin thành công.")
except Exception as e:
    print(f"Lỗi khởi tạo Firebase: {e}")
    print("Vui lòng đảm bảo file firebase-service-account.json tồn tại và hợp lệ.")
    exit(1)

# Danh sách các file dataset cần seed
DATASET_FILES = [
    'ha_noi.json',
    'da_nang.json',
    'thanh_pho_ho_chi_minh.json'
]

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

# Dữ liệu mẫu fallback nếu không có API hoặc API hết quota
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

def search_place_google_maps(place_name, city_name):
    """Tìm kiếm Place ID trên Google Maps dựa vào tên và thành phố"""
    if not GOOGLE_MAPS_API_KEY:
        return None
        
    url = "https://maps.googleapis.com/maps/api/place/findplacefromtext/json"
    params = {
        "input": f"{place_name} {city_name}",
        "inputtype": "textquery",
        "fields": "place_id",
        "key": GOOGLE_MAPS_API_KEY
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data.get("status") == "OK" and len(data.get("candidates", [])) > 0:
            return data["candidates"][0]["place_id"]
    except Exception as e:
        print(f"Lỗi khi tìm Place ID cho {place_name}: {e}")
    return None

def get_place_reviews(place_id):
    """Lấy danh sách reviews từ Google Maps Place Details"""
    if not GOOGLE_MAPS_API_KEY or not place_id:
        return []
        
    url = "https://maps.googleapis.com/maps/api/place/details/json"
    params = {
        "place_id": place_id,
        "fields": "reviews",
        "language": "vi",
        "key": GOOGLE_MAPS_API_KEY
    }
    try:
        response = requests.get(url, params=params)
        data = response.json()
        if data.get("status") == "OK" and "reviews" in data.get("result", {}):
            return data["result"]["reviews"]
    except Exception as e:
        print(f"Lỗi khi lấy reviews cho Place ID {place_id}: {e}")
    return []

def seed_reviews():
    # Thư mục dataset ở d:\TDTT\TopGo\dataset
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'dataset'))
    
    total_reviews_added = 0
    
    for file_name in DATASET_FILES:
        file_path = os.path.join(dataset_dir, file_name)
        if not os.path.exists(file_path):
            print(f"Bỏ qua {file_name}: Không tìm thấy file tại {file_path}")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            city_name = list(data.keys())[0]
            places = data[city_name].get('diem_tham_quan', [])
            
            print(f"Đang xử lý {len(places)} địa điểm tại {city_name}...")
            
            # Chỉ seed cho 5 địa điểm ngẫu nhiên mỗi thành phố để tiết kiệm thời gian
            # Trong thực tế có thể bỏ random.sample để seed hết
            selected_places = random.sample(places, min(5, len(places)))
            
            for place in selected_places:
                place_id = place['id']
                place_name = place['ten']
                
                print(f"\n=> Đang xử lý địa điểm: {place_name} ({place_id})")
                
                real_reviews = []
                if GOOGLE_MAPS_API_KEY:
                    gmap_place_id = search_place_google_maps(place_name, city_name)
                    if gmap_place_id:
                        print(f"  + Tìm thấy Google Maps Place ID: {gmap_place_id}")
                        real_reviews = get_place_reviews(gmap_place_id)
                        print(f"  + Lấy được {len(real_reviews)} nhận xét thực từ Google Maps.")
                    else:
                        print("  - Không tìm thấy địa điểm trên Google Maps.")
                else:
                    print("  - Chưa có GOOGLE_MAPS_API_KEY, sẽ dùng dữ liệu mock.")
                
                if real_reviews:
                    num_added = 0
                    for review in real_reviews:
                        # Google Maps review có các trường: author_name, rating, text, time (timestamp)
                        comment_text = review.get("text", "").strip()
                        if not comment_text:
                            continue # Bỏ qua review chỉ có rating mà ko có text
                            
                        # Format lại timestamp
                        try:
                            review_time = datetime.fromtimestamp(review.get("time", time.time()))
                        except:
                            review_time = generate_random_date()
                            
                        review_data = {
                            "location_id": place_id,
                            "user_id": f"gmap_{review.get('author_url', '1').split('/')[-1]}_{random.randint(1000,9999)}",
                            "user_name": review.get("author_name", "Ẩn danh"),
                            "rating": review.get("rating", 5),
                            "comment": comment_text,
                            "timestamp": review_time,
                            "source": "google_maps"
                        }
                        
                        db.collection("Reviews").add(review_data)
                        num_added += 1
                        total_reviews_added += 1
                    print(f"  + Đã lưu {num_added} reviews từ Google Maps.")
                else:
                    # Fallback to mock data
                    num_reviews = random.randint(2, 4)
                    for _ in range(num_reviews):
                        user_name, user_id = random.choice(SAMPLE_USERS)
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
                            "timestamp": generate_random_date(),
                            "source": "mock"
                        }
                        
                        db.collection("Reviews").add(review_data)
                        total_reviews_added += 1
                    
                    print(f"  + Đã seed {num_reviews} reviews giả lập.")

    print(f"\nHoàn tất! Đã thêm thành công tổng cộng {total_reviews_added} reviews vào Firestore.")

if __name__ == "__main__":
    seed_reviews()
