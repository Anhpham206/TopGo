/* 
  ========================================================================
  FILE: api.js
  CHỨC NĂNG: 
  - Lớp trung gian (Service Layer) chuyên xử lý giao tiếp mạng (HTTP Requests) kết nối Frontend với Backend (hoặc Mock Data).
  - Trừu tượng hóa các lời gọi API: lấy danh sách thành phố (\`fetchCities\`), địa điểm (\`fetchPlaces\`), tạo lịch trình (\`generateItinerary\`), gửi đánh giá (\`sendFeedback\`).
  - Hỗ trợ cơ chế Fallback (Dự phòng ngắt mạng): Tự động lazy-load file \`mockFallback.js\` nếu kết nối tới server bị lỗi hoặc môi trường không sẵn sàng, đảm bảo UI không bị sập.
  ========================================================================
*/
const _isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
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
    try {
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
                        console.log("nhận được data ở api.js");
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
                    console.log("nhận được data ở api.js 2");
                    finalData = data.result;
                }
            } catch (e) { }
        }

        if (!finalData) {
            throw new Error("Không nhận được dữ liệu kết quả cuối cùng");
        }
        return finalData;
    } catch (e) {
        console.warn("[TopGo] Lỗi kết nối BE, sử dụng mock fallback cho lịch trình:", e);
        // Simulate progress for UI
        if (onProgress) {
            onProgress('Đang tìm kiếm thông tin...');
            await new Promise(r => setTimeout(r, 1000));
            onProgress('Đang lên lịch trình...');
            await new Promise(r => setTimeout(r, 1000));
        }
        return getMockItineraryFallback(payload);
    }
}

function getMockItineraryFallback(payload) {
    const pax = payload?.pax || 1;
    const budget = payload?.budget || 5000000;
    const city = payload?.city_name || "Tuyệt Vời";

    return {
        status: "success",
        output: {
            Thong_tin_chung: {
                Ten_hanh_trinh: `Khám phá ${city} (Mock)`,
                So_nguoi: `${pax} người`,
                Tong_ngan_sach: new Intl.NumberFormat('vi-VN').format(budget) + " ₫",
                AIScore: "9.5/10"
            },
            Lich_trinh: [
                [
                    {
                        Thoi_gian: "08:30 - 10:30",
                        Dia_diem: `Điểm nổi bật 1 tại ${city}`,
                        Gioi_thieu: "Khám phá nét đẹp đặc trưng và văn hóa độc đáo tại điểm đến hấp dẫn này.",
                        Thoi_luong: "2 tiếng",
                        Di_chuyen: {
                            Phuong_tien: "Taxi",
                            Khoang_cach: "3 km",
                            Thoi_gian_di_chuyen: "10 phút"
                        }
                    },
                    {
                        Thoi_gian: "11:00 - 13:00",
                        Dia_diem: "Nhà hàng đặc sản địa phương",
                        Gioi_thieu: "Thưởng thức các món ăn đặc sản truyền thống với hương vị khó quên.",
                        Thoi_luong: "2 tiếng",
                        Di_chuyen: {
                            Phuong_tien: "Đi bộ",
                            Khoang_cach: "500 m",
                            Thoi_gian_di_chuyen: "5 phút"
                        }
                    },
                    {
                        Thoi_gian: "14:00 - 17:00",
                        Dia_diem: "Khu tham quan tự do",
                        Gioi_thieu: "Trải nghiệm các hoạt động giải trí thú vị và thư giãn buổi chiều.",
                        Thoi_luong: "3 tiếng"
                    }
                ]
            ],
            Khach_san_goi_y: [
                {
                    Ten: `Khách sạn Trung Tâm ${city}`,
                    rate: 4.8,
                    AIScore: "9.6/10",
                    Gia_tien: "1.200.000 ₫"
                },
                {
                    Ten: `Resort Ven Biển ${city}`,
                    rate: 4.5,
                    AIScore: "8.9/10",
                    Gia_tien: "1.800.000 ₫"
                }
            ],
            routing: []
        }
    };
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
