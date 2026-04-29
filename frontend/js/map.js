/* 
  ========================================================================
  FILE: map.js
  CHỨC NĂNG: 
  - Khởi tạo và tương tác với thư viện bản đồ mã nguồn mở Leaflet (\`L.map\`).
  - Tích hợp dịch vụ định tuyến OSRM (\`fetchOSRMRoute\`) để vẽ đường chỉ dẫn giao thông giữa các điểm trong lịch trình thay vì đường chim bay.
  - Cung cấp giao diện trực quan cho bản đồ thu nhỏ trên kết quả (\`initLeafletMap\`) và bản đồ phóng to modal (\`openFullMapModal\`).
  - Sinh mã HTML cho các Markers tuỳ chỉnh có màu sắc và emoji (Custom Markers).
  ========================================================================
*/
import { state } from './data.js';
import { showPopup } from './shared.js';

export async function fetchOSRMRoute(stops) {
    const coords = stops.map(s=>`${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    try {
        const res  = await fetch(url);
        const data = await res.json();
        if (data.code==='Ok'&&data.routes?.length)
            return data.routes[0].geometry.coordinates.map(c=>[c[1],c[0]]);
    } catch(e) { console.warn('[TopGo] OSRM failed, using straight lines'); }
    return stops.map(s=>[s.lat,s.lng]);
}

export function addMarkersToMap(mapInstance, stops, sizeMultiplier=1) {
    const bs=Math.round(38*sizeMultiplier), fs=Math.round(19*sizeMultiplier), ls=Math.round(9*sizeMultiplier);
    stops.forEach(s=>{
        const icon=L.divIcon({className:'',html:`
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="background:${s.color};color:#fff;border-radius:50%;width:${bs}px;height:${bs}px;display:flex;align-items:center;justify-content:center;font-size:${fs}px;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2.5px solid #fff">${s.emoji}</div>
          <div style="background:${s.color};color:#fff;font-size:${ls}px;font-weight:700;padding:2px 6px;border-radius:8px;margin-top:2px;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,.2)">Ngày ${s.day}</div>
        </div>`,iconSize:[bs,Math.round(bs*1.42)],iconAnchor:[Math.round(bs/2),Math.round(bs*1.42)],popupAnchor:[0,Math.round(-bs*1.47)]});
        L.marker([s.lat,s.lng],{icon}).addTo(mapInstance).bindPopup(`<strong>${s.name}</strong><br><small>Ngày ${s.day} trong lịch trình</small>`);
    });
}

export function addRouteToMap(mapInstance, routeLatLngs, weight=4) {
    L.polyline(routeLatLngs,{color:'#00A9FF',weight,opacity:.9,dashArray:'10,7',lineJoin:'round'}).addTo(mapInstance);
}

const DEMO_STOPS = [
    {name:'Sân bay Đà Nẵng',lat:16.044,lng:108.200,emoji:'✈️',color:'#3674B5',day:1},
    {name:'Bãi biển Mỹ Khê',lat:16.065,lng:108.247,emoji:'🏖️',color:'#0C9E72',day:1},
    {name:'Bảo tàng Chăm',lat:16.047,lng:108.221,emoji:'🏛️',color:'#578FCA',day:1},
    {name:'Bà Nà Hills',lat:15.997,lng:107.990,emoji:'🌉',color:'#7B4FBE',day:2},
    {name:'Phố Cổ Hội An',lat:15.880,lng:108.326,emoji:'🏮',color:'#E8A914',day:3},
    {name:'Biển Cửa Đại',lat:15.867,lng:108.355,emoji:'🏖️',color:'#0BB5D5',day:3},
];

export async function initLeafletMap() {
    const container = document.getElementById('leaflet-map');
    if (!container || typeof L==='undefined') return;
    if (state.leafletMapInstance) { state.leafletMapInstance.remove(); state.leafletMapInstance=null; }
    state.leafletMapInstance = L.map('leaflet-map',{zoomControl:true,scrollWheelZoom:false}).setView([16.0,108.1],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:18}).addTo(state.leafletMapInstance);
    const routeLatLngs = await fetchOSRMRoute(DEMO_STOPS);
    addRouteToMap(state.leafletMapInstance, routeLatLngs, 4);
    addMarkersToMap(state.leafletMapInstance, DEMO_STOPS, 1);
    state.leafletMapInstance.fitBounds(DEMO_STOPS.map(s=>[s.lat,s.lng]),{padding:[24,24]});
    setTimeout(()=>state.leafletMapInstance.invalidateSize(), 250);
    container.style.cursor='pointer';
    container.addEventListener('click',()=>openFullMapModal(DEMO_STOPS, routeLatLngs),{once:true});
}

export function openFullMapModal(stops, routeLatLngs) {
    const mc = document.getElementById('leaflet-modal-map');
    if (!mc) return;
    if (state.leafletModalMapInstance) { state.leafletModalMapInstance.remove(); state.leafletModalMapInstance=null; }
    state.leafletModalMapInstance = L.map('leaflet-modal-map',{zoomControl:true,scrollWheelZoom:true}).setView([16.0,108.1],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(state.leafletModalMapInstance);
    addRouteToMap(state.leafletModalMapInstance, routeLatLngs, 5);
    addMarkersToMap(state.leafletModalMapInstance, stops, 1.1);
    state.leafletModalMapInstance.fitBounds(stops.map(s=>[s.lat,s.lng]),{padding:[30,30]});
    setTimeout(()=>state.leafletModalMapInstance.invalidateSize(), 200);
    showPopup('popup-map');
}
