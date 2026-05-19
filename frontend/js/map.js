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

const DAY_COLORS = ['#00A9FF', '#2A82DA', '#0055A4', '#4DB8FF', '#1E73BE', '#89CFF3', '#3674B5'];

export function addMarkersToMap(mapInstance, stops, sizeMultiplier=1) {
    const bs=Math.round(32*sizeMultiplier), fs=Math.round(15*sizeMultiplier);
    stops.forEach(s=>{
        const icon=L.divIcon({className:'glass-marker-container',html:`
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="glass-marker" style="--mc: ${s.color}; width:${bs}px;height:${bs}px;font-size:${fs}px;">
            ${s.day}
          </div>
        </div>`,iconSize:[bs,bs],iconAnchor:[Math.round(bs/2),Math.round(bs/2)],popupAnchor:[0,-Math.round(bs/2)]});
        L.marker([s.lat,s.lng],{icon}).addTo(mapInstance).bindTooltip(`
            <div class="glass-tooltip-content">
                <strong class="gt-title">${s.name}</strong>
                <div class="gt-day">Lịch trình Ngày ${s.day}</div>
            </div>
        `, {
            className: 'glass-tooltip',
            direction: 'top',
            offset: [0, -Math.round(bs/2) - 5],
            opacity: 1
        });
    });
}

export function addRouteToMap(mapInstance, routeLatLngs, color, weight=3) {
    L.polyline(routeLatLngs,{color:color||'#00A9FF',weight:weight+8,opacity:0.25,lineJoin:'round',lineCap:'round',className:'route-glow'}).addTo(mapInstance);
    L.polyline(routeLatLngs,{color:color||'#00A9FF',weight,opacity:0.9,lineJoin:'round',lineCap:'round',className:'route-core'}).addTo(mapInstance);
}

const DEMO_STOPS = [
    {name:'Sân bay Đà Nẵng',lat:16.044,lng:108.200,emoji:'✈️',color:'#00A9FF',day:1},
    {name:'Bãi biển Mỹ Khê',lat:16.065,lng:108.247,emoji:'🏖️',color:'#00A9FF',day:1},
    {name:'Bảo tàng Chăm',lat:16.047,lng:108.221,emoji:'🏛️',color:'#00A9FF',day:1},
    {name:'Bà Nà Hills',lat:15.997,lng:107.990,emoji:'🌉',color:'#2A82DA',day:2},
    {name:'Phố Cổ Hội An',lat:15.880,lng:108.326,emoji:'🏮',color:'#0055A4',day:3},
    {name:'Biển Cửa Đại',lat:15.867,lng:108.355,emoji:'🏖️',color:'#0055A4',day:3},
];

let currentStops = DEMO_STOPS;
let currentRoutes = [];

export async function initLeafletMap() {
    const container = document.getElementById('leaflet-map');
    if (!container || typeof L==='undefined') return;
    if (state.leafletMapInstance) { state.leafletMapInstance.remove(); state.leafletMapInstance=null; }
    state.leafletMapInstance = L.map('leaflet-map',{zoomControl:true,scrollWheelZoom:false}).setView([16.0,108.1],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:18}).addTo(state.leafletMapInstance);
    
    if (currentRoutes.length === 0) {
        const routeLatLngs = await fetchOSRMRoute(currentStops);
        currentRoutes.push({ latLngs: routeLatLngs, color: '#00A9FF' });
    }

    currentRoutes.forEach(r => addRouteToMap(state.leafletMapInstance, r.latLngs, r.color, 3));
    addMarkersToMap(state.leafletMapInstance, currentStops, 1);
    state.leafletMapInstance.fitBounds(currentStops.map(s=>[s.lat,s.lng]),{padding:[24,24]});
    setTimeout(()=>{
        state.leafletMapInstance.invalidateSize();
        // Zoom in closer by 1 level to prevent markers from overlapping too much
        state.leafletMapInstance.setZoom(state.leafletMapInstance.getZoom() + 1);
    }, 250);
    
    container.style.cursor='pointer';
    container.addEventListener('click',()=>openFullMapModal(currentStops, currentRoutes),{once:true});
}

export function openFullMapModal(stops, routes) {
    const mc = document.getElementById('leaflet-modal-map');
    if (!mc) return;
    if (state.leafletModalMapInstance) { state.leafletModalMapInstance.remove(); state.leafletModalMapInstance=null; }
    state.leafletModalMapInstance = L.map('leaflet-modal-map',{zoomControl:true,scrollWheelZoom:true}).setView([16.0,108.1],10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(state.leafletModalMapInstance);
    
    routes.forEach(r => addRouteToMap(state.leafletModalMapInstance, r.latLngs, r.color, 4));
    addMarkersToMap(state.leafletModalMapInstance, stops, 1.1);
    state.leafletModalMapInstance.fitBounds(stops.map(s=>[s.lat,s.lng]),{padding:[40,40]});
    setTimeout(()=>{
        state.leafletModalMapInstance.invalidateSize();
        state.leafletModalMapInstance.setZoom(state.leafletModalMapInstance.getZoom() + 1);
    }, 200);
    showPopup('popup-map');
}

export function drawItinerary(routingData) {
    if (!routingData || !routingData.daily_routes) return;
    
    let allStops = [];
    let allRoutes = [];
    
    routingData.daily_routes.forEach((dayRoute, idx) => {
        const dayColor = DAY_COLORS[idx % DAY_COLORS.length];
        const dayNumber = dayRoute.day || (idx + 1);
        
        if (dayRoute.places && dayRoute.places.length > 0) {
            dayRoute.places.forEach(p => {
                allStops.push({
                    name: p.name,
                    lat: p.lat,
                    lng: p.lon,
                    emoji: '📍',
                    color: dayColor,
                    day: dayNumber
                });
            });
        }
        
        if (dayRoute.route_geometry && dayRoute.route_geometry.coordinates) {
            // route_geometry of OSRM uses [lon, lat], Leaflet needs [lat, lon]
            const latLngs = dayRoute.route_geometry.coordinates.map(c => [c[1], c[0]]);
            allRoutes.push({ latLngs, color: dayColor });
        }
    });
    
    currentStops = allStops;
    currentRoutes = allRoutes;
    
    // Re-initialize map with new data
    initLeafletMap();
}

window.drawItinerary = drawItinerary;
