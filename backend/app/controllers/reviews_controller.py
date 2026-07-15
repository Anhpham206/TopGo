import os
import requests
from fastapi import Query
from dotenv import load_dotenv

load_dotenv()

SERP_API_KEY = os.getenv("SERP_API_KEY")

# Cache đơn giản trong RAM để tránh gọi lại SerpAPI cho cùng 1 địa điểm
_cache = {}

async def get_google_reviews(place_name: str = Query(...), city_name: str = Query("")):
    """
    Lấy 3 reviews thật từ Google Maps cho một địa điểm qua SerpAPI.
    Kết quả được cache trong RAM để tiết kiệm API quota.
    """
    if not SERP_API_KEY:
        return {"reviews": [], "error": "SERP_API_KEY not configured"}
    
    # Check cache
    cache_key = f"{place_name}|{city_name}"
    if cache_key in _cache:
        return {"reviews": _cache[cache_key], "source": "cache"}
    
    try:
        # Bước 1: Tìm địa điểm trên Google Maps
        search_url = "https://serpapi.com/search.json"
        search_params = {
            "engine": "google_maps",
            "q": f"{place_name} {city_name}",
            "api_key": SERP_API_KEY,
            "hl": "vi"
        }
        
        search_resp = requests.get(search_url, params=search_params, timeout=15)
        search_data = search_resp.json()
        
        # Lấy data_id từ place_results hoặc local_results
        data_id = None
        place_results = search_data.get("place_results", {})
        if place_results and place_results.get("data_id"):
            data_id = place_results.get("data_id")
        else:
            local_results = search_data.get("local_results", [])
            if local_results and local_results[0].get("data_id"):
                data_id = local_results[0].get("data_id")
        
        if not data_id:
            _cache[cache_key] = []
            return {"reviews": [], "error": "Place not found on Google Maps"}
        
        # Bước 2: Lấy reviews qua google_maps_reviews engine
        reviews_params = {
            "engine": "google_maps_reviews",
            "data_id": data_id,
            "api_key": SERP_API_KEY,
            "hl": "vi",
            "sort_by": "qualityScore",
        }
        
        reviews_resp = requests.get(search_url, params=reviews_params, timeout=15)
        reviews_data = reviews_resp.json()
        raw_reviews = reviews_data.get("reviews", [])
        
        # Lọc và format 3 reviews có nội dung
        formatted = []
        for r in raw_reviews:
            snippet = (r.get("snippet") or r.get("extract") or "").strip()
            if not snippet or len(snippet) < 10:
                continue
            
            user_info = r.get("user", {})
            formatted.append({
                "user_name": user_info.get("name", "Ẩn danh"),
                "rating": int(r.get("rating", 5)),
                "comment": snippet,
                "date": r.get("date", ""),
                "source": "google_maps"
            })
            
            if len(formatted) >= 3:
                break
        
        # Cache kết quả
        _cache[cache_key] = formatted
        return {"reviews": formatted, "source": "serpapi"}
    
    except Exception as e:
        return {"reviews": [], "error": str(e)}
