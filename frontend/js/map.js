//  LEAFLET MAP (preview + modal) — Real road routing via OSRM
// ============================================================

// Fetch real road route between consecutive stops using OSRM
async function fetchOSRMRoute(stops) {
    // Build OSRM waypoints string: lng,lat;lng,lat;...
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            // OSRM returns [lng, lat], Leaflet needs [lat, lng]
            return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
        }
    } catch (e) {
        console.warn('OSRM routing failed, falling back to straight lines:', e);
    }
    // Fallback: straight lines
    return stops.map(s => [s.lat, s.lng]);
}

function addMarkersToMap(mapInstance, stops, sizeMultiplier = 1) {
    const baseSize = Math.round(38 * sizeMultiplier);
    const fontSize = Math.round(19 * sizeMultiplier);
    const labelSize = Math.round(9 * sizeMultiplier);
    stops.forEach(s => {
        const icon = L.divIcon({
            className: '',
            html: `
        <div style="display:flex;flex-direction:column;align-items:center;">
          <div style="
            background:${s.color};color:#fff;
            border-radius:50%;width:${baseSize}px;height:${baseSize}px;
            display:flex;align-items:center;justify-content:center;
            font-size:${fontSize}px;
            box-shadow:0 3px 10px rgba(0,0,0,0.3);
            border:2.5px solid #fff;
          ">${s.emoji}</div>
          <div style="
            background:${s.color};color:#fff;
            font-size:${labelSize}px;font-weight:700;padding:2px 6px;
            border-radius:8px;margin-top:2px;white-space:nowrap;
            box-shadow:0 2px 6px rgba(0,0,0,0.2);
          ">Ngày ${s.day}</div>
        </div>`,
            iconSize: [baseSize, Math.round(baseSize * 1.42)],
            iconAnchor: [Math.round(baseSize / 2), Math.round(baseSize * 1.42)],
            popupAnchor: [0, Math.round(-baseSize * 1.47)],
        });
        L.marker([s.lat, s.lng], { icon })
            .addTo(mapInstance)
            .bindPopup(`<strong>${s.name}</strong><br><small>Ngày ${s.day} trong lịch trình</small>`);
    });
}

function addRouteToMap(mapInstance, routeLatLngs, weight = 4) {
    L.polyline(routeLatLngs, {
        color: '#00A9FF',
        weight: weight,
        opacity: 0.9,
        dashArray: '10, 7',
        lineJoin: 'round',
    }).addTo(mapInstance);
}

async function initLeafletMap() {
    const container = document.getElementById('leaflet-map');
    if (!container || typeof L === 'undefined') return;

    if (leafletMapInstance) {
        leafletMapInstance.remove();
        leafletMapInstance = null;
    }

    leafletMapInstance = L.map('leaflet-map', {
        zoomControl: true,
        scrollWheelZoom: false,
    }).setView([16.0, 108.1], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(leafletMapInstance);

    const stops = [
        { name: 'Sân bay Đà Nẵng', lat: 16.044, lng: 108.200, emoji: '✈️', color: '#3674B5', day: 1 },
        { name: 'Bãi biển Mỹ Khê', lat: 16.065, lng: 108.247, emoji: '🏖️', color: '#0C9E72', day: 1 },
        { name: 'Bảo tàng Điêu khắc Chăm', lat: 16.047, lng: 108.221, emoji: '🏛️', color: '#578FCA', day: 1 },
        { name: 'Bà Nà Hills', lat: 15.997, lng: 107.990, emoji: '🌉', color: '#7B4FBE', day: 2 },
        { name: 'Phố Cổ Hội An', lat: 15.880, lng: 108.326, emoji: '🏮', color: '#E8A914', day: 3 },
        { name: 'Biển Cửa Đại', lat: 15.867, lng: 108.355, emoji: '🏖️', color: '#0BB5D5', day: 3 },
    ];

    // Fetch real road route
    const routeLatLngs = await fetchOSRMRoute(stops);

    // Draw road route
    addRouteToMap(leafletMapInstance, routeLatLngs, 4);

    // Add markers
    addMarkersToMap(leafletMapInstance, stops, 1);

    const latlngs = stops.map(s => [s.lat, s.lng]);
    leafletMapInstance.fitBounds(latlngs, { padding: [24, 24] });
    setTimeout(() => leafletMapInstance.invalidateSize(), 250);

    // Gắn sự kiện click vào map để mở modal lớn
    const mapContainer = document.getElementById('leaflet-map');
    if (mapContainer) {
        mapContainer.style.cursor = 'pointer';
        mapContainer.addEventListener('click', function () {
            openFullMapModal(stops, routeLatLngs);
        });
    }
}

// Mở modal map lớn
function openFullMapModal(stops, routeLatLngs) {
    const modalContainer = document.getElementById('leaflet-modal-map');
    if (!modalContainer) return;

    // Khởi tạo map trong modal nếu chưa có
    if (leafletModalMapInstance) {
        leafletModalMapInstance.remove();
        leafletModalMapInstance = null;
    }

    leafletModalMapInstance = L.map('leaflet-modal-map', {
        zoomControl: true,
        scrollWheelZoom: true,
    }).setView([16.0, 108.1], 10);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
    }).addTo(leafletModalMapInstance);

    // Draw road route
    addRouteToMap(leafletModalMapInstance, routeLatLngs, 5);

    // Add markers (slightly larger for modal)
    addMarkersToMap(leafletModalMapInstance, stops, 1.1);

    const latlngs = stops.map(s => [s.lat, s.lng]);
    leafletModalMapInstance.fitBounds(latlngs, { padding: [30, 30] });
    setTimeout(() => leafletModalMapInstance.invalidateSize(), 200);

    showPopup('popup-map');
}
