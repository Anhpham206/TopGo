/* ============================================================
   TopGo — script.js
   Main client-side logic for AI Itinerary Planner
   ============================================================ */

// --- Global state ---
let CITIES = [];
let PLACES_BY_CITY = {};
let selectedCity = null;
let selectedPlaces = [];
let leafletMapInstance = null; // Leaflet map cho preview nhỏ
let leafletModalMapInstance = null; // Leaflet map cho modal lớn
let citySearchDebounceTimer = null;
let placeSearchDebounceTimer = null;
let currentHotelMarker = null; // để đánh dấu hotel được chọn

// Approximate road distances (km) between city pairs
const CITY_DIST = {
    "ha-hcm": 1700, "hcm-ha": 1700,
    "ha-dn": 764, "dn-ha": 764,
    "ha-hue": 666, "hue-ha": 666,
    "ha-hoian": 773, "hoian-ha": 773,
    "ha-nt": 1278, "nt-ha": 1278,
    "ha-dl": 1480, "dl-ha": 1480,
    "ha-ph": 2050, "ph-ha": 2050,
    "ha-hl": 165, "hl-ha": 165,
    "ha-qni": 1070, "qni-ha": 1070,
    "hcm-dn": 964, "dn-hcm": 964,
    "hcm-hue": 1045, "hue-hcm": 1045,
    "hcm-hoian": 970, "hoian-hcm": 970,
    "hcm-nt": 448, "nt-hcm": 448,
    "hcm-dl": 308, "dl-hcm": 308,
    "hcm-ph": 460, "ph-hcm": 460,
    "hcm-qni": 690, "qni-hcm": 690,
    "dn-hue": 100, "hue-dn": 100,
    "dn-hoian": 30, "hoian-dn": 30,
    "dn-nt": 534, "nt-dn": 534,
    "dn-dl": 420, "dl-dn": 420,
};

// Departure city keyword → city info
const DEP_CITY_MAP = [
    { keywords: ["nội bài", "hà nội", "hanoi", "ga hà nội", "ha noi"], code: "HAN", name: "Hà Nội", id: "ha" },
    {
        keywords: ["tân sơn nhất", "tan son nhat", "sài gòn", "saigon", "sgn",
            "hồ chí minh", "ho chi minh", "miền đông", "miền tây",
            "bến xe miền đông", "bến xe miền tây", "ga sài gòn"], code: "SGN", name: "TP.HCM", id: "hcm"
    },
    { keywords: ["đà nẵng", "da nang", "dad", "sân bay đà nẵng"], code: "DAD", name: "Đà Nẵng", id: "dn" },
    { keywords: ["phú bài", "phu bai", "huế", "hue", "hui"], code: "HUI", name: "Huế", id: "hue" },
    { keywords: ["cam ranh", "nha trang", "cxr"], code: "CXR", name: "Nha Trang", id: "nt" },
    { keywords: ["đà lạt", "da lat", "liên khương", "dli"], code: "DLI", name: "Đà Lạt", id: "dl" },
    { keywords: ["phú quốc", "phu quoc", "pqc"], code: "PQC", name: "Phú Quốc", id: "ph" },
    { keywords: ["hạ long", "ha long", "hải phòng", "hai phong", "hph"], code: "HPH", name: "Hạ Long", id: "hl" },
];

function detectDepartureCity(val) {
    const v = val.toLowerCase();
    for (const entry of DEP_CITY_MAP) {
        if (entry.keywords.some(kw => v.includes(kw))) return entry;
    }
    return null;
}

function getApproxDistance(depId, destId) {
    if (!depId || !destId || depId === destId) return 0;
    return CITY_DIST[`${depId}-${destId}`] || null;
}

// ============================================================
//  BUSINESS DATA FOR VALIDATION (ported from Flask data.py)
// ============================================================
const TRANSPORT_MIN_PER_PAX = {
    "Máy bay": 700_000,
    "Tàu hỏa": 200_000,
    "Xe khách": 150_000,
    "Ô tô riêng": 0,
    "Thuê ô tô tự lái": 400_000,
    "Xe máy": 0,
    "Xe đạp": 0,
};
const TRAIN_COST_PER_KM = 1000;
const BUS_COST_PER_KM = 800;
const AVG_SPEED = {
    "Máy bay": 800,
    "Tàu hỏa": 60,
    "Xe khách": 50,
    "Ô tô riêng": 60,
    "Thuê ô tô tự lái": 60,
    "Xe máy": 40,
    "Xe đạp": 15,
};
const ACCOMMODATION_MIN_PER_NIGHT = {
    "Resort": 1_200_000,
    "Villa": 1_500_000,
    "Khách sạn": 400_000,
    "Homestay": 250_000,
    "Airbnb": 350_000,
    "Căn hộ": 300_000,
};

// ============================================================
