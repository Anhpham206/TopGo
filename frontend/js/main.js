/* 
  ========================================================================
  FILE: main.js
  CHỨC NĂNG: 
  - Entry point (tệp thực thi chính) cho quy trình Lên lịch trình (index.html).
  - Bootstrap ứng dụng: Tải các HTML Fragments (loading, result) và nhúng vào DOM khi khởi tạo (\`initApp\`).
  - Phối hợp và kiểm soát luồng dữ liệu chính: Lấy dữ liệu danh mục ban đầu (Cities, Places), thiết lập giá trị mặc định cho Form.
  - Xử lý các sự kiện nghiệp vụ lõi: 
    + \`handleGenerate\`: Gửi yêu cầu phân tích lịch trình (chạy hàm Validate toàn diện, gọi API backend, quản lý Loading, chuyển sang Result).
    + \`handleFeedback\`: Gửi phản hồi (feedback) sau khi lịch trình được tạo.
  - Quản lý hiệu ứng quá trình Loading đa bước.
  ========================================================================
*/
import { state } from './data.js';
import { detectDepartureCity }              from './data.js';
import { runComprehensiveValidation, sanitizeText, isNonsensicalText } from './utils.js';
import { fetchCities, fetchPlaces, generateItinerary, sendFeedback }   from './api.js';
import { initLeafletMap }                   from './map.js';
import {
    showScreen, renderCityList, renderDepList, renderItinerary,
    updateDeparture, getRawBudget, validateDates, updateBudgetPP,
    initFormUIEvents
} from './ui.js';
import { showToast, showPopup, closePopup } from './shared.js';
import { fetchHtmlFragment } from './fragmentLoader.js';
// shared.js auto-runs loadSharedComponents() on import — header/footer loaded.

// ── Data loading ──────────────────────────────────────────────

async function loadData() {
    const [cData, pData] = await Promise.all([fetchCities(), fetchPlaces()]);
    state.CITIES        = cData;
    state.PLACES_BY_CITY = pData;

    if (!state.CITIES.length || !Object.keys(state.PLACES_BY_CITY).length) {
        showToast('Không thể kết nối máy chủ. Đang dùng dữ liệu mẫu.', 'warning');
        const btn = document.getElementById('btn-gen');
        if (btn) { btn.disabled = true; btn.title = 'Cần kết nối Backend'; }
    }

    renderCityList('');
    renderDepList('');

    const hn = state.CITIES.find(c=>c.id==='ha_noi');
    if (hn) {
        state.selectedDepCity = hn;
        const depSearch = document.getElementById('dep-search');
        if (depSearch) depSearch.value = hn.name;
        updateDeparture();
    }

    _initDefaultDates();
}

function _initDefaultDates() {
    const s = document.getElementById('date-start');
    const e = document.getElementById('date-end');
    if (!s || !e) return;
    const fmt = d => d.toISOString().split('T')[0];
    const today = new Date();
    s.min = fmt(today);
    const def = new Date(today); def.setDate(def.getDate() + 3);
    s.value = fmt(def);
    const defE = new Date(def); defE.setDate(defE.getDate() + 2);
    e.value = fmt(defE); e.min = s.value;
    validateDates();
}

// ── Business logic handlers ───────────────────────────────────

function handleGenerate() {
    let valid = true;
    if (!state.selectedCity) { document.getElementById('err-city')?.classList.add('show'); valid = false; }
    const budget = getRawBudget();
    if (!budget || budget < 100_000) {
        document.getElementById('err-budget')?.classList.add('show');
        document.getElementById('budget-input')?.classList.add('err');
        valid = false;
    }
    const rawNotes    = document.getElementById('notes-input')?.value || '';
    const trimmedNotes = rawNotes.trim();
    const errNotes    = document.getElementById('err-notes');
    errNotes?.classList.remove('show');
    if (!trimmedNotes || trimmedNotes.length < 5) {
        if (errNotes) { errNotes.textContent = trimmedNotes ? 'Nội dung quá ngắn (tối thiểu 5 ký tự).' : 'Vui lòng nhập mô tả sở thích hoặc ghi chú.'; errNotes.classList.add('show'); }
        valid = false;
    }
    if (!valid) {
        showToast('Vui lòng kiểm tra lại các trường bắt buộc', 'error');
        document.querySelector('.f-err.show')?.scrollIntoView({behavior:'smooth',block:'center'});
        return;
    }

    const transport   = document.getElementById('transport-type')?.value;
    const payload = {
        city_id:       state.selectedCity.id,
        city_name:     state.selectedCity.name,
        dep_city_id:   state.selectedDepCity?.id || null,
        budget,
        pax:           parseInt(document.getElementById('pax-val')?.value),
        date_start:    document.getElementById('date-start')?.value,
        date_end:      document.getElementById('date-end')?.value,
        notes:         sanitizeText(rawNotes),
        transport,
        accommodation: document.getElementById('accommodation-type')?.value,
        departure_time:document.getElementById('time-start')?.value,
        return_time:   document.getElementById('time-end')?.value,
        places: state.selectedPlaces.map(p => typeof p==='string' ? {id:p,ten:p,loai:'diem_tham_quan'} : {id:p.id,ten:p.ten,loai:p.loai}),
    };

    const validation = runComprehensiveValidation(payload);
    if (validation.errors.length) {
        _showValidationErrors(validation.errors, validation.continueAllowed, payload);
        return;
    }

    const tripId = 'AI·' + Math.random().toString(36).substr(2,4).toUpperCase() + '·' + new Date().getFullYear();
    const tripEl = document.getElementById('tb-trip-id');
    if (tripEl) tripEl.textContent = 'TRIP — ' + tripId;
    window._lastPayload = payload;

    showScreen('loading');
    resetLoadingSteps();

    generateItinerary(payload)
        .then(data => {
            if (data.status === 'error') { _showBackendError(data, payload); }
            else { renderItinerary(data.status === 'success' ? data.itinerary : null); animateLoading(true); }
        })
        .catch(() => { renderItinerary(null); animateLoading(true); });
}

function _showValidationErrors(errors, continueAllowed, payload) {
    const el = document.getElementById('error-issues');
    if (el) el.innerHTML = errors.map(e => `<div class="error-issue${e.type==='warning'?' warning-issue':''}">${e.msg}</div>`).join('');
    const btn = document.getElementById('btn-continue-error');
    if (btn) btn.style.display = continueAllowed ? 'inline-flex' : 'none';
    window._continueAllowed = continueAllowed;
    window._lastPayload = payload;
    showScreen('error');
}

function _showBackendError(data, payload) {
    const el = document.getElementById('error-issues');
    if (el) { const html = (data.errors||[]).map(e=>`<div class="error-issue">${e}</div>`).join(''); el.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html) : html; }
    const btn = document.getElementById('btn-continue-error');
    if (btn) btn.style.display = data.continue_allowed ? 'inline-flex' : 'none';
    window._continueAllowed = data.continue_allowed;
    window._lastPayload = payload;
    showScreen('error');
}

function handleContinueFromError() {
    if (window._continueAllowed) { renderItinerary(null); showScreen('result'); setTimeout(initLeafletMap, 150); }
    else showScreen('form');
}

async function handleFeedback() {
    const inp = document.getElementById('feedback-input');
    let val = inp?.value.trim() || '';
    if (!val) { showToast('Vui lòng nhập phản hồi', 'error'); return; }
    if (val.length > 500) { showToast('Phản hồi tối đa 500 ký tự', 'error'); return; }
    val = sanitizeText(val);
    if (isNonsensicalText(val)) showToast('Nội dung phản hồi không rõ ràng. AI có thể không hiểu đúng.', 'warning');
    const btn = document.querySelector('.btn-feedback');
    if (btn) { btn.disabled = true; btn.textContent = '⏳ Đang cập nhật...'; }
    try {
        await sendFeedback(val);
        showToast('Lịch trình đã được cập nhật theo phản hồi', 'success');
    } catch {
        showToast('Không thể kết nối máy chủ. Phản hồi đã được ghi lại cục bộ.', 'warning');
    } finally {
        if (inp) inp.value = ''; if (btn) { btn.disabled = false; btn.textContent = 'Cập nhật lịch trình'; }
        document.getElementById('feedback-count').textContent = '0 / 500';
    }
}

// ── Loading animation ─────────────────────────────────────────

function resetLoadingSteps() {
    const labels = ['Phân tích yêu cầu chuyến đi','Tìm kiếm địa điểm phù hợp','Tối ưu hóa lộ trình','Gợi ý phương tiện & chi phí','Hoàn thiện lịch trình'];
    ['ls-1','ls-2','ls-3','ls-4','ls-5'].forEach((id,i) => {
        const el=document.getElementById(id); if (!el) return;
        el.className='ls'+(i===0?' done':i===1?' active':'');
        el.innerHTML=(i===0?'<span class="ls-ico">✓</span>':i===1?'<div class="ls-spin"></div>':'<span class="ls-ico">○</span>')+' '+labels[i];
    });
}

function animateLoading(success) {
    const ids=['ls-2','ls-3','ls-4','ls-5']; let delay=0;
    ids.forEach((id,i) => {
        const nextId=ids[i+1]; delay+=1100+Math.random()*400;
        setTimeout(()=>{
            const prev=document.getElementById(id); if (!prev) return;
            const sp=prev.querySelector('.ls-spin'); if(sp) sp.outerHTML='<span class="ls-ico">✓</span>';
            prev.classList.remove('active'); prev.classList.add('done');
            if (nextId) { const next=document.getElementById(nextId); if (!next) return; const ico=next.querySelector('.ls-ico'); if(ico) ico.outerHTML='<div class="ls-spin"></div>'; next.classList.add('active'); }
        }, delay);
    });
    delay+=700;
    setTimeout(()=>{
        document.querySelectorAll('.ls-spin').forEach(s=>s.outerHTML='<span class="ls-ico">✓</span>');
        document.querySelectorAll('.ls').forEach(s=>{s.classList.remove('active');s.classList.add('done');});
        setTimeout(()=>showScreen(success?'result':'error'), 450);
    }, delay);
}

// ── App Bootstrap ─────────────────────────────────────────────

async function initApp() {
    const app = document.getElementById('app-main');
    if (!app) return; // guard: không chạy trên chatbot.html

    try {
        // Load fragments dynamically (Loading, Result, Error, Map modal)
        const loadingUrl = new URL('../components/loading.html', import.meta.url);
        const resultUrl = new URL('../components/result.html', import.meta.url);
        
        const [loadingFrag, resultFrag] = await Promise.all([
            fetchHtmlFragment('loading', loadingUrl),
            fetchHtmlFragment('result', resultUrl)
        ]);

        const fragContainer = document.getElementById('dynamic-fragments');
        if (fragContainer) {
            fragContainer.innerHTML = loadingFrag.text + '\n' + resultFrag.text;
        }

        // Attach all events via callbacks — no inline onclick
        initFormUIEvents({
            onGenerate:          handleGenerate,
            onFeedback:          handleFeedback,
            onContinueFromError: handleContinueFromError,
        });

        await loadData();
    } catch(err) {
        console.error('[TopGo] initApp failed:', err);
        showToast('Lỗi khởi tạo ứng dụng: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', initApp);
