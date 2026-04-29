/* 
  ========================================================================
  FILE: api.js
  CHỨC NĂNG: 
  - Lớp trung gian (Service Layer) chuyên xử lý giao tiếp mạng (HTTP Requests) kết nối Frontend với Backend (hoặc Mock Data).
  - Trừu tượng hóa các lời gọi API: lấy danh sách thành phố (\`fetchCities\`), địa điểm (\`fetchPlaces\`), tạo lịch trình (\`generateItinerary\`), gửi đánh giá (\`sendFeedback\`).
  - Hỗ trợ cơ chế Fallback (Dự phòng ngắt mạng): Tự động lazy-load file \`mockFallback.js\` nếu kết nối tới server bị lỗi hoặc môi trường không sẵn sàng, đảm bảo UI không bị sập.
  ========================================================================
*/
const _isLocal = ['localhost','127.0.0.1'].includes(window.location.hostname);
const API_BASE  = _isLocal
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
const MOCK_FALLBACK_URL = new URL('./mockFallback.js', import.meta.url);

// ── Task 10: lazy-load mockFallback ──────────────────────────
let _mockLoaded  = false;
let _mockLoading = null;

function loadMockFallback() {
    if (_mockLoaded) return Promise.resolve();
    if (_mockLoading) return _mockLoading;
    _mockLoading = new Promise((resolve, reject) => {
        if (typeof MOCK_CITIES !== 'undefined') { _mockLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = MOCK_FALLBACK_URL.href;
        s.onload  = () => { _mockLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('mockFallback.js failed to load'));
        document.head.appendChild(s);
    });
    return _mockLoading;
}

// ── Public API ────────────────────────────────────────────────

export async function fetchCities() {
    try {
        const res = await fetch(`${API_BASE}/api/cities`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } catch (e) {
        console.error('[TopGo] /api/cities failed:', e.message);
        await loadMockFallback();
        if (typeof MOCK_CITIES !== 'undefined') {
            console.warn('[TopGo] Using MOCK_CITIES (fallback)');
            return MOCK_CITIES;
        }
        return [];
    }
}

export async function fetchPlaces() {
    try {
        const res = await fetch(`${API_BASE}/api/places`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
    } catch (e) {
        console.error('[TopGo] /api/places failed:', e.message);
        await loadMockFallback();
        if (typeof MOCK_PLACES_BY_CITY !== 'undefined') {
            console.warn('[TopGo] Using MOCK_PLACES_BY_CITY (fallback)');
            return MOCK_PLACES_BY_CITY;
        }
        return {};
    }
}

export async function generateItinerary(payload) {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

export async function sendFeedback(feedback) {
    const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({feedback}),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
