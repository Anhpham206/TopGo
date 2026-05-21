/* 
  ========================================================================
  FILE: data.js
  CHỨC NĂNG: 
  - Central State Management (Quản lý trạng thái trung tâm) của ứng dụng Frontend.
  - Lưu trữ state tạm thời trên RAM (danh sách thành phố tải về, địa điểm đã chọn, instance bản đồ Leaflet, các timeout debounce).
  - Định nghĩa tập hợp các hằng số nghiệp vụ cố định: khoảng cách ma trận giữa các thành phố (\`CITY_DIST\`), danh sách nhận diện mã sân bay/bến xe (\`DEP_CITY_MAP\`), định mức vận tốc và chi phí (\`AVG_SPEED\`, \`TRANSPORT_MIN_PER_PAX\`, v.v.).
  - Cung cấp các hàm Helper liên quan thuần tuý đến tra cứu dữ liệu (nhận diện điểm xuất phát, tính khoảng cách tương đối).
  ========================================================================
*/
export const state = {
    CITIES: [], PLACES_BY_CITY: {}, selectedCity: null, selectedPlaces: [], selectedDepCity: null,
    leafletMapInstance: null, leafletModalMapInstance: null,
    citySearchDebounceTimer: null, placeSearchDebounceTimer: null, currentHotelMarker: null,
};

export const CITY_DIST = {
    "ha_noi-hcm":1700,"hcm-ha_noi":1700,"ha_noi-da_nang":764,"da_nang-ha_noi":764,
    "ha_noi-hoi_an":773,"hoi_an-ha_noi":773,"ha_noi-nha_trang":1278,"nha_trang-ha_noi":1278,
    "ha_noi-lam_dong":1480,"lam_dong-ha_noi":1480,"ha_noi-phu_quoc":2050,"phu_quoc-ha_noi":2050,
    "ha_noi-ninh_binh":93,"ninh_binh-ha_noi":93,"ha_noi-ha_long":165,"ha_long-ha_noi":165,
    "ha_noi-quy_nhon":1070,"quy_nhon-ha_noi":1070,"ha_noi-hue":666,"hue-ha_noi":666,
    "hcm-da_nang":964,"da_nang-hcm":964,"hcm-hoi_an":970,"hoi_an-hcm":970,
    "hcm-nha_trang":448,"nha_trang-hcm":448,"hcm-lam_dong":308,"lam_dong-hcm":308,
    "hcm-phu_quoc":460,"phu_quoc-hcm":460,"hcm-binh_thuan":198,"binh_thuan-hcm":198,
    "hcm-ca_mau":350,"ca_mau-hcm":350,"hcm-can_tho":170,"can_tho-hcm":170,
    "hcm-ninh_thuan":350,"ninh_thuan-hcm":350,"hcm-hue":1045,"hue-hcm":1045,
    "da_nang-hoi_an":30,"hoi_an-da_nang":30,"da_nang-nha_trang":534,"nha_trang-da_nang":534,
    "da_nang-lam_dong":420,"lam_dong-da_nang":420,"da_nang-ninh_binh":480,"ninh_binh-da_nang":480,
    "da_nang-hue":100,"hue-da_nang":100,"nha_trang-lam_dong":135,"lam_dong-nha_trang":135,
    "nha_trang-ninh_thuan":105,"ninh_thuan-nha_trang":105,"nha_trang-binh_thuan":250,"binh_thuan-nha_trang":250,
    "lam_dong-binh_thuan":160,"binh_thuan-lam_dong":160,"can_tho-ca_mau":180,"ca_mau-can_tho":180,
    "can_tho-phu_quoc":300,"phu_quoc-can_tho":300,
};

export const DEP_CITY_MAP = [
    {keywords:["nội bài","hà nội","hanoi","ga hà nội","ha noi"],code:"HAN",name:"Hà Nội",id:"ha_noi"},
    {keywords:["tân sơn nhất","tan son nhat","sài gòn","saigon","sgn","hồ chí minh","ho chi minh","miền đông","miền tây","bến xe miền đông","bến xe miền tây","ga sài gòn"],code:"SGN",name:"TP.HCM",id:"hcm"},
    {keywords:["đà nẵng","da nang","dad","sân bay đà nẵng"],code:"DAD",name:"Đà Nẵng",id:"da_nang"},
    {keywords:["phú bài","phu bai","huế","hue","hui"],code:"HUI",name:"Huế",id:"hue"},
    {keywords:["cam ranh","nha trang","cxr"],code:"CXR",name:"Nha Trang",id:"nha_trang"},
    {keywords:["đà lạt","da lat","liên khương","dli","lâm đồng","lam dong"],code:"DLI",name:"Đà Lạt",id:"lam_dong"},
    {keywords:["phú quốc","phu quoc","pqc"],code:"PQC",name:"Phú Quốc",id:"phu_quoc"},
    {keywords:["hạ long","ha long","hải phòng","hai phong","hph"],code:"HPH",name:"Hạ Long",id:"ha_long"},
    {keywords:["phan thiết","phan thiet","mũi né","mui ne","bình thuận","binh thuan"],code:"BTN",name:"Bình Thuận",id:"binh_thuan"},
    {keywords:["cà mau","ca mau","đất mũi","dat mui"],code:"CMU",name:"Cà Mau",id:"ca_mau"},
    {keywords:["cần thơ","can tho","ninh kiều","ninh kieu","cái răng","cai rang"],code:"CTO",name:"Cần Thơ",id:"can_tho"},
    {keywords:["ninh bình","ninh binh","tràng an","trang an","tam cốc","tam coc"],code:"NBH",name:"Ninh Bình",id:"ninh_binh"},
    {keywords:["ninh thuận","ninh thuan","phan rang","vĩnh hy","vinh hy"],code:"NTN",name:"Ninh Thuận",id:"ninh_thuan"},
];

export const TRANSPORT_MIN_PER_PAX = {
    "Máy bay":700_000,"Tàu hỏa":200_000,"Xe khách":150_000,
    "Ô tô riêng":0,"Thuê ô tô tự lái":400_000,"Xe máy":0,"Xe đạp":0,
};
export const TRAIN_COST_PER_KM = 1000;
export const BUS_COST_PER_KM   = 800;
export const AVG_SPEED = {
    "Máy bay":800,"Tàu hỏa":60,"Xe khách":50,
    "Ô tô riêng":60,"Thuê ô tô tự lái":60,"Xe máy":40,"Xe đạp":15,
};
export const ACCOMMODATION_MIN_PER_NIGHT = {
    "Resort":1_200_000,"Villa":1_500_000,"Khách sạn":400_000,
    "Homestay":250_000,"Airbnb":350_000,"Căn hộ":300_000,
};
export const VALID_TRANSPORT_TYPES = ['Xe khách','Máy bay','Tàu hỏa','Ô tô riêng','Xe máy','Thuê ô tô tự lái','Xe đạp','Khác'];
export const VALID_ACCOMMODATION_TYPES = ['Khách sạn','Homestay','Airbnb','Resort','Villa','Căn hộ','Khác'];

export function detectDepartureCity(val) {
    const v = val.toLowerCase();
    for (const entry of DEP_CITY_MAP) {
        if (entry.keywords.some(kw => v.includes(kw))) return entry;
    }
    return null;
}

export function getApproxDistance(depId, destId) {
    if (!depId || !destId || depId === destId) return 0;
    return CITY_DIST[`${depId}-${destId}`] || null;
}
