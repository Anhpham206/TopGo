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
    print("Khoi tao Firebase Admin thanh cong.")
except Exception as e:
    print(f"Loi khoi tao Firebase: {e}")
    print("Vui long dam bao file firebase-service-account.json ton tai va hop le.")
    exit(1)

# Danh sách các file dataset cần seed
DATASET_FILES = [
    'ha_noi.json',
    'da_nang.json',
    'thanh_pho_ho_chi_minh.json'
]

SERP_API_KEY = os.getenv("SERP_API_KEY")

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

def search_place_serpapi(place_name, city_name):
    """
    Tìm kiếm địa điểm trên Google Maps qua SerpAPI.
    SerpAPI google_maps engine trả về:
      - place_results (khi tìm thấy chính xác 1 địa điểm)
      - local_results (khi trả về nhiều kết quả)
    Trả về data_id để dùng cho google_maps_reviews engine.
    """
    if not SERP_API_KEY:
        return None
    
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps",
        "q": f"{place_name} {city_name}",
        "api_key": SERP_API_KEY,
        "hl": "vi"
    }
    try:
        response = requests.get(url, params=params, timeout=20)
        data = response.json()
        
        # Trường hợp 1: Kết quả trực tiếp (place_results) — SerpAPI tìm thấy đúng 1 địa điểm
        place_results = data.get("place_results", {})
        if place_results and place_results.get("data_id"):
            title = place_results.get("title", "N/A")
            data_id = place_results.get("data_id")
            print(f"    Tim thay (place_results): {title} (data_id={data_id})")
            return data_id
        
        # Trường hợp 2: Nhiều kết quả (local_results) — lấy kết quả đầu tiên
        local_results = data.get("local_results", [])
        if local_results:
            result = local_results[0]
            data_id = result.get("data_id")
            title = result.get("title", "N/A")
            print(f"    Tim thay (local_results): {title} (data_id={data_id})")
            return data_id
            
    except Exception as e:
        print(f"    Loi khi tim kiem SerpAPI cho {place_name}: {e}")
    return None

def get_reviews_serpapi(data_id):
    """Lấy 5 reviews từ Google Maps qua SerpAPI google_maps_reviews engine"""
    if not SERP_API_KEY or not data_id:
        return []
    
    url = "https://serpapi.com/search.json"
    params = {
        "engine": "google_maps_reviews",
        "data_id": data_id,
        "api_key": SERP_API_KEY,
        "hl": "vi",
        "sort_by": "qualityScore",  # Lấy review chất lượng cao nhất
    }
    try:
        response = requests.get(url, params=params, timeout=20)
        data = response.json()
        reviews = data.get("reviews", [])
        
        # Lọc chỉ lấy reviews có nội dung (snippet)
        valid_reviews = []
        for r in reviews:
            snippet = (r.get("snippet") or r.get("extract") or "").strip()
            if snippet:
                valid_reviews.append(r)
            if len(valid_reviews) >= 5:
                break
        
        return valid_reviews
    except Exception as e:
        print(f"    Loi khi lay reviews tu SerpAPI: {e}")
    return []

def seed_reviews():
    # Thư mục dataset
    dataset_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', 'dataset'))
    
    total_reviews_added = 0
    total_real_reviews = 0
    total_mock_reviews = 0
    
    if not SERP_API_KEY:
        print("[WARN] Khong tim thay SERP_API_KEY trong .env — se dung du lieu mock.")
    else:
        print("[OK] Da tim thay SERP_API_KEY, se lay reviews that tu Google Maps qua SerpAPI.")
    
    for file_name in DATASET_FILES:
        file_path = os.path.join(dataset_dir, file_name)
        if not os.path.exists(file_path):
            print(f"Bo qua {file_name}: Khong tim thay file tai {file_path}")
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
            city_name = list(data.keys())[0]
            places = data[city_name].get('diem_tham_quan', [])
            
            print(f"\n{'='*60}")
            print(f"Dang xu ly {len(places)} dia diem tai {city_name}...")
            print(f"{'='*60}")
            
            # Chỉ seed cho 5 địa điểm ngẫu nhiên mỗi thành phố để tiết kiệm quota SerpAPI
            selected_places = random.sample(places, min(5, len(places)))
            
            for place in selected_places:
                place_id = place['id']
                place_name = place['ten']
                
                print(f"\n=> Dang xu ly: {place_name} ({place_id})")
                
                real_reviews = []
                if SERP_API_KEY:
                    # Bước 1: Tìm data_id của địa điểm qua SerpAPI Google Maps Search
                    data_id = search_place_serpapi(place_name, city_name)
                    
                    if data_id:
                        # Bước 2: Lấy reviews dùng google_maps_reviews engine
                        real_reviews = get_reviews_serpapi(data_id)
                        print(f"    Lay duoc {len(real_reviews)} reviews that tu Google Maps.")
                        # Tránh rate limit SerpAPI
                        time.sleep(1.5)
                    else:
                        print(f"    Khong tim thay dia diem tren Google Maps.")
                
                if real_reviews:
                    num_added = 0
                    for review in real_reviews:
                        # SerpAPI google_maps_reviews format:
                        # - user.name, user.link
                        # - rating (float)
                        # - snippet (text content)
                        # - date (relative date string like "2 tháng trước")
                        # - iso_date (ISO format)
                        
                        comment_text = (review.get("snippet") or review.get("extract") or "").strip()
                        if not comment_text:
                            continue
                        
                        # Lấy thông tin user
                        user_info = review.get("user", {})
                        author_name = user_info.get("name", "An danh")
                        
                        # Lấy rating
                        rating = int(review.get("rating", 5))
                        
                        # Lấy thời gian
                        iso_date = review.get("iso_date")
                        try:
                            if iso_date:
                                review_time = datetime.fromisoformat(iso_date.replace("Z", "+00:00")).replace(tzinfo=None)
                            else:
                                review_time = generate_random_date(180)
                        except:
                            review_time = generate_random_date(180)
                        
                        review_data = {
                            "location_id": place_id,
                            "user_id": f"gmap_{abs(hash(author_name)) % 100000}_{random.randint(1000,9999)}",
                            "user_name": author_name,
                            "rating": rating,
                            "comment": comment_text,
                            "timestamp": review_time,
                            "source": "google_maps"
                        }
                        
                        db.collection("Reviews").add(review_data)
                        num_added += 1
                        total_reviews_added += 1
                        total_real_reviews += 1
                        # In preview ngắn (ASCII-safe)
                        preview = comment_text[:50].encode('ascii', 'replace').decode()
                        print(f"      + [{rating}*] {author_name.encode('ascii','replace').decode()}: {preview}...")
                    print(f"    => Da luu {num_added} reviews tu Google Maps.")
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
                        total_mock_reviews += 1
                    
                    print(f"    => Da seed {num_reviews} reviews gia lap (fallback).")

    print(f"\n{'='*60}")
    print(f"[DONE] Hoan tat!")
    print(f"  - Reviews that (Google Maps): {total_real_reviews}")
    print(f"  - Reviews mock (fallback):    {total_mock_reviews}")
    print(f"  - Tong cong:                  {total_reviews_added}")
    print(f"{'='*60}")

if __name__ == "__main__":
    seed_reviews()
