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
import { detectDepartureCity } from './data.js';
import { runComprehensiveValidation, sanitizeText, isNonsensicalText } from './utils.js';
import { fetchCities, fetchPlaces, generateItinerary, sendFeedback, getMockItineraryFallback } from './api.js';
import { initLeafletMap } from './map.js';
import {
    showScreen, renderCityList, renderDepList, renderItinerary,
    updateDeparture, getRawBudget, validateDates, updateBudgetPP,
    initFormUIEvents, getTripDays
} from './ui.js';
import { showToast, showPopup, closePopup } from './shared.js';
import { fetchHtmlFragment } from './fragmentLoader.js';
// shared.js auto-runs loadSharedComponents() on import — header/footer loaded.

// ── Data loading ──────────────────────────────────────────────

async function loadData() {
    const [cData, pData] = await Promise.all([fetchCities(), fetchPlaces()]);
    state.CITIES = cData;
    state.PLACES_BY_CITY = pData;

    if (!state.CITIES.length || !Object.keys(state.PLACES_BY_CITY).length) {
        showToast('Không thể kết nối máy chủ. Đang dùng dữ liệu mẫu.', 'warning');
        const btn = document.getElementById('btn-gen');
        if (btn) { btn.disabled = true; btn.title = 'Cần kết nối Backend'; }
    }

    renderCityList('');
    renderDepList('');

    const hn = state.CITIES.find(c => c.id === 'ha_noi');
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
    if (window._quotaCountdownInterval) {
        clearInterval(window._quotaCountdownInterval);
        window._quotaCountdownInterval = null;
    }
    let valid = true;
    if (!state.selectedCity) { document.getElementById('err-city')?.classList.add('show'); valid = false; }
    const budget = getRawBudget();
    const paxVal = parseInt(document.getElementById('pax-val')?.value) || 1;
    const tripDays = getTripDays();
    const minBudgetL2 = paxVal * tripDays * 50_000;
    if (!budget || budget < minBudgetL2) {
        document.getElementById('err-budget')?.classList.add('show');
        document.getElementById('budget-input')?.classList.add('err');
        valid = false;
    }
    const rawNotes = document.getElementById('notes-input')?.value || '';
    const trimmedNotes = rawNotes.trim();
    const errNotes = document.getElementById('err-notes');
    errNotes?.classList.remove('show');
    if (trimmedNotes && trimmedNotes.length < 5) {
        if (errNotes) { errNotes.textContent = 'Nội dung quá ngắn (tối thiểu 5 ký tự).'; errNotes.classList.add('show'); }
        valid = false;
    }
    if (!valid) {
        showToast('Vui lòng kiểm tra lại các trường bắt buộc', 'error');
        document.querySelector('.f-err.show')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    const transport = document.getElementById('transport-type')?.value;
    const payload = {
        city_id: state.selectedCity.id,
        city_name: state.selectedCity.name,
        dep_city_id: state.selectedDepCity?.id || null,
        budget,
        pax: parseInt(document.getElementById('pax-val')?.value),
        date_start: document.getElementById('date-start')?.value,
        date_end: document.getElementById('date-end')?.value,
        notes: sanitizeText(rawNotes),
        transport,
        accommodation: document.getElementById('accommodation-type')?.value,
        departure_time: document.getElementById('time-start')?.value,
        return_time: document.getElementById('time-end')?.value,
        places: state.selectedPlaces.map(p => typeof p === 'string' ? { id: p, ten: p, loai: 'diem_tham_quan' } : { id: p.id, ten: p.ten, loai: p.loai }),
    };

    const validation = runComprehensiveValidation(payload);
    if (validation.errors.length) {
        _showValidationErrors(validation.errors, validation.continueAllowed, payload);
        return;
    }

    const tripId = 'AI·' + Math.random().toString(36).substr(2, 4).toUpperCase() + '·' + new Date().getFullYear();
    const tripEl = document.getElementById('tb-trip-id');
    if (tripEl) tripEl.textContent = 'TRIP — ' + tripId;
    window._lastPayload = payload;

    showScreen('loading');
    resetLoadingSteps();

    generateItinerary(payload, (stepIdx) => {
        const ids = ['ls-1', 'ls-2', 'ls-3', 'ls-4', 'ls-5', 'ls-6'];
        for (let i = 0; i < stepIdx; i++) {
            const el = document.getElementById(ids[i]);
            if (el) {
                const sp = el.querySelector('.ls-spin') || el.querySelector('.ls-ico');
                if (sp) sp.outerHTML = '<span class="ls-ico">✓</span>';
                el.classList.remove('active');
                el.classList.add('done');
            }
        }
        if (stepIdx < 6) {
            const current = document.getElementById(ids[stepIdx]);
            if (current) {
                const ico = current.querySelector('.ls-ico');
                if (ico) ico.outerHTML = '<div class="ls-spin"></div>';
                current.classList.add('active');
            }
        }
    })
        .then(data => {
            if (data.status === 'error') {
                _showBackendError(data, payload);
            } else {
                if (data.status === 'success') {
                    console.log("đã nhận data ở main.js");
                }
                renderItinerary(data.status === 'success' ? data.output : null);
                document.querySelectorAll('.ls-spin').forEach(s => s.outerHTML = '<span class="ls-ico">✓</span>');
                document.querySelectorAll('.ls').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
                setTimeout(() => showScreen('result'), 450);
            }
        })
        .catch((err) => {
            console.error(err);
            _showBackendError({ errors: [err?.message || String(err)] }, payload);
        });
}

function _showValidationErrors(errors, continueAllowed, payload) {
    const el = document.getElementById('error-issues');
    if (el) el.innerHTML = errors.map(e => `<div class="error-issue${e.type === 'warning' ? ' warning-issue' : ''}">${e.msg}</div>`).join('');
    const btn = document.getElementById('btn-continue-error');
    if (btn) {
        btn.style.display = continueAllowed ? 'inline-flex' : 'none';
        btn.textContent = "Tiếp tục →";
        btn.className = "popup-confirm blue";
        btn.style.background = "";
        btn.style.borderColor = "";
        btn.style.boxShadow = "";
        btn.style.color = "";
    }
    window._continueAllowed = continueAllowed;
    window._useMockData = false;
    window._lastPayload = payload;
    showScreen('error');
}

function _showBackendError(data, payload) {
    const el = document.getElementById('error-issues');
    const titleEl = document.querySelector('#screen-error .error-title');
    const msgEl = document.querySelector('#screen-error .error-msg');
    const iconEl = document.querySelector('#screen-error .error-icon');
    const btnContinue = document.getElementById('btn-continue-error');
    
    // Clear any active countdown interval to prevent overlapping
    if (window._quotaCountdownInterval) {
        clearInterval(window._quotaCountdownInterval);
        window._quotaCountdownInterval = null;
    }
    
    // Remove old retry button if exists
    const oldRetryBtn = document.getElementById('btn-retry-quota');
    if (oldRetryBtn) oldRetryBtn.remove();
    
    // Reset standard styles
    if (titleEl) titleEl.textContent = "Yêu cầu chưa đạt điều kiện";
    if (msgEl) {
        msgEl.textContent = "AI phát hiện một số vấn đề với thông tin của bạn:";
        msgEl.style.color = "";
    }
    if (iconEl) {
        iconEl.textContent = "";
        iconEl.style.display = 'none';
    }
    
    window._continueAllowed = false;
    window._useMockData = false;
    if (btnContinue) {
        btnContinue.style.display = 'none';
        btnContinue.textContent = "Tiếp tục →";
        btnContinue.className = "popup-confirm blue";
        btnContinue.style.background = "";
        btnContinue.style.borderColor = "";
        btnContinue.style.boxShadow = "";
        btnContinue.style.color = "";
    }
    
    const errors = data.errors || [];
    const has429 = errors.some(e => 
        e.includes('429') || 
        e.toUpperCase().includes('RESOURCE_EXHAUSTED') || 
        e.toLowerCase().includes('quota')
    );
    
    if (has429) {
        // Cấu hình UI lỗi Quota đặc biệt - Sử dụng class CSS thay cho style inline
        if (titleEl) {
            titleEl.innerHTML = `<span class="quota-title-main">Đã hết lượt dùng thử Gemini AI</span>`;
        }
        if (msgEl) {
            msgEl.textContent = "Hệ thống AI miễn phí hiện tại đã đạt giới hạn cuộc gọi tối đa (429 Rate Limit):";
            msgEl.style.color = "";
        }
        if (iconEl) {
            iconEl.textContent = "";
            iconEl.style.display = 'none';
        }
        
        // Parse thời gian chờ nếu có
        let cooldownSeconds = 48; // fallback default
        const timeMatch = errors.join(' ').match(/retry in ([\d\.]+)(s|ms)/i);
        if (timeMatch) {
            const value = parseFloat(timeMatch[1]);
            const unit = timeMatch[2].toLowerCase();
            cooldownSeconds = unit === 'ms' ? value / 1000 : value;
        } else {
            const delayMatch = errors.join(' ').match(/retryDelay['":\s]+(\d+)/i);
            if (delayMatch) {
                cooldownSeconds = parseInt(delayMatch[1], 10);
            }
        }
        
        // Inject styles for custom quota animations
        if (!document.getElementById('quota-countdown-styles')) {
            const style = document.createElement('style');
            style.id = 'quota-countdown-styles';
            style.innerHTML = `
                @keyframes pulse-quota {
                    0% { box-shadow: 0 0 0 0 rgba(0, 169, 255, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(0, 169, 255, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(0, 169, 255, 0); }
                }
                .pulse-quota-btn {
                    animation: pulse-quota 2s infinite !important;
                }
            `;
            document.head.appendChild(style);
        }
        
        const errorHtml = `
            <div class="api-quota-warning">
                <div class="api-quota-title">
                    Lỗi vượt quá hạn ngạch (Quota Exceeded - 429)
                </div>
                <p class="api-quota-desc">
                    Tài khoản API Key Gemini miễn phí trên máy chủ đã đạt giới hạn 20 lượt yêu cầu/ngày hoặc số lượng yêu cầu mỗi phút quá cao.
                </p>
                
                <!-- Premium Countdown Banner -->
                <div id="quota-countdown-banner" class="quota-countdown-banner">
                    <div id="quota-timer-circle" class="quota-timer-circle">
                        ${Math.ceil(cooldownSeconds)}
                    </div>
                    <div style="flex-grow:1;">
                        <div id="quota-countdown-title" class="quota-countdown-title">Thời gian chờ tải lại:</div>
                        <div id="quota-countdown-text" class="quota-countdown-text">Đang tính toán...</div>
                    </div>
                </div>

                <details style="margin-top:10px;">
                    <summary class="quota-details-summary">Xem log lỗi chi tiết</summary>
                    <pre class="quota-details-pre">${errors.join('\n')}</pre>
                </details>
            </div>
            
            <div class="api-quota-warning offline-mode">
                <div class="api-quota-title">
                    Trải nghiệm ngoại tuyến (Offline Mode)
                </div>
                <p class="api-quota-desc">
                    Bạn có thể chọn tiếp tục tham quan bằng lịch trình mẫu được tạo sẵn để trải nghiệm nhanh bố cục thiết kế của hệ thống.
                </p>
            </div>
        `;
        
        if (el) el.innerHTML = errorHtml;
        
        // Tạo nút retry gửi lại yêu cầu khi hết thời gian chờ
        const actsContainer = document.querySelector('#screen-error .popup-acts');
        let btnRetry = document.getElementById('btn-retry-quota');
        if (!btnRetry && actsContainer) {
            btnRetry = document.createElement('button');
            btnRetry.id = 'btn-retry-quota';
            btnRetry.className = 'glass-btn glass-btn-primary glow btn-large pulse-quota-btn';
            btnRetry.style.display = 'none'; // hidden initially
            btnRetry.innerHTML = `Gửi lại yêu cầu AI ngay`;
            actsContainer.appendChild(btnRetry);
            
            btnRetry.addEventListener('click', () => {
                if (window._quotaCountdownInterval) {
                    clearInterval(window._quotaCountdownInterval);
                    window._quotaCountdownInterval = null;
                }
                btnRetry.style.display = 'none';
                showScreen('loading');
                handleGenerate();
            });
        }
        
        // Bắt đầu đếm ngược live ticking
        let secondsLeft = Math.ceil(cooldownSeconds);
        const timerTextEl = document.getElementById('quota-countdown-text');
        const timerCircleEl = document.getElementById('quota-timer-circle');
        const countdownTitleEl = document.getElementById('quota-countdown-title');
        const countdownBannerEl = document.getElementById('quota-countdown-banner');
        
        const updateTimerDisplay = () => {
            if (secondsLeft > 0) {
                if (timerTextEl) timerTextEl.innerHTML = `Thử lại sau <strong>${secondsLeft.toFixed(0)}s</strong>`;
                if (timerCircleEl) {
                    timerCircleEl.textContent = secondsLeft.toFixed(0);
                    timerCircleEl.style.borderColor = "";
                    timerCircleEl.style.borderTopColor = "";
                    timerCircleEl.style.color = "";
                }
            } else {
                if (window._quotaCountdownInterval) {
                    clearInterval(window._quotaCountdownInterval);
                    window._quotaCountdownInterval = null;
                }
                if (timerTextEl) {
                    timerTextEl.classList.add('finished');
                    timerTextEl.innerHTML = `Bạn có thể thử gửi lại yêu cầu ngay bây giờ!`;
                }
                if (countdownTitleEl) countdownTitleEl.style.display = 'none';
                if (countdownBannerEl) {
                    countdownBannerEl.classList.add('finished');
                    countdownBannerEl.style.background = "";
                    countdownBannerEl.style.borderColor = "";
                }
                if (timerCircleEl) {
                    timerCircleEl.classList.add('finished');
                    timerCircleEl.textContent = 'OK';
                    timerCircleEl.style.fontSize = '12px';
                    timerCircleEl.style.borderColor = "";
                    timerCircleEl.style.borderTopColor = "";
                    timerCircleEl.style.color = "";
                }
                if (btnRetry) {
                    btnRetry.style.display = 'inline-flex';
                }
            }
        };
        
        updateTimerDisplay();
        window._quotaCountdownInterval = setInterval(() => {
            secondsLeft--;
            updateTimerDisplay();
        }, 1000);
        
        window._continueAllowed = false;
        
        if (btnContinue) {
            btnContinue.textContent = "Trải nghiệm ngoại tuyến →";
            btnContinue.className = "popup-confirm green";
            btnContinue.style.display = "inline-flex";
            btnContinue.style.justifyContent = "center";
            btnContinue.style.alignItems = "center";
            btnContinue.style.background = "";
            btnContinue.style.borderColor = "";
            btnContinue.style.boxShadow = "";
            btnContinue.style.color = "";
        }
        window._useMockData = true;
    } else {
        // Standard error rendering
        if (el) {
            const errListHtml = errors.map(e => `<div class="error-issue">${e}</div>`).join('');
            const offlineHtml = `
                <div class="api-quota-warning offline-mode">
                    <div class="api-quota-title">
                        Trải nghiệm ngoại tuyến (Offline Mode)
                    </div>
                    <p class="api-quota-desc">
                        Bạn có thể chọn tiếp tục tham quan bằng lịch trình mẫu được tạo sẵn để trải nghiệm nhanh bố cục thiết kế của hệ thống.
                    </p>
                </div>
            `;
            el.innerHTML = (window.DOMPurify ? DOMPurify.sanitize(errListHtml) : errListHtml) + offlineHtml;
        }
        if (btnContinue) {
            btnContinue.textContent = "Trải nghiệm ngoại tuyến →";
            btnContinue.className = "popup-confirm green";
            btnContinue.style.display = "inline-flex";
            btnContinue.style.justifyContent = "center";
            btnContinue.style.alignItems = "center";
            btnContinue.style.background = "";
            btnContinue.style.borderColor = "";
            btnContinue.style.boxShadow = "";
            btnContinue.style.color = "";
        }
        window._useMockData = true;
    }
    
    window._lastPayload = payload;
    showScreen('error');
}

function handleContinueFromError() {
    if (window._useMockData) {
        const mockData = getMockItineraryFallback(window._lastPayload);
        renderItinerary(mockData.output);
        showScreen('result');
        setTimeout(initLeafletMap, 150);
    } else if (window._continueAllowed) {
        renderItinerary(null);
        showScreen('result');
        setTimeout(initLeafletMap, 150);
    } else {
        showScreen('form');
    }
}

async function handleFeedback() {
    const inp = document.getElementById('feedback-input');
    let val = inp?.value.trim() || '';
    if (!val) { showToast('Vui lòng nhập phản hồi', 'error'); return; }
    if (val.length > 500) { showToast('Phản hồi tối đa 500 ký tự', 'error'); return; }
    val = sanitizeText(val);
    if (isNonsensicalText(val)) { showToast('Phản hồi không rõ ràng. Vui lòng mô tả cụ thể hơn để hệ thống cập nhật chính xác.', 'error'); return; }
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
    const labels = ['Phân tích yêu cầu chuyến đi', 'Tìm kiếm địa điểm phù hợp', 'Tối ưu hóa lộ trình', 'Tìm kiếm khách sạn phù hợp', 'Gợi ý phương tiện & chi phí', 'Hoàn thiện lịch trình'];
    ['ls-1', 'ls-2', 'ls-3', 'ls-4', 'ls-5', 'ls-6'].forEach((id, i) => {
        const el = document.getElementById(id); if (!el) return;
        el.className = 'ls' + (i === 0 ? ' done' : i === 1 ? ' active' : '');
        el.innerHTML = (i === 0 ? '<span class="ls-ico">✓</span>' : i === 1 ? '<div class="ls-spin"></div>' : '<span class="ls-ico">○</span>') + ' ' + labels[i];
    });
}

function animateLoading(success) {
    const ids = ['ls-2', 'ls-3', 'ls-4', 'ls-5', 'ls-6']; let delay = 0;
    ids.forEach((id, i) => {
        const nextId = ids[i + 1]; delay += 1100 + Math.random() * 400;
        setTimeout(() => {
            const prev = document.getElementById(id); if (!prev) return;
            const sp = prev.querySelector('.ls-spin'); if (sp) sp.outerHTML = '<span class="ls-ico">✓</span>';
            prev.classList.remove('active'); prev.classList.add('done');
            if (nextId) { const next = document.getElementById(nextId); if (!next) return; const ico = next.querySelector('.ls-ico'); if (ico) ico.outerHTML = '<div class="ls-spin"></div>'; next.classList.add('active'); }
        }, delay);
    });
    delay += 700;
    setTimeout(() => {
        document.querySelectorAll('.ls-spin').forEach(s => s.outerHTML = '<span class="ls-ico">✓</span>');
        document.querySelectorAll('.ls').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
        setTimeout(() => showScreen(success ? 'result' : 'error'), 450);
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
            onGenerate: handleGenerate,
            onFeedback: handleFeedback,
            onContinueFromError: handleContinueFromError,
        });

        await loadData();

        // Kiểm tra xem có lịch trình xem lại trong localStorage hay không
        const reviewPlanStr = localStorage.getItem('topgo_review_plan');
        if (reviewPlanStr) {
            try {
                const reviewPlan = JSON.parse(reviewPlanStr);
                if (reviewPlan && reviewPlan.itinerary) {
                    if (typeof reviewPlan.itinerary === 'string') {
                        try {
                            reviewPlan.itinerary = JSON.parse(reviewPlan.itinerary);
                        } catch (err) {
                            console.error("Lỗi khi parse itinerary string:", err);
                        }
                    }
                    window._lastPayload = reviewPlan.itinerary.payload || {
                        city_name: reviewPlan.destination,
                        pax: reviewPlan.pax,
                        budget: reviewPlan.budget,
                        date_start: reviewPlan.dateStart,
                        date_end: reviewPlan.dateEnd,
                    };
                    
                    renderItinerary(reviewPlan.itinerary);
                    showScreen('result');

                    // Điền lại dữ liệu vào Form
                    if (reviewPlan.destination) {
                        const cityObj = state.CITIES.find(c => c.name === reviewPlan.destination || c.id === reviewPlan.itinerary.payload?.city_id);
                        if (cityObj) {
                            state.selectedCity = cityObj;
                            const cs = document.getElementById('city-search');
                            if (cs) cs.value = cityObj.name;
                            updateFromToDisplay();
                        }
                    }
                    if (reviewPlan.pax) {
                        const pv = document.getElementById('pax-val');
                        if (pv) pv.value = String(reviewPlan.pax);
                        const pm = document.getElementById('pax-minus');
                        const pp = document.getElementById('pax-plus');
                        if (pm) pm.disabled = reviewPlan.pax <= 1;
                        if (pp) pp.disabled = reviewPlan.pax >= 50;
                    }
                    if (reviewPlan.budget) {
                        const bi = document.getElementById('budget-input');
                        if (bi) bi.value = parseInt(reviewPlan.budget).toLocaleString('vi-VN');
                    }
                    if (reviewPlan.dateStart) {
                        const ds = document.getElementById('date-start');
                        if (ds) ds.value = reviewPlan.dateStart;
                    }
                    if (reviewPlan.dateEnd) {
                        const de = document.getElementById('date-end');
                        if (de) de.value = reviewPlan.dateEnd;
                    }
                    validateDates();

                    showToast('Đã tải lịch trình xem lại từ hồ sơ!', 'success');
                }
            } catch (e) {
                console.error("Lỗi khi khôi phục lịch trình xem lại:", e);
            } finally {
                localStorage.removeItem('topgo_review_plan');
            }
        }
    } catch (err) {
        console.error('[TopGo] initApp failed:', err);
        showToast('Lỗi khởi tạo ứng dụng: ' + err.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', initApp);
