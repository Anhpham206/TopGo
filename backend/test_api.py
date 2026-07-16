"""
TopGo API Test Script
=====================
Test tất cả các tính năng mới của backend TopGo.

Cách dùng:
  1. Đảm bảo backend đang chạy tại http://localhost:8000
  2. Điền FIREBASE_ID_TOKEN bên dưới (lấy từ trình duyệt)
  3. Chạy: venv\Scripts\python.exe test_api.py

Cách lấy Firebase ID Token từ trình duyệt:
  - Mở DevTools (F12) -> Console
  - Gõ: await firebase.auth().currentUser.getIdToken(true)
  - Copy token đó vào biến FIREBASE_ID_TOKEN bên dưới
"""

import requests
import json
import sys
import time

# ============================================================
# CẤU HÌNH - Điền token của bạn vào đây
# ============================================================
BASE_URL = "http://localhost:8000"
FIREBASE_ID_TOKEN = "YOUR_TOKEN_HERE"   # <-- Thay bằng token thật
# ============================================================

HEADERS = {
    "Authorization": f"Bearer {FIREBASE_ID_TOKEN}",
    "Content-Type": "application/json"
}

# ── Màu sắc terminal ──
GREEN  = "\033[92m"
RED    = "\033[91m"
YELLOW = "\033[93m"
BLUE   = "\033[94m"
RESET  = "\033[0m"
BOLD   = "\033[1m"

passed = 0
failed = 0
saved_plan_id = None

def section(title):
    print(f"\n{BLUE}{BOLD}{'='*55}{RESET}")
    print(f"{BLUE}{BOLD}  {title}{RESET}")
    print(f"{BLUE}{BOLD}{'='*55}{RESET}")

def ok(name, detail=""):
    global passed
    passed += 1
    print(f"  {GREEN}[PASS]{RESET} {name}", end="")
    if detail:
        print(f"  -> {detail}", end="")
    print()

def fail(name, detail=""):
    global failed
    failed += 1
    print(f"  {RED}[FAIL]{RESET} {name}", end="")
    if detail:
        print(f"  -> {detail}", end="")
    print()

def check_token():
    if FIREBASE_ID_TOKEN == "YOUR_TOKEN_HERE":
        print(f"\n{RED}ERROR: Bạn chưa điền FIREBASE_ID_TOKEN!{RESET}")
        print(f"\nCách lấy token:")
        print(f"  1. Mở trình duyệt, vào http://localhost:8000")
        print(f"  2. Đăng nhập tài khoản TopGo")
        print(f"  3. Mở DevTools (F12) -> Console")
        print(f"  4. Gõ lệnh sau:")
        print(f"     {YELLOW}await firebase.auth().currentUser.getIdToken(true){RESET}")
        print(f"  5. Copy token dài đó vào biến FIREBASE_ID_TOKEN trong file này")
        sys.exit(1)

# ──────────────────────────────────────────────────────────
# 1. KIỂM TRA SERVER
# ──────────────────────────────────────────────────────────
def test_server():
    section("1. KIỂM TRA SERVER")
    try:
        r = requests.get(f"{BASE_URL}/", timeout=5)
        if r.status_code in (200, 404):
            ok("Server đang chạy", f"Status {r.status_code}")
        else:
            fail("Server", f"Status {r.status_code}")
    except Exception as e:
        fail("Server không chạy", str(e))
        print(f"\n{RED}Backend chưa chạy! Hãy chạy: venv\\Scripts\\python.exe -m uvicorn app.main:app --reload{RESET}")
        sys.exit(1)

# ──────────────────────────────────────────────────────────
# 2. USERS / PROFILE
# ──────────────────────────────────────────────────────────
def test_user_profile():
    section("2. USER PROFILE  (GET + POST /api/users/profile)")

    # GET profile
    r = requests.get(f"{BASE_URL}/api/users/profile", headers=HEADERS)
    if r.status_code == 200:
        ok("GET /api/users/profile", f"data={r.json()}")
    else:
        fail("GET /api/users/profile", f"{r.status_code} {r.text[:120]}")

    # POST update profile
    payload = {
        "firstname": "Test",
        "lastname": "User",
        "dob": "2000-01-01",
        "sex": "male",
        "pob": "Ha Noi",
        "nationality": "Vietnamese"
    }
    r = requests.post(f"{BASE_URL}/api/users/profile", headers=HEADERS, json=payload)
    if r.status_code == 200 and r.json().get("status") == "success":
        ok("POST /api/users/profile (update)", r.json().get("message", ""))
    else:
        fail("POST /api/users/profile", f"{r.status_code} {r.text[:120]}")

# ──────────────────────────────────────────────────────────
# 3. SAVED PLANS
# ──────────────────────────────────────────────────────────
def test_saved_plans():
    global saved_plan_id
    section("3. SAVED PLANS  (POST save / GET list / DELETE)")

    # POST save
    payload = {
        "destination": "Da Nang",
        "days": 3,
        "pax": 2,
        "budget": 5000000.0,
        "dateStart": "2026-08-01",
        "dateEnd": "2026-08-03",
        "itinerary": json.dumps({"day1": "Tham quan Bà Nà Hills", "day2": "Phố cổ Hội An", "day3": "Bãi biển Mỹ Khê"})
    }
    r = requests.post(f"{BASE_URL}/api/plans/save", headers=HEADERS, json=payload)
    if r.status_code == 200 and r.json().get("status") == "success":
        saved_plan_id = r.json().get("id")
        ok("POST /api/plans/save", f"id={saved_plan_id}")
    else:
        fail("POST /api/plans/save", f"{r.status_code} {r.text[:120]}")

    # GET list
    r = requests.get(f"{BASE_URL}/api/plans/list", headers=HEADERS)
    if r.status_code == 200 and isinstance(r.json(), list):
        ok("GET /api/plans/list", f"count={len(r.json())} plans")
    else:
        fail("GET /api/plans/list", f"{r.status_code} {r.text[:120]}")

    # DELETE
    if saved_plan_id:
        r = requests.delete(f"{BASE_URL}/api/plans/{saved_plan_id}", headers=HEADERS)
        if r.status_code == 200 and r.json().get("status") == "success":
            ok("DELETE /api/plans/{id}", r.json().get("message", ""))
        else:
            fail("DELETE /api/plans/{id}", f"{r.status_code} {r.text[:120]}")
    else:
        fail("DELETE /api/plans/{id}", "Skipped (no plan_id from save)")

# ──────────────────────────────────────────────────────────
# 4. ITINERARY SHARE
# ──────────────────────────────────────────────────────────
def test_itinerary_share():
    section("4. ITINERARY SHARE  (POST /api/itineraries/share)")

    test_id = f"test-itinerary-{int(time.time())}"
    payload = {
        "id": test_id,
        "destination": "Hoi An",
        "days": 2,
        "pax": 2,
        "budget": 3000000.0,
        "dateStart": "2026-09-01",
        "dateEnd": "2026-09-02",
        "itinerary": json.dumps({"day1": "Phố cổ Hội An", "day2": "Mỹ Sơn"}),
        "visibility": "public"
    }
    r = requests.post(f"{BASE_URL}/api/itineraries/share", headers=HEADERS, json=payload)
    if r.status_code == 200 and r.json().get("status") == "success":
        ok("POST /api/itineraries/share (public)", f"visibility={r.json().get('visibility')}")
    else:
        fail("POST /api/itineraries/share", f"{r.status_code} {r.text[:120]}")

    # Test với visibility=private
    payload["visibility"] = "private"
    payload["id"] = f"test-private-{int(time.time())}"
    r = requests.post(f"{BASE_URL}/api/itineraries/share", headers=HEADERS, json=payload)
    if r.status_code == 200:
        ok("POST /api/itineraries/share (private)", "OK")
    else:
        fail("POST /api/itineraries/share (private)", f"{r.status_code} {r.text[:120]}")

# ──────────────────────────────────────────────────────────
# 5. CREATE POST (with AI moderation)
# ──────────────────────────────────────────────────────────
def test_create_post():
    section("5. CREATE POST  (POST /api/posts/create)")

    # Bài viết bình thường
    payload = {
        "content": "Chuyến đi Đà Nẵng thật tuyệt! Biển xanh, cát trắng và đồ ăn ngon. Mọi người hãy thử nhé!",
        "mediaUrls": [],
        "taggedLocations": ["Da Nang", "My Khe Beach"]
    }
    r = requests.post(f"{BASE_URL}/api/posts/create", headers=HEADERS, json=payload)
    if r.status_code == 200 and r.json().get("status") == "success":
        ok("POST /api/posts/create (safe content)", f"id={r.json().get('id')}")
    else:
        fail("POST /api/posts/create", f"{r.status_code} {r.text[:120]}")

    # Bài viết có nội dung không phù hợp (AI moderation phải chặn)
    payload_bad = {
        "content": "Nội dung xấu chứa từ ngữ thô tục, xúc phạm người khác một cách nghiêm trọng!!! Kill everyone",
        "mediaUrls": [],
        "taggedLocations": []
    }
    r = requests.post(f"{BASE_URL}/api/posts/create", headers=HEADERS, json=payload_bad)
    if r.status_code == 400:
        ok("POST /api/posts/create (AI blocks unsafe content)", f"Blocked: {r.json().get('detail', '')[:60]}")
    elif r.status_code == 200:
        fail("POST /api/posts/create (AI moderation)", "AI did NOT block unsafe content - check ai_moderation.py")
    else:
        fail("POST /api/posts/create (unsafe)", f"Unexpected {r.status_code} {r.text[:80]}")

# ──────────────────────────────────────────────────────────
# 6. AUTH ERRORS (không có token)
# ──────────────────────────────────────────────────────────
def test_auth_errors():
    section("6. AUTH PROTECTION (các endpoint phải trả 401/503 khi không có token)")

    no_auth = {}
    endpoints = [
        ("GET",    "/api/plans/list"),
        ("POST",   "/api/plans/save"),
        ("GET",    "/api/users/profile"),
        ("POST",   "/api/itineraries/share"),
        ("POST",   "/api/posts/create"),
    ]
    for method, path in endpoints:
        r = requests.request(method, f"{BASE_URL}{path}", headers=no_auth, json={})
        if r.status_code in (401, 422, 503):
            ok(f"{method} {path} requires auth", f"Status {r.status_code}")
        else:
            fail(f"{method} {path} should require auth", f"Got {r.status_code}")

# ──────────────────────────────────────────────────────────
# KẾT QUẢ
# ──────────────────────────────────────────────────────────
def print_summary():
    total = passed + failed
    section("KẾT QUẢ")
    print(f"  Tổng test : {total}")
    print(f"  {GREEN}Passed    : {passed}{RESET}")
    if failed > 0:
        print(f"  {RED}Failed    : {failed}{RESET}")
    else:
        print(f"  Failed    : {failed}")
    print()
    if failed == 0:
        print(f"  {GREEN}{BOLD}ALL TESTS PASSED! Backend hoạt động tốt!{RESET}")
    else:
        print(f"  {YELLOW}Một số test bị lỗi. Kiểm tra log backend để biết thêm chi tiết.{RESET}")
    print()

# ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    print(f"\n{BOLD}TopGo API Test Suite{RESET}")
    print(f"Backend: {BASE_URL}")

    check_token()
    test_server()
    test_user_profile()
    test_saved_plans()
    test_itinerary_share()
    test_create_post()
    test_auth_errors()
    print_summary()
