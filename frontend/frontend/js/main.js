/* ============================================================
   TopGo — script.js
   Main client-side logic for AI Itinerary Planner
   ============================================================ */

// --- Data loading ---
async function loadData() {
    try {
        const [cData, pData] = await Promise.all([
            fetchCities(),
            fetchPlaces()
        ]);
        CITIES = cData;
        PLACES_BY_CITY = pData;
    } catch (e) {
        showToast('Không thể tải dữ liệu. Vui lòng làm mới trang.', 'error');
    }
    renderCityList('');
    // Default departure
    const depInput = document.getElementById('dep-input');
    if (depInput) {
        depInput.value = 'Sân bay Nội Bài, Hà Nội';
        updateDeparture('Sân bay Nội Bài, Hà Nội');
        depInput.addEventListener('input', function () {
            updateDeparture(this.value);
        });
    }
}

// --- Generate itinerary ---
function handleGenerate() {
    let valid = true;

    if (!selectedCity) {
        document.getElementById('err-city').classList.add('show');
        valid = false;
    }

    const budget = getRawBudget();
    if (!budget || budget < 100_000) {
        document.getElementById('err-budget').classList.add('show');
        document.getElementById('budget-input').classList.add('err');
        valid = false;
    }

    // Notes validation
    const rawNotes = document.getElementById('notes-input').value;
    const trimmedNotes = rawNotes.trim();
    const errNotes = document.getElementById('err-notes');
    if (errNotes) errNotes.classList.remove('show');
    if (!trimmedNotes) {
        if (errNotes) { errNotes.textContent = 'Vui lòng nhập mô tả sở thích hoặc ghi chú.'; errNotes.classList.add('show'); }
        valid = false;
    } else if (trimmedNotes.length < 5) {
        if (errNotes) { errNotes.textContent = 'Nội dung quá ngắn. Hãy mô tả chi tiết hơn (tối thiểu 5 ký tự).'; errNotes.classList.add('show'); }
        valid = false;
    }

    if (!valid) {
        showToast('Vui lòng kiểm tra lại các trường bắt buộc', 'error');
        const firstErr = document.querySelector('.f-err.show');
        if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Sanitize notes
    const sanitizedNotes = sanitizeText(rawNotes);

    const transport = document.getElementById('transport-type').value;
    const depVal = (document.getElementById('dep-input') || {}).value || '';
    const depCity = detectDepartureCity(depVal);
    const depId = depCity ? depCity.id : null;
    const destId = selectedCity ? selectedCity.id : null;

    const payload = {
        city_id: selectedCity.id,
        dep_city_id: depId,
        budget,
        pax: parseInt(document.getElementById('pax-val').value),
        date_start: document.getElementById('date-start').value,
        date_end: document.getElementById('date-end').value,
        notes: sanitizedNotes,
        transport,
        accommodation: document.getElementById('accommodation-type').value,
        departure_time: document.getElementById('time-start').value,
        return_time: document.getElementById('time-end').value,
        places: selectedPlaces
    };

    // Comprehensive client-side validation (ported from Flask utils.py)
    const validation = runComprehensiveValidation(payload);

    if (validation.errors.length > 0) {
        // Show error screen with detailed issues
        const errorIssues = document.getElementById('error-issues');
        if (errorIssues) {
            errorIssues.innerHTML = validation.errors.map(e => {
                const cls = e.type === 'warning' ? 'error-issue warning-issue' : 'error-issue';
                return `<div class="${cls}">${e.msg}</div>`;
            }).join('');
        }
        const continueBtn = document.getElementById('btn-continue-error');
        if (continueBtn) {
            continueBtn.style.display = validation.continueAllowed ? 'inline-flex' : 'none';
        }
        window._continueAllowed = validation.continueAllowed;
        window._lastPayload = payload;
        showScreen('error');
        return;
    }

    const id = 'AI·' + Math.random().toString(36).substr(2, 4).toUpperCase() + '·' + new Date().getFullYear();
    document.getElementById('tb-trip-id').textContent = 'TRIP — ' + id;

    showScreen('loading');
    resetLoadingSteps();

    generateItinerary(payload)
        .then(data => {
            if (data.status === 'error') {
                const errorIssues = document.getElementById('error-issues');
                if (errorIssues) {
                    errorIssues.innerHTML = data.errors.map(e => `<div class="error-issue">${e}</div>`).join('');
                }
                const continueBtn = document.getElementById('btn-continue-error');
                if (continueBtn) {
                    continueBtn.style.display = data.continue_allowed ? 'inline-flex' : 'none';
                }
                window._continueAllowed = data.continue_allowed;
                window._lastPayload = payload;
                showScreen('error');
            } else if (data.status === 'success') {
                animateLoading(true);
            } else {
                animateLoading(true);
            }
        })
        .catch(() => {
            animateLoading(true);
        });
}

function continueFromError() {
    if (window._continueAllowed) {
        showScreen('result');
        setTimeout(initLeafletMap, 150);
    } else {
        showScreen('form');
    }
}

function resetLoadingSteps() {
    const labels = [
        'Phân tích yêu cầu chuyến đi',
        'Tìm kiếm địa điểm phù hợp',
        'Tối ưu hóa lộ trình',
        'Gợi ý phương tiện & chi phí',
        'Hoàn thiện lịch trình',
    ];
    ['ls-1', 'ls-2', 'ls-3', 'ls-4', 'ls-5'].forEach((id, i) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.className = 'ls' + (i === 0 ? ' done' : i === 1 ? ' active' : '');
        el.innerHTML = (i === 0 ? '<span class="ls-ico">✓</span>' :
            i === 1 ? '<div class="ls-spin"></div>' :
                '<span class="ls-ico">○</span>') + ' ' + labels[i];
    });
}

function animateLoading(success, errors) {
    const ids = ['ls-2', 'ls-3', 'ls-4', 'ls-5'];
    let delay = 0;
    ids.forEach((id, i) => {
        const nextId = ids[i + 1];
        delay += 1100 + Math.random() * 400;
        setTimeout(() => {
            const prev = document.getElementById(id);
            if (!prev) return;
            const sp = prev.querySelector('.ls-spin');
            if (sp) sp.outerHTML = '<span class="ls-ico">✓</span>';
            prev.classList.remove('active'); prev.classList.add('done');
            if (nextId) {
                const next = document.getElementById(nextId);
                if (!next) return;
                const ico = next.querySelector('.ls-ico');
                if (ico) ico.outerHTML = '<div class="ls-spin"></div>';
                next.classList.add('active');
            }
        }, delay);
    });
    delay += 700;
    setTimeout(() => {
        document.querySelectorAll('.ls-spin').forEach(s => s.outerHTML = '<span class="ls-ico">✓</span>');
        document.querySelectorAll('.ls').forEach(s => { s.classList.remove('active'); s.classList.add('done'); });
        setTimeout(() => {
            if (!success && errors && errors.length) {
                const errEl = document.getElementById('error-issues');
                if (errEl) errEl.innerHTML = errors.map(e => `<div class="error-issue">${e}</div>`).join('');
            }
            showScreen(success ? 'result' : 'error');
        }, 450);
    }, delay);
}

loadData();
