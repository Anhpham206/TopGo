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

export function getMockItineraryFallback(payload) {
    const pax = payload?.pax || 1;
    const budget = payload?.budget || 5000000;
    const city = payload?.city_name || "Tuyệt Vời";
    const cityId = payload?.city_id;

    // 1. Tính toán số ngày dựa vào payload
    let days = 1;
    if (payload?.date_start && payload?.date_end) {
        try {
            const start = new Date(payload.date_start);
            const end = new Date(payload.date_end);
            const diffTime = Math.abs(end - start);
            days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 || 1;
        } catch (e) {
            days = 1;
        }
    }
    // Giới hạn số ngày tối đa của mock
    days = Math.min(Math.max(1, days), 7);

    // 2. Lấy danh sách địa điểm thật từ mockFallback.js (nếu có)
    const globalPlaces = typeof MOCK_PLACES_BY_CITY !== 'undefined' ? MOCK_PLACES_BY_CITY : {};
    let cityPlaces = globalPlaces[cityId] || [];

    // Fallback nếu không tìm thấy dữ liệu cho thành phố đó
    if (!cityPlaces.length) {
        cityPlaces = [
            { id: "p1", name: `Khu phố cổ ${city}`, lat: 16.044, lng: 108.200, rating: 4.7, tags: ["Văn hóa", "Đi bộ"] },
            { id: "p2", name: `Bảo tàng lịch sử ${city}`, lat: 16.065, lng: 108.247, rating: 4.5, tags: ["Lịch sử", "Trong nhà"] },
            { id: "p3", name: `Chợ đêm trung tâm ${city}`, lat: 16.047, lng: 108.221, rating: 4.4, tags: ["Ẩm thực", "Mua sắm"] },
            { id: "p4", name: `Công viên ven sông ${city}`, lat: 15.997, lng: 107.990, rating: 4.3, tags: ["Thiên nhiên", "Thư giãn"] },
            { id: "p5", name: `Đền thờ cổ kính ${city}`, lat: 15.880, lng: 108.326, rating: 4.6, tags: ["Tâm linh", "Kiến trúc"] },
            { id: "p6", name: `Hồ nước trung tâm ${city}`, lat: 15.867, lng: 108.355, rating: 4.8, tags: ["Ngắm cảnh", "Chụp ảnh"] },
            { id: "p7", name: `Khu phố ẩm thực ${city}`, lat: 16.02, lng: 108.21, rating: 4.5, tags: ["Ẩm thực", "Đặc sản"] },
            { id: "p8", name: `Điểm ngắm hoàng hôn ${city}`, lat: 16.05, lng: 108.23, rating: 4.9, tags: ["Ngắm cảnh", "Chụp ảnh"] },
        ];
    }

    // Ưu tiên các điểm mà người dùng đã chọn trong form
    const selectedPlaces = payload?.places || [];
    const itineraryPlaces = [];

    selectedPlaces.forEach(sp => {
        const found = cityPlaces.find(cp => cp.id === sp.id || cp.name === sp.ten);
        if (found) {
            itineraryPlaces.push(found);
        } else {
            // Nếu là điểm nhập tay tự do
            itineraryPlaces.push({
                id: sp.id || "sp_" + Math.random().toString(36).substr(2, 4),
                name: sp.ten,
                lat: 16.0 + (Math.random() - 0.5) * 0.1,
                lng: 108.2 + (Math.random() - 0.5) * 0.1,
                rating: 4.5,
                tags: ["Đã chọn", "Khám phá"]
            });
        }
    });

    // Điền thêm địa điểm cho đủ số ngày
    cityPlaces.forEach(cp => {
        if (!itineraryPlaces.some(ip => ip.id === cp.id || ip.name === cp.name)) {
            itineraryPlaces.push(cp);
        }
    });

    // 3. Phân phối địa điểm vào các ngày (3 điểm/ngày)
    const placesPerDay = 3;
    const Lich_trinh = [];
    const daily_routes = [];

    const times = [
        ["08:30 - 10:30", "11:00 - 13:00", "14:30 - 17:00"],
        ["09:00 - 11:30", "12:30 - 14:00", "15:00 - 18:00"]
    ];
    const transTypes = ["Taxi", "Đi bộ", "Xe máy", "Xe buýt"];

    for (let d = 0; d < days; d++) {
        const dayStops = [];
        const routePlaces = [];
        const timePattern = times[d % times.length];

        for (let s = 0; s < placesPerDay; s++) {
            const idx = (d * placesPerDay + s) % itineraryPlaces.length;
            const place = itineraryPlaces[idx];

            const stop = {
                Thoi_gian: timePattern[s],
                Dia_diem: place.name || place.ten,
                Gioi_thieu: `Khám phá nét đẹp đặc sắc và trải nghiệm tuyệt vời tại ${place.name || place.ten}. Điểm đến thu hút đông đảo du khách nhờ phong cảnh hữu tình và bầu không khí trong lành.`,
                Thoi_luong: s === 2 ? "2.5 tiếng" : "2 tiếng"
            };

            if (s < placesPerDay - 1) {
                stop.Di_chuyen = {
                    Phuong_tien: transTypes[Math.floor(Math.random() * transTypes.length)],
                    Khoang_cach: `${(1 + Math.random() * 4).toFixed(1)} km`,
                    Thoi_gian_di_chuyen: `${Math.floor(5 + Math.random() * 15)} phút`
                };
            }

            dayStops.push(stop);

            routePlaces.push({
                id: place.id,
                name: place.name || place.ten,
                lat: place.lat || (16.0 + Math.random() * 0.1),
                lon: place.lng || place.lon || (108.2 + Math.random() * 0.1)
            });
        }

        Lich_trinh.push(dayStops);

        daily_routes.push({
            day: d + 1,
            places: routePlaces,
            distance: `${(5 + Math.random() * 8).toFixed(1)} km`,
            duration: `${Math.floor(35 + Math.random() * 30)} phút`,
            route_geometry: {
                coordinates: routePlaces.map(p => [p.lon, p.lat])
            }
        });
    }

    // 4. Lấy danh sách khách sạn gợi ý phù hợp
    const hotelMockDict = {
        ha_noi: [
            { Ten: "Sofitel Legend Metropole Hanoi", rate: 4.9, AIScore: "98%", Gia_tien: "4.500.000 ₫" },
            { Ten: "Hanoi La Siesta Hotel & Spa", rate: 4.7, AIScore: "93%", Gia_tien: "1.800.000 ₫" },
            { Ten: "The Oriental Jade Hotel", rate: 4.8, AIScore: "95%", Gia_tien: "2.100.000 ₫" }
        ],
        da_nang: [
            { Ten: "InterContinental Danang Sun Peninsula Resort", rate: 4.9, AIScore: "97%", Gia_tien: "8.500.000 ₫" },
            { Ten: "Fusion Suites Da Nang", rate: 4.6, AIScore: "91%", Gia_tien: "1.600.000 ₫" },
            { Ten: "Monarque Hotel Danang", rate: 4.8, AIScore: "94%", Gia_tien: "1.100.000 ₫" }
        ],
        thanh_pho_ho_chi_minh: [
            { Ten: "The Reverie Saigon", rate: 4.9, AIScore: "96%", Gia_tien: "5.200.000 ₫" },
            { Ten: "Caravelle Saigon", rate: 4.6, AIScore: "90%", Gia_tien: "2.300.000 ₫" },
            { Ten: "La Vela Saigon Hotel", rate: 4.7, AIScore: "93%", Gia_tien: "1.900.000 ₫" }
        ],
        nha_trang: [
            { Ten: "Vinpearl Resort & Spa Nha Trang Bay", rate: 4.7, AIScore: "92%", Gia_tien: "2.800.000 ₫" },
            { Ten: "Sheraton Nha Trang Hotel & Spa", rate: 4.8, AIScore: "94%", Gia_tien: "2.400.000 ₫" },
            { Ten: "Liberty Central Nha Trang", rate: 4.5, AIScore: "88%", Gia_tien: "1.100.000 ₫" }
        ],
        lam_dong: [
            { Ten: "Ana Mandara Villas Dalat Resort & Spa", rate: 4.8, AIScore: "95%", Gia_tien: "2.600.000 ₫" },
            { Ten: "Dalat Palace Heritage Hotel", rate: 4.7, AIScore: "92%", Gia_tien: "2.200.000 ₫" },
            { Ten: "Colline Hotel Dalat", rate: 4.5, AIScore: "89%", Gia_tien: "1.200.000 ₫" }
        ],
        phu_quoc: [
            { Ten: "JW Marriott Phu Quoc Emerald Bay Resort", rate: 4.9, AIScore: "98%", Gia_tien: "7.500.000 ₫" },
            { Ten: "Novotel Phu Quoc Resort", rate: 4.6, AIScore: "90%", Gia_tien: "1.900.000 ₫" },
            { Ten: "Sol By Meliá Phu Quoc", rate: 4.5, AIScore: "87%", Gia_tien: "1.400.000 ₫" }
        ]
    };

    let Khach_san_goi_y = hotelMockDict[cityId];
    if (!Khach_san_goi_y) {
        Khach_san_goi_y = [
            { Ten: `Khách sạn Grand ${city}`, rate: 4.7, AIScore: "94%", Gia_tien: "1.500.000 ₫" },
            { Ten: `Resort Boutique ${city}`, rate: 4.5, AIScore: "89%", Gia_tien: "2.200.000 ₫" },
            { Ten: `Homestay Thân Thiện ${city}`, rate: 4.4, AIScore: "85%", Gia_tien: "600.000 ₫" }
        ];
    }

    // Trả về cấu trúc chính xác khớp với API response
    return {
        status: "success",
        output: {
            output: {
                Thong_tin_chung: {
                    Ten_hanh_trinh: `Hành trình khám phá ${city} (Trải nghiệm mẫu)`,
                    So_nguoi: `${pax} người`,
                    Tong_ngan_sach: new Intl.NumberFormat('vi-VN').format(budget) + " ₫",
                    AIScore: "9.5/10",
                    Goi_y_khoi_hanh: "Nên khởi hành lúc 07:30 Sáng để tận hưởng thời tiết trong lành"
                },
                Lich_trinh: Lich_trinh,
                Khach_san_goi_y: Khach_san_goi_y
            },
            routing: {
                status: "success",
                daily_routes: daily_routes
            }
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

export async function sendChatMessage(message, sessionId = "default") {
    const res = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, session_id: sessionId }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
}
