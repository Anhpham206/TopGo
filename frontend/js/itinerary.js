/*
  ========================================================================
  FILE: itinerary.js
  CHỨC NĂNG:
  - Logic điều khiển hiển thị chi tiết hành trình trong itinerary.html.
  - Tải dữ liệu từ API backend GET /api/users/{uid}/plans/{plan_id}.
  - Render thông tin Bento Header, Timeline chi tiết, Bản đồ Leaflet.
  - Xử lý sự kiện nhân bản (Clone) và chia sẻ (Share stub).
  ========================================================================
*/
import { showToast } from './shared.js';
import { openFullMapModal } from './map.js';

const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const ownerUid = params.get('uid');
    const planId = params.get('planId');

    if (!ownerUid || !planId) {
        showToast("Tham số không hợp lệ", "error");
        setTimeout(() => { window.location.href = './index.html'; }, 2000);
        return;
    }

    const loggedInUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;
    const isOwnPlan = loggedInUser && loggedInUser.uid === ownerUid;

    // Tải thông tin chi tiết lịch trình
    let plan = null;
    try {
        const headers = {};
        if (window.TopGoAuth && window.TopGoAuth.isLoggedIn()) {
            const token = await window.TopGoAuth.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(`${API_BASE}/api/users/${ownerUid}/plans/${planId}`, { headers });
        if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
                throw new Error("Lịch trình này ở chế độ Riêng tư (Private). Bạn không có quyền truy cập.");
            }
            throw new Error(`HTTP ${res.status}`);
        }
        plan = await res.json();
    } catch (err) {
        console.error("Lỗi khi tải lịch trình:", err);
        const container = document.getElementById('itinerary-container');
        if (container) {
            container.innerHTML = `
                <div style="padding: 40px; text-align: center; color: var(--error);">
                    ⚠️ ${err.message || 'Không thể tải chi tiết lịch trình.'}
                </div>
            `;
        }
        showToast("Lỗi tải lịch trình: " + err.message, "error");
        return;
    }

    // Hiển thị thông tin
    renderItineraryDetails(plan, isOwnPlan, ownerUid);

    // Đăng ký sự kiện đóng modal bản đồ
    document.getElementById('btn-close-map')?.addEventListener('click', () => {
        document.getElementById('popup-map')?.classList.remove('open');
    });
    const popupMap = document.getElementById('popup-map');
    if (popupMap) {
        popupMap.addEventListener('click', (e) => {
            if (e.target === popupMap) {
                popupMap.classList.remove('open');
            }
        });
    }
});

// Render thông tin
async function renderItineraryDetails(plan, isOwnPlan, ownerUid) {
    // 1. Bento Header Stats
    const titleEl = document.getElementById('res-title');
    if (titleEl) titleEl.textContent = plan.destination ? `Hành trình khám phá ${plan.destination}` : 'Hành trình gợi ý';

    const datesEl = document.getElementById('res-dates');
    if (datesEl) {
        const start = plan.dateStart ? plan.dateStart.split('-').reverse().join('/') : '';
        const end = plan.dateEnd ? plan.dateEnd.split('-').reverse().join('/') : '';
        datesEl.innerHTML = `<strong>${start} – ${end}</strong>`;
    }

    const paxEl = document.getElementById('res-pax');
    if (paxEl) paxEl.innerHTML = `<strong>${plan.pax || 1} người</strong>`;

    const budgetEl = document.getElementById('res-budget');
    if (budgetEl) {
        const budget = parseFloat(plan.budget) || 0;
        budgetEl.innerHTML = `<strong>~${budget.toLocaleString('vi-VN')} ₫</strong>`;
    }

    // Nạp tên chủ sở hữu lịch trình
    loadOwnerName(ownerUid);

    // Dữ liệu hành trình được tạo từ AI (được parse từ string hoặc dạng object)
    let itineraryData = plan.itinerary;
    if (typeof itineraryData === 'string') {
        try {
            itineraryData = JSON.parse(itineraryData);
        } catch (e) {
            console.error("Lỗi parse JSON itinerary:", e);
        }
    }

    if (!itineraryData || !itineraryData.output) {
        document.getElementById('itinerary-container').innerHTML = '<div style="padding:20px;text-align:center;">Dữ liệu lịch trình trống hoặc bị lỗi.</div>';
        return;
    }

    const aiOut = itineraryData.output;
    const ttc = aiOut.Thong_tin_chung || {};

    const departureEl = document.getElementById('res-departure');
    if (departureEl) departureEl.innerHTML = `<strong>${ttc.Diem_khoi_hanh || 'Hà Nội'}</strong>`;

    const transportEl = document.getElementById('res-transport');
    if (transportEl) transportEl.innerHTML = `<strong>${ttc.Phuong_tien || 'Tự chọn'}</strong>`;

    const accomEl = document.getElementById('res-accommodation');
    if (accomEl) accomEl.innerHTML = `<strong>${ttc.Loai_hinh_cho_o || 'Khách sạn'}</strong>`;

    // 2. Timeline rendering
    const timelineContainer = document.getElementById('itinerary-container');
    const lichTrinh = aiOut.Lich_trinh || [];
    let timelineHtml = '';

    const stops = [];
    const coords = [];

    lichTrinh.forEach((dayData, dayIndex) => {
        const ds = plan.dateStart ? new Date(plan.dateStart) : new Date();
        ds.setDate(ds.getDate() + dayIndex);
        const dateStr = ds.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

        timelineHtml += `
            <div class="timeline-day-group">
                <div class="timeline-track"></div>
                <div class="timeline-day-header" style="margin-top: 16px;">
                    <div class="tdh-num">N${dayIndex + 1}</div>
                    <div class="tdh-date">${dateStr} · ${dayData.length} điểm</div>
                </div>`;

        dayData.forEach((stop, stopIdx) => {
            const timeParts = (stop.Thoi_gian || "").split("-");
            const tStart = timeParts[0] ? timeParts[0].trim() : "";
            const isLast = stopIdx === dayData.length - 1;

            timelineHtml += `
                <div class="timeline-stop">
                    <div class="ts-time-col">
                        <div class="ts-time">${tStart || '--'}</div>
                        <div class="timeline-node"></div>
                    </div>
                    <div class="timeline-stop-card">
                        <h3 class="tsc-name">
                            <a href="https://www.google.com/search?q=${encodeURIComponent(stop.Dia_diem)}" target="_blank">${stop.Dia_diem}</a>
                        </h3>
                        <p class="tsc-desc">${stop.Gioi_thieu || ''}</p>
                        <div class="tsc-tags">
                            <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ${stop.Thoi_luong || ''}</span>
                            ${stop.Gia_ve ? `<span class="tsc-tag"><span class="glow-text">VÉ:</span> ${stop.Gia_ve}</span>` : ''}
                        </div>
                    </div>
                </div>`;

            if (stop.Di_chuyen && !isLast) {
                timelineHtml += `
                    <div class="timeline-transport">
                        <span class="glow-text">DI CHUYỂN:</span> ${stop.Di_chuyen.Phuong_tien || 'Xe'} · ${stop.Di_chuyen.Khoang_cach || ''} · ~${stop.Di_chuyen.Thoi_gian_di_chuyen || ''}
                    </div>`;
            }
        });

        timelineHtml += `</div>`;
    });

    if (timelineContainer) {
        timelineContainer.innerHTML = window.DOMPurify ? DOMPurify.sanitize(timelineHtml, { ADD_ATTR: ['target', 'style'] }) : timelineHtml;
    }

    // 3. Render Hotels
    const hotelsContainer = document.getElementById('hotels-grid-container');
    const khachSan = aiOut.Khach_san_goi_y || [];
    if (hotelsContainer) {
        if (khachSan.length > 0) {
            let htmlHotels = '';
            khachSan.slice(0, 3).forEach(ks => {
                const hotelName = ks.ten || ks.Ten || 'Khách sạn';
                const ratingVal = ks.rating || ks.rate || '4.5';
                const aiScoreVal = ks.AIScore || '90%';
                const priceVal = ks.gia_tien || ks.Gia_tien || '';
                const imageUrl = ks.url_img || '';
                const addressVal = ks.address || 'Chưa cập nhật địa chỉ';

                let formattedPrice = priceVal ? (!isNaN(priceVal) ? `~${parseFloat(priceVal).toLocaleString('vi-VN')} ₫/đêm` : `~${priceVal}/đêm`) : 'Liên hệ để có giá';

                htmlHotels += `
                    <div class="bionic-accom-card" style="display: flex; flex-direction: column; overflow: hidden; border-radius: 12px; padding: 0; background: rgba(255, 255, 255, 0.4); border: 1px solid rgba(0, 169, 255, 0.15);">
                        <div style="height: 180px; width: 100%; position: relative; background: linear-gradient(135deg, rgba(0,169,255,0.3), rgba(0,169,255,0.15));">
                            ${imageUrl ? `<img src="${imageUrl}" alt="${hotelName}" style="width:100%;height:100%;object-fit:cover;">` : '<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:rgba(255,255,255,0.8);font-size:14px;font-weight:500;">🏨 Khách sạn đề xuất</div>'}
                        </div>
                        <div style="padding: 16px; display: flex; flex-direction: column; gap: 8px; flex: 1;">
                            <div style="font-size: 18px; font-weight: 700; color: var(--text);">${hotelName}</div>
                            <div style="display: flex; gap: 12px; font-size: 13px; color: #555;">
                                <span>👍 Phù hợp: ${aiScoreVal}</span>
                                <span>★ ${ratingVal} / 5.0</span>
                            </div>
                            <div style="font-size: 12px; color: #777; margin-bottom: 8px;">📍 ${addressVal}</div>
                            <div style="margin-top: auto; border-top: 1px dashed rgba(0, 169, 255, 0.2); padding-top: 8px; font-weight: bold; color: var(--primary); font-size: 14px;">
                                ${formattedPrice}
                            </div>
                        </div>
                    </div>
                `;
            });
            hotelsContainer.innerHTML = htmlHotels;
        } else {
            hotelsContainer.innerHTML = '<div style="grid-column: span 3; padding:20px;text-align:center;color:var(--sub);">Không có gợi ý nơi lưu trú.</div>';
        }
    }

    // 4. Extract map data from routing.daily_routes (contains lat/lon coordinates & route geometry)
    const routingData = itineraryData.routing || {};
    const dailyRoutes = routingData.daily_routes || [];
    const DAY_COLORS = ['#00A9FF', '#2A82DA', '#0055A4', '#4DB8FF', '#1E73BE', '#89CFF3', '#3674B5'];
    const allRoutePolylines = []; // [{ latLngs, color, day }]

    dailyRoutes.forEach((dayRoute, idx) => {
        const dayColor = DAY_COLORS[idx % DAY_COLORS.length];
        const dayNumber = dayRoute.day || (idx + 1);

        // Collect place markers from routing data
        if (dayRoute.places && dayRoute.places.length > 0) {
            dayRoute.places.forEach(p => {
                const lat = parseFloat(p.lat);
                const lng = parseFloat(p.lon || p.lng);
                if (!isNaN(lat) && !isNaN(lng)) {
                    stops.push({
                        name: p.name || p.id || 'Địa điểm',
                        lat: lat,
                        lng: lng,
                        day: dayNumber,
                        color: dayColor
                    });
                    coords.push([lat, lng]);
                }
            });
        }

        // Collect route geometry polylines (already computed by backend OSRM)
        if (dayRoute.route_geometry && dayRoute.route_geometry.coordinates) {
            const latLngs = dayRoute.route_geometry.coordinates.map(c => [c[1], c[0]]);
            allRoutePolylines.push({ latLngs, color: dayColor, day: dayNumber });
        }
    });

    // Draw map with extracted data
    if (stops.length > 0 || allRoutePolylines.length > 0) {
        initItineraryMap(stops, coords, allRoutePolylines);
    }

    // Update stats overlays using routing data
    const rd = document.getElementById('res-dist');
    const pc = document.getElementById('res-places-count');

    // Total places
    const totalPlaces = stops.length || routingData.total_places || 0;
    if (pc) pc.textContent = `${totalPlaces} điểm`;

    // Total distance from routing daily_routes
    let totalDistanceKm = 0;
    dailyRoutes.forEach(dr => {
        totalDistanceKm += parseFloat(dr.total_distance_km) || 0;
    });
    if (totalDistanceKm > 0) {
        if (rd) rd.textContent = `~${totalDistanceKm.toFixed(1)} km`;
    } else if (coords.length > 1) {
        // Fallback: estimate from coordinates
        let estimatedDistance = 0;
        for (let i = 0; i < coords.length - 1; i++) {
            estimatedDistance += getDistanceBetween(coords[i], coords[i + 1]);
        }
        if (rd) rd.textContent = `~${estimatedDistance.toFixed(1)} km`;
    }

    // Total budget & per-person budget
    const tb = document.getElementById('res-total-budget');
    const bpp = document.getElementById('res-budget-pp');
    const budget = parseFloat(plan.budget) || 0;
    const pax = parseInt(plan.pax) || 1;
    if (tb && budget > 0) tb.textContent = `~${budget.toLocaleString('vi-VN')} ₫`;
    if (bpp && budget > 0) bpp.textContent = `~${Math.round(budget / pax).toLocaleString('vi-VN')} ₫`;

    // 6. Setup Action Buttons (Clone & Share)
    setupActionButtons(plan, isOwnPlan, ownerUid);
}

// Lấy thông tin người đăng để điền vào Bento Header
async function loadOwnerName(ownerUid) {
    try {
        const res = await fetch(`${API_BASE}/api/users/${ownerUid}/public-profile`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        const name = `${data.lastname || ''} ${data.firstname || ''}`.trim() || 'Thành viên TopGo';
        const display = data.is_vip ? `${name} 👑` : name;

        const ownerEl = document.getElementById('res-owner-name');
        if (ownerEl) {
            ownerEl.innerHTML = `<a href="./profile.html?uid=${ownerUid}" style="color: var(--primary); font-weight: bold; text-decoration: none;">${display}</a>`;
        }
    } catch (e) {
        console.warn("Lỗi tải tên chủ sở hữu:", e);
    }
}

// Khởi tạo bản đồ trực quan Leaflet
async function initItineraryMap(stops, coords, allRoutePolylines) {
    const container = document.getElementById('leaflet-map');
    if (!container || typeof L === 'undefined') return;

    const map = L.map('leaflet-map', { zoomControl: true, scrollWheelZoom: false }).setView(coords[0] || [16.0, 108.1], 10);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(map);

    // Draw pre-computed route polylines from routing data (each day gets its own color)
    if (allRoutePolylines && allRoutePolylines.length > 0) {
        allRoutePolylines.forEach(rp => {
            // Glow layer (wider, semi-transparent)
            L.polyline(rp.latLngs, { color: rp.color, weight: 6, opacity: 0.3, lineJoin: 'round', lineCap: 'round' }).addTo(map);
            // Core layer (narrower, solid)
            L.polyline(rp.latLngs, { color: rp.color, weight: 3, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }).addTo(map);
        });
    } else if (coords.length > 1) {
        // Fallback: try OSRM or draw straight lines
        try {
            const osrmCoords = await fetchOSRMRoute(stops);
            L.polyline(osrmCoords, { color: '#00a9ff', weight: 6, opacity: 0.3, lineJoin: 'round', lineCap: 'round' }).addTo(map);
            L.polyline(osrmCoords, { color: '#0077ff', weight: 3, opacity: 0.9, lineJoin: 'round', lineCap: 'round' }).addTo(map);
        } catch (err) {
            L.polyline(coords, { color: '#00a9ff', weight: 3, opacity: 0.8 }).addTo(map);
        }
    }

    // Add Markers
    stops.forEach(s => {
        const icon = L.divIcon({
            className: 'glass-marker-container',
            html: `
            <div style="display:flex;flex-direction:column;align-items:center;">
              <div class="glass-marker" style="width:30px;height:30px;font-size:14px;display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;border-radius:50%;background:${s.color};border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.3)">
                ${s.day}
              </div>
            </div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });

        L.marker([s.lat, s.lng], { icon })
            .addTo(map)
            .bindTooltip(`<strong>${s.name}</strong><br>Ngày ${s.day}`, { direction: 'top' });
    });

    if (coords.length > 0) {
        map.fitBounds(coords, { padding: [40, 40] });
    }

    const clickOverlay = document.getElementById('map-click-overlay');
    if (clickOverlay) {
        clickOverlay.addEventListener('click', () => {
            openFullMapModal(stops, allRoutePolylines);
        });
    }
}

// Tính khoảng cách tọa độ (đơn giản)
function getDistanceBetween(c1, c2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (c2[0] - c1[0]) * Math.PI / 180;
    const dLng = (c2[1] - c1[1]) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(c1[0] * Math.PI / 180) * Math.cos(c2[0] * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Fetch OSRM coordinates
async function fetchOSRMRoute(stops) {
    const coords = stops.map(s => `${s.lng},${s.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
    const res = await fetch(url);
    const data = await res.json();
    if (data.code === 'Ok' && data.routes?.length) {
        return data.routes[0].geometry.coordinates.map(c => [c[1], c[0]]);
    }
    throw new Error("OSRM failed");
}

// Setup Clone & Share Buttons
function setupActionButtons(plan, isOwnPlan, ownerUid) {
    const cloneBtn = document.getElementById('btn-clone-plan');
    const shareBtn = document.getElementById('btn-share-plan');

    // Chỉ hiển thị nút Clone nếu KHÔNG PHẢI lịch trình của mình
    if (!isOwnPlan) {
        cloneBtn?.classList.remove('hidden');
        cloneBtn?.addEventListener('click', async () => {
            const loggedInUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;
            if (!loggedInUser) {
                showToast("Bạn cần đăng nhập để thực hiện chức năng Nhân bản.", "warning");
                if (window.TopGoAuth) showPopup('popup-login');
                return;
            }

            cloneBtn.disabled = true;
            cloneBtn.textContent = "Đang chuyển hướng...";

            showToast("Đang chuẩn bị lộ trình. Đang chuyển hướng về Planner của bạn...", "success");
            setTimeout(() => {
                // Chỉ chuyển hướng dữ liệu sang Planner để người dùng xem lại chứ không lưu tự động
                localStorage.setItem('topgo_review_plan', JSON.stringify({
                    id: null, // Đặt null để Planner hiểu đây là lịch trình mới chưa được lưu
                    destination: plan.destination,
                    days: plan.days,
                    pax: plan.pax,
                    budget: plan.budget,
                    dateStart: plan.dateStart,
                    dateEnd: plan.dateEnd,
                    itinerary: plan.itinerary
                }));
                window.location.href = './planner.html';
            }, 1000);
        });
    }

    // Xử lý nút Share
    shareBtn?.addEventListener('click', () => {
        if (isOwnPlan) {
            // Nếu là chủ sở hữu: mở modal đổi quyền riêng tư (Private/Unlisted/Public)
            if (typeof window.openShareModal === 'function') {
                window.openShareModal(plan);
            } else {
                showToast("Tính năng chia sẻ chưa sẵn sàng. Vui lòng tải lại trang.", "warning");
            }
        } else {
            // Nếu là người khác: mở thẳng modal viết bài đăng chia sẻ lên News Feed
            if (typeof window.openPostModal === 'function') {
                window.openPostModal(plan);
            } else {
                showToast("Tính năng chia sẻ bài đăng chưa sẵn sàng. Vui lòng tải lại trang.", "warning");
            }
        }
    });
}
