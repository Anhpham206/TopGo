/* 
  ========================================================================
  FILE: api.js
  CHỨC NĂNG: 
  - Lớp trung gian (Service Layer) chuyên xử lý giao tiếp mạng (HTTP Requests) kết nối Frontend với Backend (hoặc Mock Data).
  - Trừu tượng hóa các lời gọi API: lấy danh sách thành phố (\`fetchCities\`), địa điểm (\`fetchPlaces\`), tạo lịch trình (\`generateItinerary\`), gửi đánh giá (\`sendFeedback\`).
  - Hỗ trợ cơ chế Fallback (Dự phòng ngắt mạng): Tự động lazy-load file \`mockFallback.js\` nếu kết nối tới server bị lỗi hoặc môi trường không sẵn sàng, đảm bảo UI không bị sập.
  ========================================================================
*/
const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
const MOCK_FALLBACK_URL = new URL('./mockFallback.js', import.meta.url);

// ── Task 10: lazy-load mockFallback ──────────────────────────
let _mockLoaded = false;
let _mockLoading = null;

function loadMockFallback() {
    if (_mockLoaded) return Promise.resolve();
    if (_mockLoading) return _mockLoading;
    _mockLoading = new Promise((resolve, reject) => {
        if (typeof MOCK_CITIES !== 'undefined') { _mockLoaded = true; resolve(); return; }
        const s = document.createElement('script');
        s.src = MOCK_FALLBACK_URL.href;
        s.onload = () => { _mockLoaded = true; resolve(); };
        s.onerror = () => reject(new Error('mockFallback.js failed to load'));
        document.head.appendChild(s);
    });
    return _mockLoading;
}

// ── Public API ────────────────────────────────────────────────

export async function fetchCities() {
    return [
        { id: 'ha_noi', name: 'Hà Nội', sub: 'Thủ đô ngàn năm văn hiến', img: './assets/img/cities/ha-noi.png', color: '#ffb3ba' },
        { id: 'da_nang', name: 'Đà Nẵng', sub: 'Thành phố đáng sống', img: './assets/img/cities/da-nang.jpg', color: '#baffc9' },
        { id: 'thanh_pho_ho_chi_minh', name: 'TP. Hồ Chí Minh', sub: 'Hòn ngọc Viễn Đông', img: './assets/img/cities/hcm.jpg', color: '#bae1ff' },
        { id: 'nha_trang', name: 'Nha Trang', sub: 'Thành phố biển', img: './assets/img/cities/nha-trang.jpg', color: '#ffffba' },
        { id: 'lam_dong', name: 'Lâm Đồng (Đà Lạt)', sub: 'Thành phố mờ sương', img: './assets/img/cities/da-lat.jpg', color: '#e6ccff' },
        { id: 'phu_quoc', name: 'Phú Quốc', sub: 'Đảo ngọc', img: './assets/img/cities/phu-quoc.jpg', color: '#ffdfba' },
        { id: 'hoi_an', name: 'Hội An', sub: 'Phố cổ yên bình', img: './assets/img/cities/hoi-an.jpg', color: '#f7d6e0' },
        { id: 'binh_thuan', name: 'Bình Thuận', sub: 'Biển xanh cát trắng', img: './assets/img/cities/binh-thuan.jpg', color: '#d6f7e0' },
        { id: 'ca_mau', name: 'Cà Mau', sub: 'Mũi đất phương Nam', img: './assets/img/cities/ca-mau.jpg', color: '#f7f6d6' },
        { id: 'can_tho', name: 'Cần Thơ', sub: 'Thủ phủ miền Tây', img: './assets/img/cities/can-tho.jpg', color: '#d6dcf7' },
        { id: 'ninh_binh', name: 'Ninh Bình', sub: 'Vịnh Hạ Long trên cạn', img: './assets/img/cities/ninh-binh.jpg', color: '#e8d6f7' },
        { id: 'ninh_thuan', name: 'Ninh Thuận', sub: 'Xứ sở nho', img: './assets/img/cities/ninh-thuan.jpg', color: '#f7d6e8' }
    ];
}

export async function fetchPlaces() {
    try {
        const files = [
            { file: 'binh_thuan.json', id: 'binh_thuan' },
            { file: 'ca_mau.json', id: 'ca_mau' },
            { file: 'can_tho.json', id: 'can_tho' },
            { file: 'da_nang.json', id: 'da_nang' },
            { file: 'ha_noi.json', id: 'ha_noi' },
            { file: 'hoi_an.json', id: 'hoi_an' },
            { file: 'lam_dong.json', id: 'lam_dong' },
            { file: 'nha_trang.json', id: 'nha_trang' },
            { file: 'ninh_binh.json', id: 'ninh_binh' },
            { file: 'ninh_thuan.json', id: 'ninh_thuan' },
            { file: 'phu_quoc.json', id: 'phu_quoc' },
            { file: 'thanh_pho_ho_chi_minh.json', id: 'thanh_pho_ho_chi_minh' }
        ];
        const placesByCity = {};
        for (const item of files) {
            let res = await fetch(`${API_BASE}/dataset/${item.file}`).catch(() => null);
            if (res && res.ok) {
                const data = await res.json();
                const cityName = Object.keys(data)[0];
                placesByCity[item.id] = data[cityName].diem_tham_quan || [];
            }
        }
        return placesByCity;
    } catch (e) {
        console.error('[TopGo] /api/places fallback to dataset failed:', e.message);
        return {};
    }
}

export async function generateItinerary(payload, onProgress) {
    const res = await fetch(`${API_BASE}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";
    let finalData = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
            if (line.trim() === '') continue;
            try {
                const data = JSON.parse(line);
                if (data.step === 'done') {
                    finalData = data.result;
                } else if (data.step && onProgress) {
                    onProgress(data.step);
                }
            } catch (e) {
                console.warn("[TopGo] Failed to parse JSON line:", line);
            }
        }
    }

    if (buffer.trim()) {
        try {
            const data = JSON.parse(buffer);
            if (data.step === 'done') {
                finalData = data.result;
            }
        } catch (e) { }
    }

    if (!finalData) {
        throw new Error("Không nhận được dữ liệu kết quả cuối cùng");
    }
    return finalData;
}

export async function sendFeedback(feedback) {
    const res = await fetch(`${API_BASE}/api/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}

/**
 * Gửi tin nhắn chat tới TopGo AI backend.
 * @param {string} message  - Tin nhắn của người dùng
 * @param {string} sessionId - ID phiên chat (mỗi tab tạo 1 UUID riêng)
 * @returns {Promise<string>} - Phản hồi từ Gemini AI
 */
export async function sendChatMessage(message, sessionId) {
    const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.reply;
}
