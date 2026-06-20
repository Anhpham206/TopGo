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

function normalizeString(str) {
    if (!str) return '';
    return str.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // remove accents
        .replace(/[^\w\s]/g, '')         // remove special characters/emojis
        .replace(/\s+/g, ' ')            // collapse spaces
        .trim();
}

function findPlaceDetails(name) {
    if (!name) return null;
    const cleanName = normalizeString(name);
    for (const cityId in state.PLACES_BY_CITY) {
        const list = state.PLACES_BY_CITY[cityId];
        if (Array.isArray(list)) {
            const found = list.find(item => {
                const tName = normalizeString(item.name || item.ten || '');
                return tName === cleanName || cleanName.includes(tName) || tName.includes(cleanName);
            });
            if (found) return found;
        }
    }
    return null;
}

function getTooltipHtml(s) {
    let ratingHtml = '';
    if (s.rating) {
        ratingHtml = `<span style="color: #ffc107; font-weight: bold; margin-left: 8px;">★ ${s.rating}</span>`;
    }
    
    let priceHtml = '';
    if (s.price !== undefined && s.price !== null) {
        let priceStr = '';
        if (typeof s.price === 'number') {
            priceStr = s.price === 0 ? 'Miễn phí' : `${s.price.toLocaleString('vi-VN')} ₫`;
        } else {
            priceStr = s.price;
        }
        priceHtml = `<div class="gt-price" style="font-size: 12px; color: #2ecc71; font-weight: 600; margin-top: 4px;">Giá vé: ${priceStr}</div>`;
    }

    return `
        <div class="glass-tooltip-content" style="padding: 4px; font-family: var(--font, sans-serif); text-align: left; align-items: flex-start; display: flex; flex-direction: column; gap: 2px;">
            <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                <strong class="gt-title" style="font-size: 13.5px; color: #295e85; white-space: normal; word-break: break-word; text-align: left;">${s.name}</strong>
                ${ratingHtml}
            </div>
            <div class="gt-day" style="font-size: 11px; color: var(--p1); font-weight: 700; margin-top: 4px; display: inline-block;">${s.sequence ? `Ngày ${s.day} &bull; Điểm dừng ${s.sequence}` : `Lịch trình Ngày ${s.day}`}</div>
            ${priceHtml}
        </div>
    `;
}

export function addMarkersToMap(mapInstance, stops, sizeMultiplier=1) {
    const bs=Math.round(32*sizeMultiplier), fs=Math.round(15*sizeMultiplier);
    stops.forEach(s=>{
        const icon=L.divIcon({className:'glass-marker-container',html:`
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div class="glass-marker" style="--mc: ${s.color}; width:${bs}px;height:${bs}px;font-size:${fs}px;">
            ${s.day}
          </div>
        </div>`,iconSize:[bs,bs],iconAnchor:[Math.round(bs/2),Math.round(bs/2)],popupAnchor:[0,-Math.round(bs/2)]});
        
        if (!s.rating || s.price === undefined || s.price === null) {
            const details = findPlaceDetails(s.name);
            if (details) {
                s.rating = s.rating || details.rating || details.rate || null;
                let pVal = null;
                if (details.gia_ve !== undefined && details.gia_ve !== null) {
                    pVal = details.gia_ve;
                } else if (details.price !== undefined && details.price !== null) {
                    pVal = details.price;
                } else if (details.Gia_tien !== undefined && details.Gia_tien !== null) {
                    pVal = details.Gia_tien;
                } else if (details.details && (details.details.includes('Vé ~') || details.details.includes('Giá ~') || details.details.includes('vé ~') || details.details.includes('giá ~'))) {
                    pVal = details.details;
                }
                s.price = s.price !== undefined && s.price !== null ? s.price : pVal;
            }
        }

        L.marker([s.lat,s.lng],{icon}).addTo(mapInstance).bindTooltip(getTooltipHtml(s), {
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
let currentHotels = [];
let currentOptimalCoordinate = null;

export function addHotelsToMap(mapInstance, hotels) {
    if (!hotels || !hotels.length) return;
    hotels.forEach(h => {
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#3674B5;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">🏨</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
        
        const tooltipHtml = `
            <div class="glass-tooltip-content" style="padding: 4px; font-family: var(--font, sans-serif); text-align: left; align-items: flex-start; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                    <strong class="gt-title" style="font-size: 13.5px; color: #295e85; white-space: normal; word-break: break-word; text-align: left;">${h.name}</strong>
                    <span style="color: #ffc107; font-weight: bold; margin-left: 8px;">★ ${h.rating}</span>
                </div>
                <div style="font-size: 12px; color: var(--p1); font-weight: 700; margin-top: 4px;">Giá: ${h.price}</div>
            </div>
        `;
        
        L.marker([h.lat, h.lng], { icon })
            .addTo(mapInstance)
            .bindTooltip(tooltipHtml, {
                className: 'glass-tooltip',
                direction: 'top',
                offset: [0, -15],
                opacity: 1
            })
            .bindPopup(`<strong>${h.name}</strong><br>⭐ Rating: ${h.rating}<br>💰 Giá: ${h.price}`);
    });
}

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
    addHotelsToMap(state.leafletMapInstance, currentHotels);

    // Draw optimal coordinate marker on small map if exists
    if (currentOptimalCoordinate) {
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#e67e22;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(230,126,34,.4), 0 0 10px #e67e22">🎯</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
        
        const tooltipHtml = `
            <div class="glass-tooltip-content" style="padding: 4px; font-family: var(--font, sans-serif); text-align: left; align-items: flex-start; display: flex; flex-direction: column; gap: 2px;">
                <strong class="gt-title" style="font-size: 13.5px; color: #e67e22; white-space: normal; word-break: break-word; text-align: left;">🎯 Điểm tối ưu hành trình</strong>
                <div style="font-size: 11px; color: var(--text); opacity: 0.8; margin-top: 4px;">Điểm trung tâm tối ưu để di chuyển và chọn nơi lưu trú</div>
            </div>
        `;
        
        L.marker([currentOptimalCoordinate.lat, currentOptimalCoordinate.lng], { icon })
            .addTo(state.leafletMapInstance)
            .bindTooltip(tooltipHtml, {
                className: 'glass-tooltip',
                direction: 'top',
                offset: [0, -16],
                opacity: 1
            });
    }

    state.leafletMapInstance.fitBounds(currentStops.map(s=>[s.lat,s.lng]),{padding:[24,24]});
    setTimeout(()=>{
        if (state.leafletMapInstance) {
            state.leafletMapInstance.invalidateSize();
            // Zoom in closer by 1 level to prevent markers from overlapping too much
            state.leafletMapInstance.setZoom(state.leafletMapInstance.getZoom() + 1);
        }
    }, 250);
    
    const clickOverlay = document.getElementById('map-click-overlay');
    if (clickOverlay) {
        clickOverlay.style.cursor = 'pointer';
        clickOverlay.removeEventListener('click', onMapClick);
        clickOverlay.addEventListener('click', onMapClick);
    } else {
        container.style.cursor='pointer';
        container.removeEventListener('click', onMapClick);
        container.addEventListener('click', onMapClick);
    }
}

function onMapClick() {
    openFullMapModal(currentStops, currentRoutes);
}

let modalMarkersLayerGroup = null;
let modalRoutesLayerGroup = null;
let modalHotelsLayerGroup = null;

export function updateModalMapForDay(dayNumber, stops, routes) {
    if (!state.leafletModalMapInstance) return;
    
    // Initialize or clear layer groups
    if (!modalMarkersLayerGroup) {
        modalMarkersLayerGroup = L.layerGroup().addTo(state.leafletModalMapInstance);
    } else {
        modalMarkersLayerGroup.clearLayers();
    }
    
    if (!modalRoutesLayerGroup) {
        modalRoutesLayerGroup = L.layerGroup().addTo(state.leafletModalMapInstance);
    } else {
        modalRoutesLayerGroup.clearLayers();
    }
    
    if (!modalHotelsLayerGroup) {
        modalHotelsLayerGroup = L.layerGroup().addTo(state.leafletModalMapInstance);
    } else {
        modalHotelsLayerGroup.clearLayers();
    }
    
    // Filter stops and routes for this day
    const dayStops = stops.filter(s => s.day === dayNumber);
    const dayRoutes = routes.filter(r => r.day === dayNumber);
    
    // Draw day routes
    dayRoutes.forEach(r => {
        L.polyline(r.latLngs, {
            color: r.color || '#00A9FF',
            weight: 12,
            opacity: 0.25,
            lineJoin: 'round',
            lineCap: 'round',
            className: 'route-glow'
        }).addTo(modalRoutesLayerGroup);
        
        L.polyline(r.latLngs, {
            color: r.color || '#00A9FF',
            weight: 4,
            opacity: 0.9,
            lineJoin: 'round',
            lineCap: 'round',
            className: 'route-core'
        }).addTo(modalRoutesLayerGroup);
    });
    
    // Draw day stops markers with sequence numbers
    const sizeMultiplier = 1.1;
    const bs = Math.round(32 * sizeMultiplier), fs = Math.round(15 * sizeMultiplier);
    dayStops.forEach((s, idx) => {
        s.sequence = idx + 1; // set sequence number for tooltip
        const icon = L.divIcon({
            className: 'glass-marker-container',
            html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div class="glass-marker" style="--mc: ${s.color}; width:${bs}px;height:${bs}px;font-size:${fs}px;">
                ${idx + 1}
              </div>
            </div>`,
            iconSize: [bs, bs],
            iconAnchor: [Math.round(bs/2), Math.round(bs/2)],
            popupAnchor: [0, -Math.round(bs/2)]
        });
        
        if (!s.rating || s.price === undefined || s.price === null) {
            const details = findPlaceDetails(s.name);
            if (details) {
                s.rating = s.rating || details.rating || details.rate || null;
                let pVal = null;
                if (details.gia_ve !== undefined && details.gia_ve !== null) {
                    pVal = details.gia_ve;
                } else if (details.price !== undefined && details.price !== null) {
                    pVal = details.price;
                } else if (details.Gia_tien !== undefined && details.Gia_tien !== null) {
                    pVal = details.Gia_tien;
                } else if (details.details && (details.details.includes('Vé ~') || details.details.includes('Giá ~') || details.details.includes('vé ~') || details.details.includes('giá ~'))) {
                    pVal = details.details;
                }
                s.price = s.price !== undefined && s.price !== null ? s.price : pVal;
            }
        }

        L.marker([s.lat, s.lng], { icon })
            .addTo(modalMarkersLayerGroup)
            .bindTooltip(getTooltipHtml(s), {
                className: 'glass-tooltip',
                direction: 'top',
                offset: [0, -Math.round(bs/2) - 5],
                opacity: 1
            });
    });
    
    // Draw hotel markers (always display them on the map)
    currentHotels.forEach(h => {
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#3674B5;color:#fff;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:15px;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">🏨</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
            popupAnchor: [0, -15]
        });
        
        const tooltipHtml = `
            <div class="glass-tooltip-content" style="padding: 4px; font-family: var(--font, sans-serif); text-align: left; align-items: flex-start; display: flex; flex-direction: column; gap: 2px;">
                <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; width: 100%;">
                    <strong class="gt-title" style="font-size: 13.5px; color: #295e85; white-space: normal; word-break: break-word; text-align: left;">${h.name}</strong>
                    <span style="color: #ffc107; font-weight: bold; margin-left: 8px;">★ ${h.rating}</span>
                </div>
                <div style="font-size: 12px; color: var(--p1); font-weight: 700; margin-top: 4px;">Giá: ${h.price}</div>
            </div>
        `;
        
        L.marker([h.lat, h.lng], { icon })
            .addTo(modalHotelsLayerGroup)
            .bindTooltip(tooltipHtml, {
                className: 'glass-tooltip',
                direction: 'top',
                offset: [0, -15],
                opacity: 1
            })
            .bindPopup(`<strong>${h.name}</strong><br>⭐ Rating: ${h.rating}<br>💰 Giá: ${h.price}`);
    });

    // Draw optimal coordinate marker if exists
    if (currentOptimalCoordinate) {
        const icon = L.divIcon({
            className: '',
            html: `<div style="background:#e67e22;color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(230,126,34,.4), 0 0 10px #e67e22">🎯</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
        
        const tooltipHtml = `
            <div class="glass-tooltip-content" style="padding: 4px; font-family: var(--font, sans-serif); text-align: left; align-items: flex-start; display: flex; flex-direction: column; gap: 2px;">
                <strong class="gt-title" style="font-size: 13.5px; color: #e67e22; white-space: normal; word-break: break-word; text-align: left;">🎯 Điểm tối ưu hành trình</strong>
                <div style="font-size: 11px; color: var(--text); opacity: 0.8; margin-top: 4px;">Điểm trung tâm tối ưu để di chuyển và chọn nơi lưu trú</div>
            </div>
        `;
        
        L.marker([currentOptimalCoordinate.lat, currentOptimalCoordinate.lng], { icon })
            .addTo(modalHotelsLayerGroup)
            .bindTooltip(tooltipHtml, {
                className: 'glass-tooltip',
                direction: 'top',
                offset: [0, -16],
                opacity: 1
            });
    }
    
    // Fit bounds of current day stops
    if (dayStops.length > 0) {
        state.leafletModalMapInstance.fitBounds(dayStops.map(s => [s.lat, s.lng]), { padding: [40, 40] });
    }
}

export function openFullMapModal(stops, routes) {
    const mc = document.getElementById('leaflet-modal-map');
    if (!mc) return;
    
    // Show popup first so that the map container has actual layout dimensions before initializing L.map
    showPopup('popup-map');
    
    if (!state.leafletModalMapInstance) {
        state.leafletModalMapInstance = L.map('leaflet-modal-map',{zoomControl:true,scrollWheelZoom:true}).setView([16.0,108.1],10);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap',maxZoom:18}).addTo(state.leafletModalMapInstance);
    }
    
    // Generate day selector buttons
    const uniqueDays = [...new Set(stops.map(s => s.day))].sort((a, b) => a - b);
    if (uniqueDays.length === 0) uniqueDays.push(1);
    
    const selector = document.getElementById('map-day-selector');
    if (selector) {
        selector.innerHTML = uniqueDays.map(d => {
            const isActive = d === 1;
            const count = stops.filter(s => s.day === d).length;
            return `
                <button class="map-day-btn${isActive ? ' active' : ''}" data-day="${d}">
                    <span>Ngày ${d}</span>
                    <span class="btn-day-info">${count} điểm</span>
                </button>
            `;
        }).join('');
        
        selector.querySelectorAll('.map-day-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                selector.querySelectorAll('.map-day-btn').forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                const selectedDay = parseInt(this.getAttribute('data-day'));
                updateModalMapForDay(selectedDay, stops, routes);
            });
        });
    }
    
    // Render day 1 by default
    updateModalMapForDay(1, stops, routes);
    
    setTimeout(()=>{
        if (state.leafletModalMapInstance) {
            state.leafletModalMapInstance.invalidateSize();
            // Zoom in closer by 1 level to fit the view nicely
            const currentZoom = state.leafletModalMapInstance.getZoom();
            state.leafletModalMapInstance.setZoom(currentZoom + 1);
        }
    }, 250);
}

export function drawItinerary(routingData) {
    if (!routingData || !routingData.daily_routes) return;
    
    // Extract optimal coordinate if available
    if (routingData.optimal_coordinate) {
        currentOptimalCoordinate = {
            lat: routingData.optimal_coordinate.lat,
            lng: routingData.optimal_coordinate.lon || routingData.optimal_coordinate.lng
        };
    } else {
        currentOptimalCoordinate = null;
    }
    
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
            allRoutes.push({ latLngs, color: dayColor, day: dayNumber });
        }
    });
    
    currentStops = allStops;
    currentRoutes = allRoutes;
    
    // Extract recommended hotels if available
    let hotels = [];
    if (window._lastItineraryData && window._lastItineraryData.output && window._lastItineraryData.output.Khach_san_goi_y) {
        const ksList = window._lastItineraryData.output.Khach_san_goi_y;
        hotels = ksList.map(ks => {
            let latVal = parseFloat(ks.lat);
            let lngVal = parseFloat(ks.lng);
            if (isNaN(latVal) || isNaN(lngVal)) {
                latVal = 16.059;
                lngVal = 108.244;
            }
            let priceVal = ks.gia_tien || ks.Gia_tien || '';
            let formattedPrice = '';
            if (priceVal) {
                if (!isNaN(priceVal)) {
                    formattedPrice = `${parseFloat(priceVal).toLocaleString('vi-VN')} ₫/đêm`;
                } else {
                    formattedPrice = priceVal.toString().includes('/đêm') ? priceVal : `${priceVal}/đêm`;
                }
            } else {
                formattedPrice = 'Liên hệ';
            }
            return {
                name: ks.ten || ks.Ten || 'Khách sạn',
                lat: latVal,
                lng: lngVal,
                rating: ks.rating || ks.rate || '4.5',
                price: formattedPrice,
                isHotel: true
            };
        });
    }
    currentHotels = hotels;
    
    // Re-initialize map with new data
    initLeafletMap();
}

window.drawItinerary = drawItinerary;
