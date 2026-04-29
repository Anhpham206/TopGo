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
    document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
    document.getElementById('screen-'+name)?.classList.add('active');
    window.scrollTo({top:0,behavior:'smooth'});
    if (name==='result') { setTimeout(initLeafletMap,150); attachHotelClickEvents(); }
}

// ── Hotel map ─────────────────────────────────────────────────
function attachHotelClickEvents() {
    document.querySelectorAll('.hotel-c-card').forEach(card=>{
        card.addEventListener('click', function() {
            const h=JSON.parse(this.getAttribute('data-hotel'));
            if (!h||!state.leafletMapInstance) return;
            if (state.currentHotelMarker) state.leafletMapInstance.removeLayer(state.currentHotelMarker);
            const icon=L.divIcon({className:'',html:`<div style="background:${h.color};color:#fff;border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;border:2px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.3)">🏨</div>`,iconSize:[32,32],iconAnchor:[16,16],popupAnchor:[0,-16]});
            state.currentHotelMarker=L.marker([h.lat,h.lng],{icon}).addTo(state.leafletMapInstance).bindPopup(`<strong>${h.name}</strong><br>📍 Đã chọn`).openPopup();
            state.leafletMapInstance.setView([h.lat,h.lng],15);
            showToast(`Đã định vị ${h.name} trên bản đồ`,'success');
        });
    });
}

// ── Dropdown helpers ──────────────────────────────────────────
function openDrop(id)   { document.getElementById(id)?.classList.add('open'); if(id==='dd-city') renderCityList(''); if(id==='dd-place') renderPlaceList(''); }
function closeDrop(id)  { document.getElementById(id)?.classList.remove('open'); }
function toggleDrop(id) { document.getElementById(id)?.classList.contains('open') ? closeDrop(id) : openDrop(id); }

// ── City dropdown ─────────────────────────────────────────────
export function renderCityList(filter) {
    const list=document.getElementById('city-list'); if (!list) return;
    const q=(filter||'').toLowerCase();
    const filtered=state.CITIES.filter(c=>c.name.toLowerCase().includes(q)||c.sub.toLowerCase().includes(q));
    if (!filtered.length) { list.innerHTML=`<div class="dd-empty">${state.CITIES.length===0?'Chưa có dữ liệu — Backend chưa kết nối':'Không tìm thấy thành phố'}</div>`; return; }
    const raw=filtered.map(c=>{
        const isSel=state.selectedCity?.id===c.id;
        return `<div class="dd-item${isSel?' sel':''}" data-city-id="${c.id}">
          <img class="di-img" src="${c.img}" loading="lazy" decoding="async" onerror="this.style.background='${c.color}';this.removeAttribute('src')" alt="${c.name}" style="background:${c.color}">
          <div class="di-info"><div class="di-name">${c.name}</div><div class="di-sub">${c.sub}</div></div>
          ${isSel?'<span class="di-check">✓</span>':''}
        </div>`;
    }).join('');
    list.innerHTML=window.DOMPurify ? DOMPurify.sanitize(raw,{ADD_ATTR:['data-city-id','onerror','style']}) : raw;
}

export function renderDepList(filter) {
    const list=document.getElementById('dep-list'); if (!list) return;
    const q=(filter||'').toLowerCase();
    const html=state.CITIES.filter(c=>c.name.toLowerCase().includes(q))
        .map(c=>`<div class="dd-item${state.selectedDepCity?.id===c.id?' sel':''}" data-dep-id="${c.id}">
            <img class="di-img" src="${c.img}" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.backgroundColor='${c.color}';this.src='data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs='">
            <div class="di-info"><div class="di-name">${c.name}</div><div class="di-sub">${c.sub||'Thành phố'}</div></div>
            ${state.selectedDepCity?.id===c.id?'<span class="di-check">✓</span>':''}
          </div>`).join('');
    list.innerHTML=window.DOMPurify ? DOMPurify.sanitize(html,{ADD_ATTR:['data-dep-id','onerror','style']}) : html;
}

export function filterCities(val) {
    if (state.citySearchDebounceTimer) clearTimeout(state.citySearchDebounceTimer);
    state.citySearchDebounceTimer=setTimeout(()=>renderCityList(val),200);
}

export function selectCity(id) {
    const city=state.CITIES.find(c=>c.id===id);
    if (!city) return;
    state.selectedCity=city; state.selectedPlaces=[];
    renderPlaceTags(); renderCityList(document.getElementById('city-search')?.value||'');
    const cs=document.getElementById('city-search'); if(cs) cs.value=city.name;
    closeDrop('dd-city'); updateFromToDisplay();
    document.getElementById('err-city')?.classList.remove('show');
    const ps=document.getElementById('place-search'); if(ps) ps.value='';
}

export function filterDepCities(val) {
    if (state.depSearchDebounceTimer) clearTimeout(state.depSearchDebounceTimer);
    state.depSearchDebounceTimer=setTimeout(()=>renderDepList(val),200);
}

export function selectDepCity(id) {
    const city=state.CITIES.find(c=>c.id===id);
    if (!city) return;
    state.selectedDepCity=city;
    renderDepList(document.getElementById('dep-search')?.value||'');
    const cs=document.getElementById('dep-search'); if(cs) cs.value=city.name;
    closeDrop('dd-dep'); updateDeparture();
}

export function updateFromToDisplay() {
    const toEl=document.getElementById('ft-to-city'), toSub=document.getElementById('ft-to-sub');
    if (state.selectedCity) { if(toEl) toEl.textContent=state.selectedCity.abbr; if(toSub) toSub.textContent=state.selectedCity.name; }
    else { if(toEl) toEl.textContent='—'; if(toSub) toSub.textContent='Chọn thành phố bên dưới'; }
}

export function updateDeparture() {
    const fromEl=document.getElementById('ft-from-city'), fromSub=document.getElementById('ft-from-sub');
    if (!fromEl) return;
    if (state.selectedDepCity) {
        fromEl.textContent=state.selectedDepCity.abbr || state.selectedDepCity.name.substring(0,3).toUpperCase();
        if(fromSub) fromSub.textContent=state.selectedDepCity.name;
    } else { 
        fromEl.textContent='—'; 
        if(fromSub) fromSub.textContent='Chọn điểm xuất phát bên dưới'; 
    }
}

// ── Places dropdown ───────────────────────────────────────────
export function renderPlaceList(filter) {
    const list=document.getElementById('place-list'); if (!list) return;
    if (!state.selectedCity) { list.innerHTML='<div class="dd-empty">Chọn thành phố trước</div>'; return; }
    const q=(filter||'').toLowerCase(), cityData=state.PLACES_BY_CITY[state.selectedCity.id];
    let dtqItems=[], qaItems=[];
    if (Array.isArray(cityData)) {
        dtqItems=cityData.map(item=>typeof item==='string'?{id:item,ten:item,tags:[],_loai:'diem_tham_quan'}:{id:item.id||item.name,ten:item.name||item.ten,tags:item.tags||[],_loai:item.category||item.loai||'diem_tham_quan'});
    } else if (cityData) {
        dtqItems=(cityData.diem_tham_quan||[]).map(d=>({...d,_loai:'diem_tham_quan'}));
        qaItems=(cityData.quan_an||[]).map(q=>({...q,ten:q.ten_quan||q.ten,_loai:'quan_an'}));
    }
    const selIds=state.selectedPlaces.map(p=>typeof p==='string'?p:p.id);
    const ff=item=>{
        const t=(item.ten||'').trim();
        return t && t.toLowerCase().includes(q) && !selIds.includes(item.id);
    };
    const fDTQ=dtqItems.filter(ff), fQA=qaItems.filter(ff);
    if (!fDTQ.length&&!fQA.length) { list.innerHTML='<div class="dd-empty">Không tìm thấy địa điểm</div>'; return; }
    let html='';
    if (fDTQ.length) html+='<div class="dd-section-label">Điểm tham quan</div>'+fDTQ.map(renderPlaceItem).join('');
    if (fQA.length)  html+='<div class="dd-section-label">Quán ăn</div>'+fQA.map(renderPlaceItem).join('');
    list.innerHTML=window.DOMPurify ? DOMPurify.sanitize(html,{ADD_ATTR:['data-place-id','data-place-name','data-place-loai']}) : html;
}

function renderPlaceItem(item) {
    const name=item.name||item.ten||item.ten_dia_diem||item.ten_quan||'';
    return `<div class="dd-item" data-place-id="${item.id}" data-place-name="${name}" data-place-loai="${item._loai||'diem_tham_quan'}">
      <div class="di-info"><div class="di-name">${name||'<Không tên>'}</div><div class="di-sub">${state.selectedCity?.name||''}</div></div>
    </div>`;
}

export function filterPlaces(val) {
    if (state.placeSearchDebounceTimer) clearTimeout(state.placeSearchDebounceTimer);
    state.placeSearchDebounceTimer=setTimeout(()=>renderPlaceList(val),200);
}

export function addPlace(id, name, loai) {
    if (!state.selectedCity) { showToast('Vui lòng chọn thành phố trước','error'); return; }
    if (state.selectedPlaces.length>=10) { showToast('Chỉ được chọn tối đa 10 địa điểm','error'); return; }
    if (!state.selectedPlaces.some(p=>(typeof p==='string'?p:p.id)===id)) {
        state.selectedPlaces.push({id,ten:name,loai:loai||'diem_tham_quan'});
        renderPlaceTags(); renderPlaceList('');
        const si=document.getElementById('place-search'); if(si) { si.value=''; si.focus(); }
    }
}

export function removePlace(id) {
    state.selectedPlaces=state.selectedPlaces.filter(p=>(typeof p==='string'?p:p.id)!==id);
    renderPlaceTags(); renderPlaceList('');
}

export function renderPlaceTags() {
    const box=document.getElementById('places-box'); if (!box) return;
    box.querySelectorAll('.tag').forEach(t=>t.remove());
    const si=document.getElementById('place-search'); if (!si) return;
    state.selectedPlaces.forEach(p=>{
        const displayName=typeof p==='string'?p:p.ten, placeId=typeof p==='string'?p:p.id;
        const tag=document.createElement('div'); tag.className='tag'; tag.textContent=displayName+' ';
        const btn=document.createElement('button'); btn.className='tag-rm'; btn.textContent='×';
        btn.addEventListener('click', e=>{ e.stopPropagation(); removePlace(placeId); });
        tag.appendChild(btn); box.insertBefore(tag,si);
    });
}

// ── Pax stepper ───────────────────────────────────────────────
export function adjustPax(delta) {
    const inp=document.getElementById('pax-val'); if (!inp) return;
    const v=Math.max(1,Math.min(50,parseInt(inp.value)+delta)); inp.value=v;
    const minus=document.getElementById('pax-minus'), plus=document.getElementById('pax-plus');
    if(minus) minus.disabled=v<=1; if(plus) plus.disabled=v>=50;
    updateBudgetPP();
}

// ── Dates ─────────────────────────────────────────────────────
export function validateDates() {
    const s=document.getElementById('date-start'),e=document.getElementById('date-end');
    const errS=document.getElementById('err-date-s'),errE=document.getElementById('err-date-e'),dur=document.getElementById('date-dur');
    if (!s||!e) return;
    [errS,errE].forEach(el=>el?.classList.remove('show')); [s,e].forEach(el=>el.classList.remove('err'));
    if(dur) dur.textContent='';
    if (!s.value||!e.value) return;
    const today=new Date(); today.setHours(0,0,0,0);
    const ds=new Date(s.value),de=new Date(e.value); e.min=s.value;
    if (ds<today) { errS?.classList.add('show'); if(errS) errS.textContent='Ngày khởi hành không được ở quá khứ'; s.classList.add('err'); return; }
    const diff=Math.round((de-ds)/864e5);
    if (diff<0) { errE?.classList.add('show'); if(errE) errE.textContent='Ngày về phải sau hoặc bằng ngày đi'; e.classList.add('err'); return; }
    if (diff>7) { errE?.classList.add('show'); if(errE) errE.textContent=`Tối đa 7 ngày (hiện tại: ${diff} ngày)`; e.classList.add('err'); return; }
    if(dur) dur.textContent=diff===0?`✓ ${diff+1} ngày (trong ngày)`:`✓ ${diff} ngày ${diff-1} đêm`;
    updateBudgetPP();
}

export function getTripDays() {
    const ds=document.getElementById('date-start')?.value, de=document.getElementById('date-end')?.value;
    if (!ds||!de) return 1; return Math.max(1,Math.round((new Date(de)-new Date(ds))/864e5));
}

// ── Budget ────────────────────────────────────────────────────
export function formatBudget(inp) {
    const raw=inp.value.replace(/\D/g,''); inp.value=raw?parseInt(raw).toLocaleString('vi-VN'):'';
    document.querySelectorAll('.b-chip').forEach(c=>c.classList.remove('on'));
    validateBudget(); updateBudgetPP();
}

export function setBudget(val, el) {
    document.querySelectorAll('.b-chip').forEach(c=>c.classList.remove('on'));
    el.classList.add('on');
    const bi=document.getElementById('budget-input'); if(bi) bi.value=parseInt(val).toLocaleString('vi-VN');
    validateBudget(); updateBudgetPP();
}

export function getRawBudget() {
    return parseInt((document.getElementById('budget-input')?.value||'0').replace(/\D/g,''))||0;
}

export function validateBudget() {
    const v=getRawBudget(), err=document.getElementById('err-budget'), inp=document.getElementById('budget-input');
    if (v>0&&v<100_000) { err?.classList.add('show'); if(err) err.textContent='Tối thiểu 100.000 ₫'; inp?.classList.add('err'); }
    else { err?.classList.remove('show'); inp?.classList.remove('err'); }
}

export function updateBudgetPP() {
    const pax=parseInt(document.getElementById('pax-val')?.value)||1, budget=getRawBudget(), el=document.getElementById('budget-pp');
    if (!el) return;
    if (budget&&pax) { const pp=Math.round(budget/pax), days=getTripDays(), ppd=days>1?` · ~${Math.round(pp/days).toLocaleString('vi-VN')} ₫/người/ngày`:''; el.textContent=`≈ ${pp.toLocaleString('vi-VN')} ₫/người${ppd}`; }
    else el.textContent='';
}

// ── Preferences & notes ───────────────────────────────────────
export function togglePref(el, text) {
    el.classList.toggle('on');
    const active=Array.from(document.querySelectorAll('.p-chip.on')).map(c=>c.dataset.pref||c.textContent.trim()).join(', ');
    const ta=document.getElementById('notes-input'); if (!ta) return;
    const filtered=ta.value.split('\n').filter(l=>!l.startsWith('Sở thích:')).join('\n').trim();
    ta.value=active?('Sở thích: '+active+(filtered?'\n'+filtered:'')):filtered;
    updateCharCount(ta,'notes-count');
}

export function updateCharCount(el, id) {
    const len=el.value.length, max=parseInt(el.maxLength), c=document.getElementById(id); if (!c) return;
    c.textContent=`${len} / ${max}`; c.className='char-c'+(len>=max?' over':len>max*.9?' warn':'');
}

// ── Reset ─────────────────────────────────────────────────────
export function doReset() {
    state.selectedCity=null; state.selectedPlaces=[];
    const cs=document.getElementById('city-search'); if(cs) cs.value='';
    renderPlaceTags();
    ['dep-input','budget-input','notes-input'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
    const pv=document.getElementById('pax-val'); if(pv) pv.value='1';
    const pm=document.getElementById('pax-minus'); if(pm) pm.disabled=true;
    document.querySelectorAll('.p-chip.on,.b-chip.on').forEach(c=>c.classList.remove('on'));
    document.querySelectorAll('.f-err.show').forEach(e=>e.classList.remove('show'));
    document.querySelectorAll('.err').forEach(e=>e.classList.remove('err'));
    ['notes-count','feedback-count'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='0 / 500';});
    ['date-dur','budget-pp'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='';});
    ['ft-from-city','ft-to-city'].forEach(id=>{const el=document.getElementById(id);if(el)el.textContent='—';});
    const fsub=document.getElementById('ft-from-sub'); if(fsub) fsub.textContent='Nhập điểm xuất phát bên dưới';
    const tsub=document.getElementById('ft-to-sub');   if(tsub) tsub.textContent='Chọn thành phố bên dưới';
    renderCityList(''); closePopup('popup-reset');
    showToast('Đã đặt lại tất cả thông tin','success');
}

// ── Itinerary rendering ───────────────────────────────────────
export function renderItinerary(data) {
    const container=document.getElementById('itinerary-container');
    const p=window._lastPayload;
    if (p) {
        const titleEl=document.getElementById('res-title');
        if (titleEl) { titleEl.textContent = `Hành trình ${p.city_name}`; }
        const datesEl=document.getElementById('res-dates');
        if (datesEl&&p.date_start&&p.date_end) datesEl.innerHTML=`📅 <strong>${p.date_start.split('-').reverse().join('/')} – ${p.date_end.split('-').reverse().join('/')}</strong>`;
        const paxEl=document.getElementById('res-pax'); if(paxEl&&p.pax) paxEl.innerHTML=`👤 <strong>${p.pax} người</strong>`;
        if (p.budget) {
            const fmt=new Intl.NumberFormat('vi-VN').format(p.budget)+' ₫';
            const be=document.getElementById('res-budget'); if(be) be.innerHTML=`💰 <strong>~${fmt}</strong>`;
            const tb=document.getElementById('res-total-budget'); if(tb) tb.textContent=fmt;
            if (p.pax) { const bp=document.getElementById('res-budget-pp'); if(bp) bp.textContent=new Intl.NumberFormat('vi-VN').format(Math.round(p.budget/p.pax))+' ₫'; }
        }
        const pc=document.getElementById('res-places-count'); if(pc&&p.places) pc.textContent=`${p.places.length} điểm`;

        // Tính toán gợi ý xuất phát
        if (p.date_start && p.transport) {
            const prepStart = document.getElementById('res-prep-start');
            const prepDuration = document.getElementById('res-prep-duration');
            const prepRecommend = document.getElementById('res-prep-recommend');
            
            const timeStr = p.departure_time || '07:00';
            const dateStr = p.date_start.split('-').reverse().join('/');
            if (prepStart) prepStart.textContent = `${timeStr}, ${dateStr}`;
            
            let travelHours = 0;
            if (p.dep_city_id && p.city_id && p.dep_city_id !== p.city_id) {
                travelHours = getTravelHours(p.dep_city_id, p.city_id, p.transport);
            }
            
            if (prepDuration) {
                if (travelHours > 0) {
                    prepDuration.textContent = `${p.transport} (~${travelHours.toFixed(1)} giờ)`;
                } else {
                    prepDuration.textContent = `${p.transport} (Cùng khu vực)`;
                }
            }
            
            if (prepRecommend) {
                if (travelHours > 0) {
                    const startDateObj = new Date(`${p.date_start}T${timeStr}:00`);
                    startDateObj.setMinutes(startDateObj.getMinutes() - Math.round(travelHours * 60));
                    
                    // Thêm buffer chuẩn bị (2h cho máy bay, 1h cho xe/tàu)
                    let bufferHours = (p.transport === 'Máy bay') ? 2 : 1;
                    startDateObj.setHours(startDateObj.getHours() - bufferHours);
                    
                    const recDate = startDateObj.toISOString().split('T')[0].split('-').reverse().join('/');
                    const recTime = startDateObj.toTimeString().substring(0, 5);
                    prepRecommend.textContent = `${recTime}, ${recDate}`;
                } else {
                    prepRecommend.textContent = `Thong thả, trước ${timeStr} một chút`;
                }
            }
        }
    }
    if (!container) return;
    if (!data||data.length===0) {
        if (typeof MOCK_ITINERARY_HTML!=='undefined') {
            container.innerHTML=window.DOMPurify?DOMPurify.sanitize(MOCK_ITINERARY_HTML,{ADD_ATTR:['onclick','target','style']}):MOCK_ITINERARY_HTML;
        } else {
            container.innerHTML='<div style="padding:20px;text-align:center;color:var(--sub);">Đang chờ dữ liệu lịch trình từ máy chủ...</div>';
        }
    }
}

// ── initFormUIEvents — Task 9 (gọi từ main.js sau khi inject HTML) ──

export function initFormUIEvents({ onGenerate, onFeedback, onContinueFromError }) {
    // City dropdown
    const cityTrigger=document.getElementById('city-trigger');
    if (cityTrigger) cityTrigger.addEventListener('click',()=>toggleDrop('dd-city'));
    const citySearch=document.getElementById('city-search');
    if (citySearch) {
        citySearch.addEventListener('input', e=>filterCities(e.target.value));
        citySearch.addEventListener('focus', ()=>openDrop('dd-city'));
        citySearch.addEventListener('blur',  ()=>setTimeout(()=>closeDrop('dd-city'),200));
    }
    // City list: event delegation for selectCity
    document.getElementById('city-list')?.addEventListener('mousedown', e=>{
        const item=e.target.closest('[data-city-id]');
        if (item) {
            e.preventDefault(); // Prevent input blur
            selectCity(item.dataset.cityId);
        }
    });

    // Places dropdown
    const placesBox=document.getElementById('places-box');
    if (placesBox) placesBox.addEventListener('click',()=>document.getElementById('place-search')?.focus());
    const placeSearch=document.getElementById('place-search');
    if (placeSearch) {
        placeSearch.addEventListener('input', e=>filterPlaces(e.target.value));
        placeSearch.addEventListener('focus', ()=>openDrop('dd-place'));
        placeSearch.addEventListener('blur',  ()=>setTimeout(()=>closeDrop('dd-place'),200));
    }
    // Place list: event delegation for addPlace
    document.getElementById('place-list')?.addEventListener('mousedown', e=>{
        const item=e.target.closest('[data-place-id]');
        if (item) {
            e.preventDefault(); // Prevent input blur
            addPlace(item.dataset.placeId, item.dataset.placeName, item.dataset.placeLoai);
        }
    });

    // Dep input
    const depSearch=document.getElementById('dep-search');
    if (depSearch) {
        depSearch.addEventListener('input', e=>filterDepCities(e.target.value));
        depSearch.addEventListener('focus', ()=>openDrop('dd-dep'));
        depSearch.addEventListener('blur',  ()=>setTimeout(()=>closeDrop('dd-dep'),200));
    }
    document.getElementById('dep-list')?.addEventListener('mousedown', e=>{
        const item=e.target.closest('[data-dep-id]');
        if (item) {
            e.preventDefault();
            selectDepCity(item.dataset.depId);
        }
    });

    // Pax
    document.getElementById('pax-minus')?.addEventListener('click',()=>adjustPax(-1));
    document.getElementById('pax-plus')?.addEventListener('click', ()=>adjustPax(1));

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
                const val = item.dataset.val;
                if (val === 'Khác') {
                    input.removeAttribute('readonly');
                    input.value = '';
                    input.focus();
                    input.placeholder = 'Nhập thông tin khác...';
                    input.style.cursor = 'text';
                    showToast('Vui lòng gõ loại hình bạn muốn vào ô nhé!', 'info');
                } else {
                    input.setAttribute('readonly', 'true');
                    input.value = val;
                    input.style.cursor = 'pointer';
                }
                list.querySelectorAll('.dd-item.sel').forEach(el => el.classList.remove('sel'));
                item.classList.add('sel');
                wrap.classList.remove('open');
            }
        });

        // Close when clicking outside
        input.addEventListener('blur', () => setTimeout(()=>wrap.classList.remove('open'), 200));
    };

    setupCustomDropdown('dd-transport', 'transport-trigger', 'transport-type', 'transport-list');
    setupCustomDropdown('dd-accom', 'accom-trigger', 'accommodation-type', 'accom-list');

    // Dates
    ['date-start','date-end','time-start','time-end'].forEach(id=>document.getElementById(id)?.addEventListener('change',validateDates));

    // Budget chips: event delegation on .budget-chips
    document.querySelector('.budget-chips')?.addEventListener('click', e=>{
        const chip=e.target.closest('[data-budget]'); if(chip) setBudget(chip.dataset.budget, chip);
    });
    const budgetInput=document.getElementById('budget-input');
    if (budgetInput) { budgetInput.addEventListener('input', ()=>formatBudget(budgetInput)); budgetInput.addEventListener('blur',validateBudget); }

    // Preference chips: event delegation on #pref-chips
    document.getElementById('pref-chips')?.addEventListener('click', e=>{
        const chip=e.target.closest('[data-pref]'); if(chip) togglePref(chip, chip.dataset.pref);
    });

    // Notes
    const notesInput=document.getElementById('notes-input');
    if (notesInput) notesInput.addEventListener('input', ()=>updateCharCount(notesInput,'notes-count'));

    // Reset button + popup
    document.getElementById('btn-reset')?.addEventListener('click',  ()=>showPopup('popup-reset'));
    document.getElementById('btn-do-reset')?.addEventListener('click', doReset);
    document.querySelector('#popup-reset .popup-cancel')?.addEventListener('click', ()=>closePopup('popup-reset'));
    document.getElementById('popup-reset')?.addEventListener('click', e=>{ if(e.target===e.currentTarget) closePopup('popup-reset'); });

    // Generate
    document.getElementById('btn-gen')?.addEventListener('click', onGenerate);

    // Loading screen
    document.getElementById('btn-loading-cancel')?.addEventListener('click', ()=>showScreen('form'));

    // Result screen buttons
    document.getElementById('btn-edit-req')?.addEventListener('click',    ()=>showScreen('form'));
    document.getElementById('btn-save-plan')?.addEventListener('click',   ()=>showPopup('popup-login'));
    document.getElementById('btn-back-to-form')?.addEventListener('click',()=>showScreen('form'));
    document.getElementById('btn-continue-error')?.addEventListener('click', onContinueFromError);
    document.getElementById('btn-close-map')?.addEventListener('click',   ()=>closePopup('popup-map'));

    // Feedback
    const feedbackInput=document.getElementById('feedback-input');
    if (feedbackInput) feedbackInput.addEventListener('input',()=>updateCharCount(feedbackInput,'feedback-count'));
    document.getElementById('btn-feedback')?.addEventListener('click', onFeedback);
}
