// --- Screen switching ---
function showScreen(name) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const target = document.getElementById('screen-' + name);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (name === 'result') {
        setTimeout(initLeafletMap, 150);
        // Gắn sự kiện click cho các hotel card
        attachHotelClickEvents();
    }
}

// Gắn sự kiện click cho hotel card
function attachHotelClickEvents() {
    const hotelCards = document.querySelectorAll('.hotel-c-card');
    hotelCards.forEach(card => {
        // Xóa event cũ nếu có
        card.removeEventListener('click', handleHotelClick);
        card.addEventListener('click', handleHotelClick);
    });
}

function handleHotelClick(event) {
    // Ngăn không cho click vào button bên trong (nếu có) nhưng hiện tại không có button
    // Lấy data-hotel từ thẻ
    const hotelData = JSON.parse(this.getAttribute('data-hotel'));
    if (hotelData && leafletMapInstance) {
        // Xóa marker cũ nếu có
        if (currentHotelMarker) {
            leafletMapInstance.removeLayer(currentHotelMarker);
        }
        // Tạo marker mới
        const hotelIcon = L.divIcon({
            className: '',
            html: `<div style="background:${hotelData.color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);">🏨</div>`,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
        currentHotelMarker = L.marker([hotelData.lat, hotelData.lng], { icon: hotelIcon })
            .addTo(leafletMapInstance)
            .bindPopup(`<strong>${hotelData.name}</strong><br>📍 Đã chọn`)
            .openPopup();
        // Di chuyển map đến hotel
        leafletMapInstance.setView([hotelData.lat, hotelData.lng], 15);
        showToast(`Đã định vị ${hotelData.name} trên bản đồ`, 'success');
    }
}

// --- Dropdowns ---
function openDrop(id) {
    document.getElementById(id).classList.add('open');
    if (id === 'dd-city') renderCityList('');
    if (id === 'dd-place') renderPlaceList('');
}
function closeDrop(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}
function toggleDrop(id) {
    const el = document.getElementById(id);
    el.classList.contains('open') ? closeDrop(id) : openDrop(id);
}

// --- City selection with debounce to reduce lag ---
function renderCityList(filter) {
    const list = document.getElementById('city-list');
    if (!list) return;
    const q = (filter || '').toLowerCase();
    const filtered = CITIES.filter(c =>
        c.name.toLowerCase().includes(q) || c.sub.toLowerCase().includes(q)
    );
    if (!filtered.length) {
        list.innerHTML = '<div class="dd-empty">Không tìm thấy thành phố</div>';
        return;
    }
    list.innerHTML = filtered.map(c => {
        const isSel = selectedCity && selectedCity.id === c.id;
        return `<div class="dd-item ${isSel ? 'sel' : ''}" onclick="selectCity('${c.id}')">
      <img class="di-img" src="${c.img}"
           onerror="this.style.background='${c.color}';this.removeAttribute('src')"
           alt="${c.name}" style="background:${c.color}">
      <div class="di-info">
        <div class="di-name">${c.name}</div>
        <div class="di-sub">${c.sub}</div>
      </div>
      ${isSel ? '<span class="di-check">✓</span>' : ''}
    </div>`;
    }).join('');
}

function filterCitiesDebounced(val) {
    if (citySearchDebounceTimer) clearTimeout(citySearchDebounceTimer);
    citySearchDebounceTimer = setTimeout(() => {
        renderCityList(val);
    }, 200);
}
function filterCities(val) { filterCitiesDebounced(val); }

function selectCity(id) {
    const city = CITIES.find(c => c.id === id);
    if (!city) return;
    selectedCity = city;
    // Clear selected places when city changes
    selectedPlaces = [];
    renderPlaceTags();
    renderCityList(document.getElementById('city-search').value);
    document.getElementById('city-search').value = city.name;
    closeDrop('dd-city');
    updateFromToDisplay();
    document.getElementById('err-city').classList.remove('show');
    // Clear place search input
    const placeSearch = document.getElementById('place-search');
    if (placeSearch) placeSearch.value = '';
}

function updateFromToDisplay() {
    const toEl = document.getElementById('ft-to-city');
    const toSubEl = document.getElementById('ft-to-sub');
    if (selectedCity) {
        toEl.textContent = selectedCity.abbr;
        toSubEl.textContent = selectedCity.name;
    } else {
        toEl.textContent = '—';
        toSubEl.textContent = 'Chọn thành phố bên dưới';
    }
}

function updateDeparture(val) {
    const fromEl = document.getElementById('ft-from-city');
    const fromSubEl = document.getElementById('ft-from-sub');
    if (!fromEl) return;
    if (val && val.trim()) {
        const detected = detectDepartureCity(val);
        if (detected) {
            fromEl.textContent = detected.code;
            fromSubEl.textContent = detected.name;
        } else {
            const short = val.split(',')[0].trim().split(' ').slice(-2).join(' ');
            fromEl.textContent = short.length > 9 ? short.substring(0, 8) + '…' : short;
            fromSubEl.textContent = val.length > 32 ? val.substring(0, 32) + '…' : val;
        }
    } else {
        fromEl.textContent = '—';
        fromSubEl.textContent = 'Nhập điểm xuất phát bên dưới';
    }
}

// --- Places selection (FIXED: click chọn option update đúng) ---
function renderPlaceList(filter) {
    const list = document.getElementById('place-list');
    if (!list) return;
    if (!selectedCity) {
        list.innerHTML = '<div class="dd-empty">Chọn thành phố trước</div>';
        return;
    }
    const q = (filter || '').toLowerCase();
    const allPlaces = (PLACES_BY_CITY[selectedCity.id] || []);
    const filtered = allPlaces.filter(p => {
        const placeName = typeof p === 'string' ? p : p.name;
        return placeName.toLowerCase().includes(q) && !selectedPlaces.includes(placeName);
    });
    if (!filtered.length) {
        list.innerHTML = '<div class="dd-empty">Không tìm thấy địa điểm</div>';
        return;
    }
    list.innerHTML = filtered.map(p =>
        `<div class="dd-item" onclick="addPlace('${p.replace(/'/g, "\\'")}')">
      <div class="di-info">
        <div class="di-name">${p}</div>
        <div class="di-sub">${selectedCity.name}</div>
      </div>
    </div>`
    ).join('');
}

function filterPlacesDebounced(val) {
    if (placeSearchDebounceTimer) clearTimeout(placeSearchDebounceTimer);
    placeSearchDebounceTimer = setTimeout(() => {
        renderPlaceList(val);
    }, 200);
}
function filterPlaces(val) { filterPlacesDebounced(val); }

function addPlace(name) {
    if (!selectedCity) {
        showToast('Vui lòng chọn thành phố trước', 'error');
        return;
    }
    if (selectedPlaces.length >= 10) {
        showToast('Chỉ được chọn tối đa 10 địa điểm', 'error');
        return;
    }
    if (!selectedPlaces.includes(name)) {
        selectedPlaces.push(name);
        renderPlaceTags();
        renderPlaceList(''); // refresh dropdown to remove added place
        // Clear search input
        const searchInput = document.getElementById('place-search');
        if (searchInput) searchInput.value = '';
        // Đóng dropdown sau khi chọn (tùy chọn)
        closeDrop('dd-place');
    }
}

function removePlace(name) {
    selectedPlaces = selectedPlaces.filter(p => p !== name);
    renderPlaceTags();
    renderPlaceList(''); // refresh dropdown to show removed place again
}

function renderPlaceTags() {
    const box = document.getElementById('places-box');
    if (!box) return;
    // Remove all existing tags (but keep the search input)
    const existingTags = box.querySelectorAll('.tag');
    existingTags.forEach(tag => tag.remove());

    const searchInput = document.getElementById('place-search');
    if (!searchInput) return;

    // Add tags before the search input
    selectedPlaces.forEach(p => {
        const tag = document.createElement('div');
        tag.className = 'tag';
        tag.innerHTML = `${p} <button class="tag-rm" onclick="event.stopPropagation();removePlace('${p.replace(/'/g, "\\'")}')">×</button>`;
        box.insertBefore(tag, searchInput);
    });
}

// --- Pax stepper ---
function adjustPax(delta) {
    const inp = document.getElementById('pax-val');
    let v = parseInt(inp.value) + delta;
    v = Math.max(1, Math.min(50, v));
    inp.value = v;
    document.getElementById('pax-minus').disabled = v <= 1;
    document.getElementById('pax-plus').disabled = v >= 50;
    updateBudgetPP();
}

// --- Date validation (tối đa 7 ngày, cho phép cùng ngày) ---
(function initDates() {
    const today = new Date();
    const fmt = d => d.toISOString().split('T')[0];
    const s = document.getElementById('date-start');
    const e = document.getElementById('date-end');
    if (!s || !e) return;
    s.min = fmt(today);
    const def = new Date(today); def.setDate(def.getDate() + 3);
    s.value = fmt(def);
    const defE = new Date(def); defE.setDate(defE.getDate() + 2);
    e.value = fmt(defE);
    e.min = s.value;
    validateDates();
})();

function validateDates() {
    const s = document.getElementById('date-start');
    const e = document.getElementById('date-end');
    const errS = document.getElementById('err-date-s');
    const errE = document.getElementById('err-date-e');
    const dur = document.getElementById('date-dur');
    if (!s || !e) return;
    errS.classList.remove('show'); errE.classList.remove('show');
    s.classList.remove('err'); e.classList.remove('err');
    dur.textContent = '';
    if (!s.value || !e.value) return;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ds = new Date(s.value);
    const de = new Date(e.value);
    e.min = s.value;
    if (ds < today) {
        errS.classList.add('show');
        errS.textContent = 'Ngày khởi hành không được ở quá khứ';
        s.classList.add('err');
        return;
    }
    const diff = Math.round((de - ds) / 864e5);
    if (diff < 0) {
        errE.classList.add('show');
        errE.textContent = 'Ngày về phải sau hoặc bằng ngày đi';
        e.classList.add('err');
        return;
    }
    // CONSTRAINT: tối đa 7 ngày
    if (diff > 7) {
        errE.classList.add('show');
        errE.textContent = `Tối đa 7 ngày (hiện tại: ${diff} ngày)`;
        e.classList.add('err');
        return;
    }
    // Nếu cùng ngày, kiểm tra giờ
    if (diff === 0) {
        const timeStart = document.getElementById('time-start').value;
        const timeEnd = document.getElementById('time-end').value;
        if (timeStart && timeEnd && timeEnd <= timeStart) {
            errE.classList.add('show');
            errE.textContent = 'Giờ kết thúc phải sau giờ khởi hành trong cùng ngày';
            e.classList.add('err');
            return;
        }
        dur.textContent = `✓ ${diff + 1} ngày (trong ngày)`;
    } else {
        dur.textContent = `✓ ${diff} ngày ${diff - 1} đêm`;
    }
    updateBudgetPP();
}

// --- Budget ---
function formatBudget(inp) {
    const raw = inp.value.replace(/\D/g, '');
    inp.value = raw ? parseInt(raw).toLocaleString('vi-VN') : '';
    document.querySelectorAll('.b-chip').forEach(c => c.classList.remove('on'));
    validateBudget();
    updateBudgetPP();
}

function setBudget(val, el) {
    document.querySelectorAll('.b-chip').forEach(c => c.classList.remove('on'));
    el.classList.add('on');
    document.getElementById('budget-input').value = parseInt(val).toLocaleString('vi-VN');
    validateBudget();
    updateBudgetPP();
}

function getRawBudget() {
    return parseInt((document.getElementById('budget-input').value || '0').replace(/\D/g, '')) || 0;
}

function validateBudget() {
    const v = getRawBudget();
    const err = document.getElementById('err-budget');
    const inp = document.getElementById('budget-input');
    if (v > 0 && v < 100_000) {
        err.classList.add('show');
        err.textContent = 'Tối thiểu 100.000 ₫';
        inp.classList.add('err');
    } else {
        err.classList.remove('show');
        inp.classList.remove('err');
    }
}

function updateBudgetPP() {
    const pax = parseInt(document.getElementById('pax-val').value) || 1;
    const budget = getRawBudget();
    const el = document.getElementById('budget-pp');
    if (!el) return;
    const days = getTripDays();
    if (budget && pax) {
        const pp = Math.round(budget / pax);
        const ppd = days > 1 ? ` · ~${Math.round(pp / days).toLocaleString('vi-VN')} ₫/người/ngày` : '';
        el.textContent = `≈ ${pp.toLocaleString('vi-VN')} ₫/người${ppd}`;
    } else {
        el.textContent = '';
    }
}

function getTripDays() {
    const ds = document.getElementById('date-start').value;
    const de = document.getElementById('date-end').value;
    if (!ds || !de) return 1;
    const diff = Math.max(1, Math.round((new Date(de) - new Date(ds)) / 864e5));
    return diff;
}

// --- Preferences ---
function togglePref(el, text) {
    el.classList.toggle('on');
    const active = Array.from(document.querySelectorAll('.p-chip.on')).map(c => c.textContent).join(', ');
    const ta = document.getElementById('notes-input');
    const filtered = ta.value.split('\n').filter(l => !l.startsWith('Sở thích:')).join('\n').trim();
    ta.value = active ? ('Sở thích: ' + active + (filtered ? '\n' + filtered : '')) : filtered;
    updateCharCount(ta, 'notes-count');
}

function updateCharCount(el, id) {
    const len = el.value.length;
    const max = parseInt(el.maxLength);
    const c = document.getElementById(id);
    if (!c) return;
    c.textContent = `${len} / ${max}`;
    c.className = 'char-c' + (len >= max ? ' over' : len > max * 0.9 ? ' warn' : '');
}

// --- Sanitize textarea input ---
function sanitizeText(text) {
    // Remove any HTML tags, trim, and limit length
    let sanitized = text.replace(/<[^>]*>/g, '').trim();
    if (sanitized.length > 500) sanitized = sanitized.substring(0, 500);
    return sanitized;
}

// --- Reset form ---
function doReset() {
    selectedCity = null;
    selectedPlaces = [];
    document.getElementById('city-search').value = '';
    renderPlaceTags();
    document.getElementById('dep-input').value = '';
    document.getElementById('pax-val').value = '1';
    document.getElementById('pax-minus').disabled = true;
    document.getElementById('pax-plus').disabled = false;
    document.getElementById('budget-input').value = '';
    document.getElementById('notes-input').value = '';
    document.querySelectorAll('.p-chip.on').forEach(c => c.classList.remove('on'));
    document.querySelectorAll('.b-chip.on').forEach(c => c.classList.remove('on'));
    document.querySelectorAll('.f-err.show').forEach(e => e.classList.remove('show'));
    document.querySelectorAll('.err').forEach(e => e.classList.remove('err'));
    document.getElementById('notes-count').textContent = '0 / 500';
    document.getElementById('date-dur').textContent = '';
    document.getElementById('budget-pp').textContent = '';
    document.getElementById('ft-from-city').textContent = '—';
    document.getElementById('ft-from-sub').textContent = 'Nhập điểm xuất phát bên dưới';
    document.getElementById('ft-to-city').textContent = '—';
    document.getElementById('ft-to-sub').textContent = 'Chọn thành phố bên dưới';
    renderCityList('');
    closePopup('popup-reset');
    showToast('✓ Đã đặt lại tất cả thông tin', 'success');
}

function handleSave() { showPopup('popup-login'); }

function handleFeedback() {
    let val = document.getElementById('feedback-input').value.trim();
    if (!val) { showToast('Vui lòng nhập phản hồi', 'error'); return; }
    if (val.length > 500) { showToast('Phản hồi tối đa 500 ký tự', 'error'); return; }
    // Sanitize feedback
    val = sanitizeText(val);
    
    if (isNonsensicalText(val)) {
        showToast('Nội dung phản hồi có vẻ không rõ ràng hoặc thiếu thông tin hữu ích. Hệ thống vẫn ghi nhận nhưng AI có thể không hiểu đúng ý bạn.', 'warning');
    }

    const btn = document.querySelector('.btn-feedback');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang cập nhật...'; }
    sendFeedback(val)
        .then(() => { })
        .catch(() => { });
    setTimeout(() => {
        showToast('✅ Lịch trình đã được cập nhật theo phản hồi', 'success');
        document.getElementById('feedback-input').value = '';
        document.getElementById('feedback-count').textContent = '0 / 500';
        if (btn) { btn.disabled = false; btn.textContent = 'Cập nhật lịch trình'; }
    }, 2500);
}

function showPopup(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
}
function closePopup(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
}

document.querySelectorAll('.popup-ov').forEach(o => {
    o.addEventListener('click', e => { if (e.target === o) o.classList.remove('open'); });
});

let toastT;
function showToast(msg, type) {
    const t = document.getElementById('toast');
    const tm = document.getElementById('toast-msg');
    if (!t || !tm) return;
    tm.textContent = msg;
    t.className = 'toast show' + (type ? ' ' + type : '');
    clearTimeout(toastT);
    const duration = type === 'error' ? 4500 : type === 'warning' ? 5000 : 3200;
    toastT = setTimeout(() => { t.className = 'toast'; }, duration);
}

// ============================================================
