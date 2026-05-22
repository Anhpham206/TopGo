/* 
  ========================================================================
  FILE: ui.js
  CHỨC NĂNG: 
  - Thao tác trực tiếp với DOM để thay đổi trạng thái giao diện (View Controller).
  - Chuyển đổi giữa các màn hình ứng dụng (\`showScreen\`).
  - Render logic danh sách: dropdown thành phố (\`renderCityList\`), dropdown địa điểm (\`renderPlaceList\`), và danh sách thẻ tags.
  - Quản lý logic tương tác trên Form: Tăng giảm số người (\`adjustPax\`), xử lý Date (validate/khoảng ngày), Format định dạng Ngân sách (\`formatBudget\`), đếm số ký tự Textarea.
  - Hàm khởi tạo sự kiện tổng (\`initFormUIEvents\`): Trừu tượng hóa việc gán tất cả EventListener (Click, Input, Change) và ủy quyền cho luồng dữ liệu.
  - Dựng kết quả cuối cùng (\`renderItinerary\`) trên màn hình Result.
  ========================================================================
*/
import { state, detectDepartureCity } from './data.js';
import { showPopup, closePopup, showToast } from './shared.js';
import { isNonsensicalText, getTravelHours } from './utils.js';
import { initLeafletMap } from './map.js';

// ── Screen ────────────────────────────────────────────────────
export function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('screen-' + name)?.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'result') { setTimeout(initLeafletMap, 150); attachHotelClickEvents(); }
}

// ── Hotel map ─────────────────────────────────────────────────
function attachHotelClickEvents() {
    document.querySelectorAll('.bionic-accom-card').forEach(card => {
        card.addEventListener('click', function () {
            const h = JSON.parse(this.getAttribute('data-hotel'));
            if (!h || !state.leafletMapInstance) return;
            if (state.currentHotelMarker) state.leafletMapInstance.removeLayer(state.currentHotelMarker);
            const icon = L.divIcon({ className: '', html: `<div style="background:${h.color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🏨</div>`, iconSize: [32, 32], iconAnchor: [16, 16], popupAnchor: [0, -16] });
            state.currentHotelMarker = L.marker([h.lat, h.lng], { icon }).addTo(state.leafletMapInstance).bindPopup(`<strong>${h.name}</strong><br>📍 Đã chọn`).openPopup();
            state.leafletMapInstance.setView([h.lat, h.lng], 15);
            showToast(`Đã định vị ${h.name} trên bản đồ`, 'success');
        });
    });
}

// ── Dropdown helpers ──────────────────────────────────────────
let _lastCityFilter = null;
let _lastSelectedCityId = null;
let _lastDepFilter = null;
let _lastSelectedDepId = null;
let _lastPlaceFilter = null;
let _lastPlaceCityId = null;
let _lastSelectedPlacesIds = null;

export function invalidateCityCache() { _lastCityFilter = null; }
export function invalidateDepCache() { _lastDepFilter = null; }

function openDrop(id) {
    document.getElementById(id)?.classList.add('open');
    if (id === 'dd-city') renderCityList('');
    if (id === 'dd-dep') renderDepList('');
    if (id === 'dd-place') renderPlaceList('');
}
function closeDrop(id) { document.getElementById(id)?.classList.remove('open'); }
function toggleDrop(id) { document.getElementById(id)?.classList.contains('open') ? closeDrop(id) : openDrop(id); }

// ── City dropdown ─────────────────────────────────────────────
export function renderCityList(filter) {
    const list = document.getElementById('city-list'); if (!list) return;
    const q = (filter || '').toLowerCase();
    const selId = state.selectedCity ? state.selectedCity.id : null;

    if (_lastCityFilter === q && _lastSelectedCityId === selId && list.innerHTML.trim() !== '') {
        return;
    }

    const filtered = state.CITIES.filter(c => c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q));
    if (!filtered.length) {
        list.innerHTML = `<div class="dd-empty">${state.CITIES.length === 0 ? 'Chưa có dữ liệu — Backend chưa kết nối' : 'Không tìm thấy thành phố'}</div>`;
        return;
    }
    const raw = filtered.map(c => {
        const isSel = state.selectedCity?.id === c.id;
        return `<div class="dd-item${isSel ? ' sel' : ''}" data-city-id="${c.id}">
          <img class="di-img" src="${c.img}" width="40" height="30" onerror="this.onerror=null;this.style.background='${c.color}';this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='" alt="${c.name}" style="background:${c.color}">
          <div class="di-info"><div class="di-name">${c.name}</div><div class="di-sub">${c.sub}</div></div>
          ${isSel ? '<span class="di-check">✓</span>' : ''}
        </div>`;
    }).join('');
    list.innerHTML = raw;
    _lastCityFilter = q;
    _lastSelectedCityId = selId;
}

export function renderDepList(filter) {
    const list = document.getElementById('dep-list'); if (!list) return;
    const q = (filter || '').toLowerCase();
    const selId = state.selectedDepCity ? state.selectedDepCity.id : null;

    if (_lastDepFilter === q && _lastSelectedDepId === selId && list.innerHTML.trim() !== '') {
        return;
    }

    const html = state.CITIES.filter(c => c.name.toLowerCase().includes(q))
        .map(c => `<div class="dd-item${state.selectedDepCity?.id === c.id ? ' sel' : ''}" data-dep-id="${c.id}">
            <img class="di-img" src="${c.img}" width="40" height="30" onerror="this.onerror=null;this.style.backgroundColor='${c.color}';this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='">
            <div class="di-info"><div class="di-name">${c.name}</div><div class="di-sub">${c.sub || 'Thành phố'}</div></div>
            ${state.selectedDepCity?.id === c.id ? '<span class="di-check">✓</span>' : ''}
          </div>`).join('');
    list.innerHTML = html;

    _lastDepFilter = q;
    _lastSelectedDepId = selId;
}

export function filterCities(val) {
    if (state.citySearchDebounceTimer) clearTimeout(state.citySearchDebounceTimer);
    state.citySearchDebounceTimer = setTimeout(() => renderCityList(val), 200);
}

export function selectCity(id) {
    const city = state.CITIES.find(c => c.id === id);
    if (!city) return;
    state.selectedCity = city; state.selectedPlaces = [];
    // Xóa cache để lần mở tiếp theo render lại với checkmark ✓ đúng vị trí
    invalidateCityCache();
    renderPlaceTags();
    const cs = document.getElementById('city-search'); if (cs) cs.value = city.name;
    renderCityList(''); // render lại để cập nhật trạng thái sel
    closeDrop('dd-city'); updateFromToDisplay();
    document.getElementById('err-city')?.classList.remove('show');
    const ps = document.getElementById('place-search'); if (ps) ps.value = '';
}

export function filterDepCities(val) {
    if (state.depSearchDebounceTimer) clearTimeout(state.depSearchDebounceTimer);
    state.depSearchDebounceTimer = setTimeout(() => renderDepList(val), 200);
}

export function selectDepCity(id) {
    const city = state.CITIES.find(c => c.id === id);
    if (!city) return;
    state.selectedDepCity = city;
    // Xóa cache để cập nhật checkmark ✓ cho dep dropdown
    invalidateDepCache();
    renderDepList('');
    const cs = document.getElementById('dep-search'); if (cs) cs.value = city.name;
    closeDrop('dd-dep'); updateDeparture();
}

function getAbbr(city) {
    if (city.abbr) return city.abbr;
    if (!city.name) return '—';

    // Xóa phần trong ngoặc đơn (VD: (Đà Lạt)) và các ký tự không phải chữ/khoảng trắng
    const cleanName = city.name.replace(/\(.*?\)/g, '').replace(/[^\p{L}\s]/gu, '').trim();
    const words = cleanName.split(/\s+/).filter(Boolean);

    // Nếu có tiền tố "TP", bỏ qua để lấy tên chính xác (VD: TP Hồ Chí Minh -> HCM)
    if (words.length > 0 && words[0].toUpperCase() === 'TP') {
        words.shift();
    }

    return words.map(w => w[0]).join('').toUpperCase().substring(0, 3);
}

export function updateFromToDisplay() {
    const toEl = document.getElementById('ft-to-city'), toSub = document.getElementById('ft-to-sub');
    if (state.selectedCity) { if (toEl) toEl.textContent = getAbbr(state.selectedCity); if (toSub) toSub.textContent = state.selectedCity.name; }
    else { if (toEl) toEl.textContent = '—'; if (toSub) toSub.textContent = 'Chọn thành phố bên dưới'; }
}

export function updateDeparture() {
    const fromEl = document.getElementById('ft-from-city'), fromSub = document.getElementById('ft-from-sub');
    if (!fromEl) return;
    if (state.selectedDepCity) {
        fromEl.textContent = getAbbr(state.selectedDepCity);
        if (fromSub) fromSub.textContent = state.selectedDepCity.name;
    } else {
        fromEl.textContent = '—';
        if (fromSub) fromSub.textContent = 'Chọn điểm xuất phát bên dưới';
    }
}

// ── Places dropdown ───────────────────────────────────────────
export function renderPlaceList(filter) {
    const list = document.getElementById('place-list'); if (!list) return;
    if (!state.selectedCity) { list.innerHTML = '<div class="dd-empty">Chọn thành phố trước</div>'; return; }
    const q = (filter || '').toLowerCase(), cityData = state.PLACES_BY_CITY[state.selectedCity.id];

    const selIds = state.selectedPlaces.map(p => typeof p === 'string' ? p : p.id);
    const selIdsStr = selIds.join(',');

    if (_lastPlaceFilter === q && _lastPlaceCityId === state.selectedCity.id && _lastSelectedPlacesIds === selIdsStr && list.innerHTML.trim() !== '' && !list.querySelector('.dd-empty')) {
        return;
    }

    let dtqItems = [], qaItems = [];
    if (Array.isArray(cityData)) {
        dtqItems = cityData.map(item => typeof item === 'string' ? { id: item, ten: item, tags: [], _loai: 'diem_tham_quan' } : { id: item.id || item.name, ten: item.name || item.ten, tags: item.tags || [], _loai: item.category || item.loai || 'diem_tham_quan' });
    } else if (cityData) {
        dtqItems = (cityData.diem_tham_quan || []).map(d => ({ ...d, _loai: 'diem_tham_quan' }));
        qaItems = (cityData.quan_an || []).map(q => ({ ...q, ten: q.ten_quan || q.ten, _loai: 'quan_an' }));
    }

    const ff = item => {
        const t = (item.ten || '').trim();
        return t && t.toLowerCase().includes(q) && !selIds.includes(item.id);
    };
    const fDTQ = dtqItems.filter(ff), fQA = qaItems.filter(ff);
    if (!fDTQ.length && !fQA.length) { list.innerHTML = '<div class="dd-empty">Không tìm thấy địa điểm</div>'; return; }
    let html = '';
    if (fDTQ.length) html += '<div class="dd-section-label">Điểm tham quan</div>' + fDTQ.map(renderPlaceItem).join('');
    if (fQA.length) html += '<div class="dd-section-label">Quán ăn</div>' + fQA.map(renderPlaceItem).join('');
    list.innerHTML = html;

    _lastPlaceFilter = q;
    _lastPlaceCityId = state.selectedCity.id;
    _lastSelectedPlacesIds = selIdsStr;
}

function renderPlaceItem(item) {
    const name = item.name || item.ten || item.ten_dia_diem || item.ten_quan || '';
    return `<div class="dd-item" data-place-id="${item.id}" data-place-name="${name}" data-place-loai="${item._loai || 'diem_tham_quan'}">
      <div class="di-info"><div class="di-name">${name || '<Không tên>'}</div><div class="di-sub">${state.selectedCity?.name || ''}</div></div>
    </div>`;
}

export function filterPlaces(val) {
    if (state.placeSearchDebounceTimer) clearTimeout(state.placeSearchDebounceTimer);
    state.placeSearchDebounceTimer = setTimeout(() => renderPlaceList(val), 200);
}

export function addPlace(id, name, loai) {
    if (!state.selectedCity) { showToast('Vui lòng chọn thành phố trước', 'error'); return; }
    if (state.selectedPlaces.length >= 10) { showToast('Chỉ được chọn tối đa 10 địa điểm', 'error'); return; }
    if (!state.selectedPlaces.some(p => (typeof p === 'string' ? p : p.id) === id)) {
        state.selectedPlaces.push({ id, ten: name, loai: loai || 'diem_tham_quan' });
        renderPlaceTags(); renderPlaceList('');
        const si = document.getElementById('place-search'); if (si) { si.value = ''; si.focus(); }
    }
}

export function removePlace(id) {
    state.selectedPlaces = state.selectedPlaces.filter(p => (typeof p === 'string' ? p : p.id) !== id);
    renderPlaceTags(); renderPlaceList('');
}

export function renderPlaceTags() {
    const box = document.getElementById('places-box'); if (!box) return;
    box.querySelectorAll('.tag').forEach(t => t.remove());
    const si = document.getElementById('place-search'); if (!si) return;
    state.selectedPlaces.forEach(p => {
        const displayName = typeof p === 'string' ? p : p.ten, placeId = typeof p === 'string' ? p : p.id;
        const tag = document.createElement('div'); tag.className = 'tag'; tag.textContent = displayName + ' ';
        const btn = document.createElement('button'); btn.className = 'tag-rm'; btn.textContent = '×';
        btn.addEventListener('click', e => { e.stopPropagation(); removePlace(placeId); });
        tag.appendChild(btn); box.insertBefore(tag, si);
    });
}

// ── Pax stepper ───────────────────────────────────────────────
export function adjustPax(delta) {
    const inp = document.getElementById('pax-val'); if (!inp) return;
    const v = Math.max(1, Math.min(50, parseInt(inp.value) + delta)); inp.value = v;
    const minus = document.getElementById('pax-minus'), plus = document.getElementById('pax-plus');
    if (minus) minus.disabled = v <= 1; if (plus) plus.disabled = v >= 50;
    updateBudgetPP();
}

// ── Dates ─────────────────────────────────────────────────────
export function validateDates() {
    const s = document.getElementById('date-start'), e = document.getElementById('date-end');
    const errS = document.getElementById('err-date-s'), errE = document.getElementById('err-date-e'), dur = document.getElementById('date-dur');
    if (!s || !e) return;
    [errS, errE].forEach(el => el?.classList.remove('show'));[s, e].forEach(el => el.classList.remove('err'));
    if (dur) dur.textContent = '';
    if (!s.value || !e.value) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ds = new Date(s.value), de = new Date(e.value); e.min = s.value;
    if (ds < today) { errS?.classList.add('show'); if (errS) errS.textContent = 'Ngày khởi hành không được ở quá khứ'; s.classList.add('err'); return; }
    const diff = Math.round((de - ds) / 864e5);
    if (diff < 0) { errE?.classList.add('show'); if (errE) errE.textContent = 'Ngày về phải sau hoặc bằng ngày đi'; e.classList.add('err'); return; }
    if (diff > 7) { errE?.classList.add('show'); if (errE) errE.textContent = `Tối đa 7 ngày (hiện tại: ${diff} ngày)`; e.classList.add('err'); return; }
    if (dur) dur.textContent = diff === 0 ? `${diff + 1} ngày (trong ngày)` : `${diff + 1} ngày ${diff} đêm`;
    updateBudgetPP();
}

export function getTripDays() {
    const ds = document.getElementById('date-start')?.value, de = document.getElementById('date-end')?.value;
    if (!ds || !de) return 1; return Math.max(1, Math.round((new Date(de) - new Date(ds)) / 864e5));
}

// ── Budget ────────────────────────────────────────────────────
export function formatBudget(inp) {
    const raw = inp.value.replace(/\D/g, ''); inp.value = raw ? parseInt(raw).toLocaleString('vi-VN') : '';
    document.querySelectorAll('.b-chip').forEach(c => c.classList.remove('on'));
    validateBudget(); updateBudgetPP();
}

export function setBudget(val, el) {
    document.querySelectorAll('.b-chip').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
    const bi = document.getElementById('budget-input'); if (bi) bi.value = parseInt(val).toLocaleString('vi-VN');
    validateBudget(); updateBudgetPP();
}

export function getRawBudget() {
    return parseInt((document.getElementById('budget-input')?.value || '0').replace(/\D/g, '')) || 0;
}

export function validateBudget() {
    const v = getRawBudget(), err = document.getElementById('err-budget'), inp = document.getElementById('budget-input');
    const pax = parseInt(document.getElementById('pax-val')?.value) || 1;
    const days = getTripDays();
    const minBudget = pax * days * 50_000;
    const lowBudget = pax * days * 200_000;
    const medBudget = pax * days * 500_000;

    if (v > 0) {
        err?.classList.add('show');
        if (v < minBudget) {
            if (err) { err.textContent = `Ngân sách quá thấp. Tối thiểu ${minBudget.toLocaleString('vi-VN')} ₫.`; err.style.color = 'var(--error)'; }
            inp?.classList.add('err');
        } else if (v < lowBudget) {
            if (err) { err.textContent = `Ngân sách thấp. Phù hợp du lịch tiết kiệm.`; err.style.color = '#f39c12'; }
            inp?.classList.remove('err');
        } else if (v < medBudget) {
            if (err) { err.textContent = `Ngân sách trung bình. Đáp ứng tốt các dịch vụ tiêu chuẩn.`; err.style.color = '#3498db'; }
            inp?.classList.remove('err');
        } else {
            err?.classList.remove('show');
            inp?.classList.remove('err');
        }
    } else {
        err?.classList.remove('show');
        inp?.classList.remove('err');
    }
}

export function updateBudgetPP() {
    const pax = parseInt(document.getElementById('pax-val')?.value) || 1, budget = getRawBudget(), el = document.getElementById('budget-pp');
    if (!el) return;
    if (budget && pax) { const pp = Math.round(budget / pax), days = getTripDays(), ppd = days > 1 ? ` · ~${Math.round(pp / days).toLocaleString('vi-VN')} ₫/người/ngày` : ''; el.textContent = `≈ ${pp.toLocaleString('vi-VN')} ₫/người${ppd}`; }
    else el.textContent = '';
}

// ── Preferences & notes ───────────────────────────────────────
export function togglePref(el, text) {
    el.classList.toggle('on');
    const active = Array.from(document.querySelectorAll('.p-chip.on')).map(c => c.dataset.pref || c.textContent.trim()).join(', ');
    const ta = document.getElementById('notes-input'); if (!ta) return;
    const filtered = ta.value.split('\n').filter(l => !l.startsWith('Sở thích:')).join('\n').trim();
    ta.value = active ? ('Sở thích: ' + active + (filtered ? '\n' + filtered : '')) : filtered;
    updateCharCount(ta, 'notes-count');
}

export function updateCharCount(el, id) {
    const len = el.value.length, max = parseInt(el.maxLength), c = document.getElementById(id); if (!c) return;
    c.textContent = `${len} / ${max}`; c.className = 'char-c' + (len >= max ? ' over' : len > max * .9 ? ' warn' : '');
}

// ── Reset ─────────────────────────────────────────────────────
export function doReset() {
    state.selectedCity = null; state.selectedPlaces = [];
    const cs = document.getElementById('city-search'); if (cs) cs.value = '';
    renderPlaceTags();
    ['dep-input', 'budget-input', 'notes-input'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
    const pv = document.getElementById('pax-val'); if (pv) pv.value = '1';
    const pm = document.getElementById('pax-minus'); if (pm) pm.disabled = true;
    document.querySelectorAll('.p-chip.on,.b-chip.on').forEach(c => c.classList.remove('on'));
    document.querySelectorAll('.f-err.show').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('.err').forEach(e => e.classList.remove('err'));
    ['notes-count', 'feedback-count'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '0 / 500'; });
    ['date-dur', 'budget-pp'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = ''; });
    ['ft-from-city', 'ft-to-city'].forEach(id => { const el = document.getElementById(id); if (el) el.textContent = '—'; });
    const fsub = document.getElementById('ft-from-sub'); if (fsub) fsub.textContent = 'Nhập điểm xuất phát bên dưới';
    const tsub = document.getElementById('ft-to-sub'); if (tsub) tsub.textContent = 'Chọn thành phố bên dưới';
    renderCityList(''); closePopup('popup-reset');
    showToast('Đã đặt lại tất cả thông tin', 'success');
}

export function renderItinerary(data) {
    const container = document.getElementById('itinerary-container');
    const p = window._lastPayload;

    if (!container) return;

    // Nếu chưa có dữ liệu hợp lệ
    if (!data || !data.output) {
        if (typeof MOCK_ITINERARY_HTML !== 'undefined') {
            container.innerHTML = window.DOMPurify ? DOMPurify.sanitize(MOCK_ITINERARY_HTML, { ADD_ATTR: ['onclick', 'target', 'style'] }) : MOCK_ITINERARY_HTML;
        } else {
            container.innerHTML = '<div style="padding:20px;text-align:center;color:var(--sub);">Đang chờ dữ liệu lịch trình từ máy chủ...</div>';
        }
        return;
    }

    const aiOut = data.output;
    const ttc = aiOut.Thong_tin_chung || {};

    // 1. Cập nhật Thông tin chung
    const titleEl = document.getElementById('res-title');
    if (titleEl) titleEl.textContent = ttc.Ten_hanh_trinh || (p ? `Hành trình ${p.city_name}` : 'Hành trình gợi ý');

    if (p && p.date_start && p.date_end) {
        const datesEl = document.getElementById('res-dates');
        if (datesEl) datesEl.innerHTML = `<strong>${p.date_start.split('-').reverse().join('/')} – ${p.date_end.split('-').reverse().join('/')}</strong>`;
    }

    const weatherEl = document.getElementById('res-weather');
    if (weatherEl) {
        const city = p?.city_name || '';
        let weather = 'Nắng, 31°C';
        if (city.includes('Đà Lạt') || city.includes('Lâm Đồng')) weather = 'Mát mẻ, 19°C';
        else if (city.includes('Hà Nội')) weather = 'Nắng nhẹ, 28°C';
        else if (city.includes('Nha Trang') || city.includes('Phú Quốc')) weather = 'Nắng đẹp, 30°C';
        weatherEl.innerHTML = `<strong>${weather}</strong>`;
    }

    const paxEl = document.getElementById('res-pax');
    if (paxEl) paxEl.innerHTML = `<strong>${ttc.So_nguoi || (p ? p.pax + ' người' : 'N/A')}</strong>`;

    const be = document.getElementById('res-budget');
    if (be) be.innerHTML = `<strong>~${ttc.Tong_ngan_sach || (p ? new Intl.NumberFormat('vi-VN').format(p.budget) + ' ₫' : 'N/A')}</strong>`;

    const departureEl = document.getElementById('res-departure');
    if (departureEl) {
        const depCity = p?.dep_city_id ? state.CITIES.find(c => c.id === p.dep_city_id) : state.selectedDepCity;
        departureEl.innerHTML = `<strong>${depCity ? depCity.name : 'Hà Nội'}</strong>`;
    }

    const transportEl = document.getElementById('res-transport');
    if (transportEl) {
        transportEl.innerHTML = `<strong>${p?.transport || 'Tự chọn'}</strong>`;
    }

    const bestTimeEl = document.getElementById('res-best-time');
    if (bestTimeEl) {
        let bestTime = '';
        if (ttc.Goi_y_khoi_hanh) {
            // Đọc lời khuyên khởi hành trực tiếp từ AI gửi về
            bestTime = Array.isArray(ttc.Goi_y_khoi_hanh) ? ttc.Goi_y_khoi_hanh.join(', ') : ttc.Goi_y_khoi_hanh;
        } else if (p?.departure_time) {
            // Lớp dự phòng offline nếu AI/BE chưa tích hợp hoặc thiếu trường này
            const hr = parseInt(p.departure_time.split(':')[0]);
            if (hr >= 5 && hr <= 10) bestTime = `${p.departure_time} Sáng`;
            else if (hr > 10 && hr <= 14) bestTime = `${p.departure_time} Trưa`;
            else if (hr > 14 && hr <= 18) bestTime = `${p.departure_time} Chiều`;
            else bestTime = `${p.departure_time} Tối`;
        } else {
            bestTime = '08:00 Sáng';
        }
        bestTimeEl.innerHTML = `<strong>${bestTime}</strong>`;
    }

    const tb = document.getElementById('res-total-budget');
    if (tb) tb.textContent = ttc.Tong_ngan_sach || '';

    const pc = document.getElementById('res-places-count');
    if (pc) pc.textContent = ttc.total_places || '';

    const rd = document.getElementById('res-dist');
    if (rd) rd.textContent = ttc.total_distance || '';

    const bpp = document.getElementById('res-budget-pp');
    if (bpp) bpp.textContent = (ttc.Tong_ngan_sach / ttc.So_nguoi) || '--';



    // Cập nhật AIScore (không chèn inline vào title nữa, design mới hiển thị score trong .mag-score-row ở ngoài HTML)

    // 2. Render Lịch trình
    let html = '';
    const lichTrinh = aiOut.Lich_trinh || [];

    lichTrinh.forEach((dayData, dayIndex) => {
        const ds = p && p.date_start ? new Date(p.date_start) : new Date();
        ds.setDate(ds.getDate() + dayIndex);
        const dateStr = ds.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: '2-digit', day: '2-digit' });

        html += `<div class="timeline-day-group">
            <div class="timeline-track"></div>
            <div class="timeline-day-header">
                <div class="tdh-num">N${dayIndex + 1}</div>
                <div class="tdh-date">${dateStr} · ${dayData.length} điểm</div>
            </div>`;

        dayData.forEach((stop, stopIdx) => {
            const timeParts = (stop.Thoi_gian || "").split("-");
            const tStart = timeParts[0] ? timeParts[0].trim() : "";
            const isLast = stopIdx === dayData.length - 1;

            html += `<div class="timeline-stop">
                <div class="ts-time-col">
                    <div class="ts-time">${tStart || '--'}</div>
                    <div class="timeline-node"></div>
                </div>
                <div class="timeline-stop-card">
                    <h3 class="tsc-name"><a href="https://www.google.com/search?q=${encodeURIComponent(stop.Dia_diem)}" target="_blank">${stop.Dia_diem}</a></h3>
                    <p class="tsc-desc">${stop.Gioi_thieu || ''}</p>
                    <div class="tsc-tags">
                        <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ${stop.Thoi_luong || ''}</span>
                    </div>
                </div>
            </div>`;

            if (stop.Di_chuyen && !isLast) {
                html += `<div class="timeline-transport">
                    <span class="glow-text">DI CHUYỂN:</span> ${stop.Di_chuyen.Phuong_tien || ''} · ${stop.Di_chuyen.Khoang_cach || ''} · ~${stop.Di_chuyen.Thoi_gian_di_chuyen || ''}
                </div>`;
            }
        });
        html += `</div><!-- /timeline-day-group -->`;
    });

    // 3. Render Khách sạn — appended after itinerary inside .split-right
    const khachSan = aiOut.Khach_san_goi_y || [];
    if (khachSan.length > 0) {
        html += `<section class="res-accom-section">
            <div class="section-label">
                <span class="section-label-text">Gợi Ý Lưu Trú</span>
            </div>
            <div class="bionic-accom-grid">`;

        khachSan.forEach(ks => {
            html += `<div class="bionic-accom-card">
                <div class="rac-name">${ks.Ten}</div>
                <div class="rac-meta">
                    <div class="rac-rate"><span class="glow-text">${ks.rate || 'N/A'}</span> / 5.0</div>
                    <div class="rac-ai">Phù hợp <strong class="glow-text">${ks.AIScore || 'N/A'}</strong></div>
                </div>
                <div class="rac-price-wrap">
                    <div class="rac-price">${ks.Gia_tien || ''}</div>
                </div>
            </div>`;
        });
        html += `</div></section>`;
    }

    container.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html, { ADD_ATTR: ['target', 'style'] }) : html;

    // 4. Vẽ Lộ trình lên bản đồ nếu có dữ liệu map
    if (data.routing && typeof window.drawItinerary === 'function') {
        window.drawItinerary(data.routing);
    }
}

// ── initFormUIEvents — Task 9 (gọi từ main.js sau khi inject HTML) ──

export function initFormUIEvents({ onGenerate, onFeedback, onContinueFromError }) {
    // City dropdown
    const cityTrigger = document.getElementById('city-trigger');
    if (cityTrigger) cityTrigger.addEventListener('click', () => toggleDrop('dd-city'));
    const citySearch = document.getElementById('city-search');
    if (citySearch) {
        citySearch.addEventListener('click', e => e.stopPropagation());
        citySearch.addEventListener('input', e => filterCities(e.target.value));
        citySearch.addEventListener('focus', () => openDrop('dd-city'));
        citySearch.addEventListener('blur', () => setTimeout(() => closeDrop('dd-city'), 200));
    }
    // City list: event delegation for selectCity
    document.getElementById('city-list')?.addEventListener('mousedown', e => {
        const item = e.target.closest('[data-city-id]');
        if (item) {
            e.preventDefault(); // Prevent input blur
            selectCity(item.dataset.cityId);
        }
    });

    // Places dropdown
    const placesBox = document.getElementById('places-box');
    if (placesBox) placesBox.addEventListener('click', () => document.getElementById('place-search')?.focus());
    const placeSearch = document.getElementById('place-search');
    if (placeSearch) {
        placeSearch.addEventListener('input', e => filterPlaces(e.target.value));
        placeSearch.addEventListener('focus', () => openDrop('dd-place'));
        placeSearch.addEventListener('blur', () => setTimeout(() => closeDrop('dd-place'), 200));
    }
    // Place list: event delegation for addPlace
    document.getElementById('place-list')?.addEventListener('mousedown', e => {
        const item = e.target.closest('[data-place-id]');
        if (item) {
            e.preventDefault(); // Prevent input blur
            addPlace(item.dataset.placeId, item.dataset.placeName, item.dataset.placeLoai);
        }
    });

    // Dep dropdown
    const depTrigger = document.getElementById('dep-trigger');
    if (depTrigger) depTrigger.addEventListener('click', () => toggleDrop('dd-dep'));
    const depSearch = document.getElementById('dep-search');
    if (depSearch) {
        depSearch.addEventListener('click', e => e.stopPropagation());
        depSearch.addEventListener('input', e => filterDepCities(e.target.value));
        depSearch.addEventListener('focus', () => openDrop('dd-dep'));
        depSearch.addEventListener('blur', () => setTimeout(() => closeDrop('dd-dep'), 200));
    }
    document.getElementById('dep-list')?.addEventListener('mousedown', e => {
        const item = e.target.closest('[data-dep-id]');
        if (item) {
            e.preventDefault();
            selectDepCity(item.dataset.depId);
        }
    });

    // Pax
    document.getElementById('pax-minus')?.addEventListener('click', () => adjustPax(-1));
    document.getElementById('pax-plus')?.addEventListener('click', () => adjustPax(1));

    // Custom dropdown logic (Transport & Accom)
    const setupCustomDropdown = (wrapId, triggerId, inputId, listId) => {
        const wrap = document.getElementById(wrapId);
        const trigger = document.getElementById(triggerId);
        const input = document.getElementById(inputId);
        const list = document.getElementById(listId);
        if (!wrap || !trigger || !input || !list) return;

        trigger.addEventListener('mousedown', (e) => {
            e.preventDefault();
            const isOpen = wrap.classList.contains('open');
            document.querySelectorAll('.dd-wrap.open').forEach(el => el.classList.remove('open'));
            if (!isOpen) wrap.classList.add('open');
            else wrap.classList.remove('open');
        });

        list.addEventListener('mousedown', (e) => {
            const item = e.target.closest('.dd-item');
            if (item) {
                e.preventDefault();
                input.setAttribute('readonly', 'true');
                input.value = item.dataset.val;
                input.style.cursor = 'pointer';
                list.querySelectorAll('.dd-item.sel').forEach(el => el.classList.remove('sel'));
                item.classList.add('sel');
                wrap.classList.remove('open');
            }
        });

        // Close when clicking outside
        input.addEventListener('blur', () => setTimeout(() => wrap.classList.remove('open'), 200));
    };

    setupCustomDropdown('dd-transport', 'transport-trigger', 'transport-type', 'transport-list');
    setupCustomDropdown('dd-accom', 'accom-trigger', 'accommodation-type', 'accom-list');

    // Dates
    ['date-start', 'date-end', 'time-start', 'time-end'].forEach(id => document.getElementById(id)?.addEventListener('change', validateDates));

    // Budget chips: event delegation on .budget-chips
    document.querySelector('.budget-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('[data-budget]'); if (chip) setBudget(chip.dataset.budget, chip);
    });
    const budgetInput = document.getElementById('budget-input');
    if (budgetInput) { budgetInput.addEventListener('input', () => formatBudget(budgetInput)); budgetInput.addEventListener('blur', validateBudget); }

    // Also revalidate budget when pax changes
    document.getElementById('pax-minus')?.addEventListener('click', validateBudget);
    document.getElementById('pax-plus')?.addEventListener('click', validateBudget);

    // Preference chips: event delegation on #pref-chips
    document.getElementById('pref-chips')?.addEventListener('click', e => {
        const chip = e.target.closest('[data-pref]'); if (chip) togglePref(chip, chip.dataset.pref);
    });

    // Notes
    const notesInput = document.getElementById('notes-input');
    if (notesInput) notesInput.addEventListener('input', () => updateCharCount(notesInput, 'notes-count'));

    // Reset button + popup
    document.getElementById('btn-reset')?.addEventListener('click', () => showPopup('popup-reset'));
    document.getElementById('btn-do-reset')?.addEventListener('click', doReset);
    document.querySelector('#popup-reset .popup-cancel')?.addEventListener('click', () => closePopup('popup-reset'));
    document.getElementById('popup-reset')?.addEventListener('click', e => { if (e.target === e.currentTarget) closePopup('popup-reset'); });

    // Generate
    document.getElementById('btn-gen')?.addEventListener('click', (e) => {
        e.preventDefault();
        if (onGenerate) onGenerate(e);
    });

    // Loading screen
    document.getElementById('btn-loading-cancel')?.addEventListener('click', () => {
        if (window._mockLoadingInterval) clearInterval(window._mockLoadingInterval);
        showScreen('form');
    });

    // Result screen buttons
    document.getElementById('btn-edit-req')?.addEventListener('click', () => showScreen('form'));
    document.getElementById('btn-save-plan')?.addEventListener('click', () => showPopup('popup-login'));
    document.getElementById('btn-back-to-form')?.addEventListener('click', () => showScreen('form'));
    document.getElementById('btn-continue-error')?.addEventListener('click', onContinueFromError);
    document.getElementById('btn-close-map')?.addEventListener('click', () => closePopup('popup-map'));

    // Feedback
    const feedbackInput = document.getElementById('feedback-input');
    if (feedbackInput) feedbackInput.addEventListener('input', () => updateCharCount(feedbackInput, 'feedback-count'));
    document.getElementById('btn-feedback')?.addEventListener('click', onFeedback);
}
