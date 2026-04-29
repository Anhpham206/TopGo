/* 
  ========================================================================
  FILE: chatbot.js
  CHỨC NĂNG: 
  - Entry point (tệp thực thi chính) cho luồng giao diện TopChat (chatbot.html).
  - Điều khiển logic hiển thị tương tác chat giữa Người dùng và Bot trên DOM (thêm bong bóng chat, cuộn trang, hiệu ứng gõ phím).
  - Xử lý phân tích từ khóa (tại client-side bằng \`processMessage\`) dựa trên bộ dữ liệu mock (\`mockFallback.js\`) để trả lời tức thời.
  - Cung cấp các hàm render giao diện tin nhắn đặc thù (Card, bảng giá, biểu đồ thời tiết) từ cấu trúc dữ liệu JSON nội bộ.
  ========================================================================
*/
import './shared.js'; // auto-loads header + footer components

// ── DOM references ────────────────────────────────────────────
const chatInput    = document.getElementById('chatbot-input');
const chatSend     = document.getElementById('chatbot-send');
const chatMessages = document.getElementById('chatbot-messages');

// ── Message helpers ───────────────────────────────────────────
function addMessage(html, isUser) {
    const div = document.createElement('div');
    div.className = `message ${isUser ? 'user' : 'bot'}`;
    const wrap = isUser
        ? `<div class="message-wrap user"><div class="message-content">${html}</div></div>`
        : `<div class="message-wrap"><div class="message-content">${html}</div></div>`;
    div.innerHTML = window.DOMPurify ? DOMPurify.sanitize(wrap, {ADD_ATTR:['style','href']}) : wrap;
    chatMessages.appendChild(div);
    div.scrollIntoView({behavior:'smooth', block:'start'});
}

function addCardMessage(cardData) {
    const div = document.createElement('div');
    div.className = 'message bot'; div.style.cssText = 'max-width:95%;width:95%';
    const raw = `<div class="message-wrap"><div class="message-content card-message" style="padding:16px;width:100%">
      <div class="bot-section-title">${cardData.title}</div>
      <div class="card-items-grid">
        ${cardData.items.map(item=>`<div class="card-item-vertical">
          <div class="card-item-name-vertical">${item.name}</div>
          <div class="card-item-desc-vertical">${item.desc}</div>
          ${item.details?`<div class="card-item-info-vertical">${item.details}</div>`:''}
          <div class="card-item-rating-vertical">⭐ ${item.rating}</div>
        </div>`).join('')}
      </div>
    </div></div>`;
    div.innerHTML = window.DOMPurify ? DOMPurify.sanitize(raw, {ADD_ATTR:['style']}) : raw;
    chatMessages.appendChild(div);
}

function showTyping() {
    const div = document.createElement('div'); div.className = 'message bot'; div.id = 'typing-indicator';
    div.innerHTML = `<div class="message-wrap"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>`;
    chatMessages.appendChild(div);
}
function removeTyping() { document.getElementById('typing-indicator')?.remove(); }

// ── processMessage ────────────────────────────────────────────
function processMessage(text) {
    const t = text.toLowerCase();
    if (typeof MOCK_CHATBOT_RESPONSES === 'undefined') {
        addMessage('⚠️ Dữ liệu chatbot chưa được nạp. Vui lòng tải lại trang.', false); return;
    }
    for (const key of Object.keys(MOCK_CHATBOT_RESPONSES)) {
        const resp = MOCK_CHATBOT_RESPONSES[key];
        if (resp.trigger(t)) {
            if (resp.type==='card')      { addCardMessage(resp.card); if(resp.follow) setTimeout(()=>addMessage(resp.follow,false),600); return; }
            if (resp.type==='food')      { renderFoodResponse(t); return; }
            if (resp.type==='budget')    { renderBudgetResponse(t); return; }
            if (resp.type==='weather')   { renderWeatherResponse(t); return; }
            if (resp.type==='itinerary') { renderItineraryCard(resp.data); return; }
            if (resp.text) { addMessage(resp.text, false); return; }
        }
    }
    addMessage(`🤔 TopGo đang học thêm để trả lời câu hỏi này.<br>Thử hỏi về: <strong>Đà Lạt, Đà Nẵng, Hội An, Hạ Long</strong> hoặc <strong>đặc sản, ngân sách, thời tiết</strong> nhé!`, false);
}

function renderFoodResponse(t) {
    if (typeof MOCK_FOOD_DATA === 'undefined') { addMessage('⚠️ Dữ liệu đặc sản chưa được nạp.', false); return; }
    let city='Hội An', foods=MOCK_FOOD_DATA['hoian'];
    if (t.includes('đà nẵng'))  { city='Đà Nẵng';  foods=MOCK_FOOD_DATA['danang']; }
    else if (t.includes('đà lạt')) { city='Đà Lạt'; foods=MOCK_FOOD_DATA['dalat'];  }
    else if (t.includes('hà nội')) { city='Hà Nội'; foods=MOCK_FOOD_DATA['hanoi'];  }
    else if (t.includes('sài gòn')||t.includes('hcm')||t.includes('hồ chí minh')) { city='TP.HCM'; foods=MOCK_FOOD_DATA['hcm']; }
    const div = document.createElement('div'); div.className = 'message bot';
    div.innerHTML = `<div class="message-wrap"><div class="message-content card-message" style="padding:16px;min-width:280px">
      <div class="bot-section-title">🍽️ Đặc sản không thể bỏ lỡ ở ${city}</div>
      ${foods.map(f=>`<div class="food-item"><div class="food-emoji">${f.emoji}</div><div class="food-info"><div class="food-name">${f.name}</div><div class="food-desc">${f.desc}</div><div class="food-price">💰 ${f.price}</div></div></div>`).join('')}
    </div></div>`;
    chatMessages.appendChild(div);
    setTimeout(()=>addMessage(`😋 Muốn TopGo gợi ý thêm địa điểm ở <strong>${city}</strong> không?`, false), 600);
}

function renderBudgetResponse(t) {
    if (typeof MOCK_BUDGET_DATA === 'undefined') { addMessage('⚠️ Dữ liệu ngân sách chưa được nạp.', false); return; }
    let city='Đà Nẵng', bdata=MOCK_BUDGET_DATA['danang'];
    if (t.includes('đà lạt'))       { city='Đà Lạt';   bdata=MOCK_BUDGET_DATA['dalat'];   }
    else if (t.includes('hội an'))  { city='Hội An';    bdata=MOCK_BUDGET_DATA['hoian'];   }
    else if (t.includes('hạ long')) { city='Hạ Long';   bdata=MOCK_BUDGET_DATA['halong'];  }
    else if (t.includes('phú quốc')){ city='Phú Quốc'; bdata=MOCK_BUDGET_DATA['phuquoc']; }
    const div = document.createElement('div'); div.className = 'message bot';
    div.innerHTML = `<div class="message-wrap"><div class="message-content card-message" style="padding:16px;min-width:300px">
      <div class="bot-section-title">💰 Ước tính ngân sách 3 ngày tại ${city} (1 người)</div>
      <table class="budget-table"><thead><tr><th>Hạng mục</th><th>Tiết kiệm</th><th>Thoải mái</th></tr></thead>
      <tbody>${bdata.rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}<tr><td>💼 Tổng</td><td>${bdata.total[0]}</td><td>${bdata.total[1]}</td></tr></tbody></table>
    </div></div>`;
    chatMessages.appendChild(div);
    setTimeout(()=>addMessage(`📊 Muốn lên lịch chi tiết? Thử <a href="./index.html" style="color:var(--p1);font-weight:700">AI Planner</a> nhé!`, false), 700);
}

function renderWeatherResponse(t) {
    if (typeof MOCK_WEATHER_DATA === 'undefined') { addMessage('⚠️ Dữ liệu thời tiết chưa được nạp.', false); return; }
    let city='Đà Nẵng', wdata=MOCK_WEATHER_DATA['danang'];
    if (t.includes('đà lạt'))        { city='Đà Lạt';   wdata=MOCK_WEATHER_DATA['dalat'];   }
    else if (t.includes('hà nội'))   { city='Hà Nội';   wdata=MOCK_WEATHER_DATA['hanoi'];   }
    else if (t.includes('phú quốc')) { city='Phú Quốc'; wdata=MOCK_WEATHER_DATA['phuquoc']; }
    else if (t.includes('hạ long'))  { city='Hạ Long';  wdata=MOCK_WEATHER_DATA['halong'];  }
    const div = document.createElement('div'); div.className = 'message bot';
    div.innerHTML = `<div class="message-wrap"><div class="message-content card-message" style="padding:16px;min-width:280px">
      <div class="bot-section-title">🌤️ Thời tiết & mùa đẹp tại ${city}</div>
      <div class="weather-grid">${wdata.seasons.map(s=>`<div class="weather-day"><span class="wd-icon">${s.icon}</span><div class="wd-label">${s.label}</div><div class="wd-temp">${s.temp}</div></div>`).join('')}</div>
      <div style="margin-top:12px;font-size:13px;line-height:1.6">${wdata.tip}</div>
      <div style="margin-top:8px;font-size:12.5px;font-weight:700;color:var(--p1)">👕 Nên mặc gì: ${wdata.wear}</div>
    </div></div>`;
    chatMessages.appendChild(div);
}

function renderItineraryCard(data) {
    const div = document.createElement('div'); div.className = 'message bot'; div.style.cssText = 'max-width:95%;width:95%';
    let html = `<div class="message-wrap"><div class="message-content card-message" style="padding:20px;width:100%"><div class="bot-section-title" style="font-size:18px;margin-bottom:12px">${data.title}</div>`;
    data.days.forEach(day=>{
        html+=`<div style="margin-bottom:24px;border-bottom:1px dashed var(--border-light);padding-bottom:12px"><div style="font-weight:800;font-size:16px;color:var(--p1);margin-bottom:10px">📅 Ngày ${day.day}: ${day.name}</div>`;
        day.stops.forEach(stop=>{
            html+=`<div style="display:flex;gap:12px;margin-bottom:12px;background:rgba(255,255,255,.5);border-radius:var(--r);padding:10px"><div style="min-width:50px;font-weight:700;color:var(--p1)">${stop.time}</div><div style="font-size:20px;min-width:32px">${stop.icon}</div><div style="flex:1"><div style="font-weight:700">${stop.name}</div><div style="font-size:13px;color:var(--muted)">${stop.desc}</div>${stop.details?`<div style="font-size:12px;color:var(--text);margin-top:4px">📌 ${stop.details}</div>`:''}</div></div>`;
        });
        html+=`</div>`;
    });
    html+=`</div></div></div>`;
    div.innerHTML = window.DOMPurify ? DOMPurify.sanitize(html,{ADD_ATTR:['style']}) : html;
    chatMessages.appendChild(div);
}

// ── Send message ──────────────────────────────────────────────
function sendMessage(textOverride) {
    const text = (textOverride || chatInput.value).trim();
    if (!text) return;
    addMessage(text, true);
    chatInput.value = '';
    chatSend.disabled = true;
    showTyping();
    setTimeout(()=>{ removeTyping(); processMessage(text); chatSend.disabled=false; }, 700+Math.random()*400);
}

// ── Event listeners (Task 9: no inline onclick) ───────────────
chatSend.addEventListener('click', ()=>sendMessage());
chatInput.addEventListener('keypress', e=>{ if(e.key==='Enter') sendMessage(); });

// Task 9: delegation for data-suggestion chips
chatMessages.addEventListener('click', e=>{
    const chip = e.target.closest('[data-suggestion]');
    if (!chip) return;
    const suggestions = chip.closest('.chat-suggestions');
    if (suggestions) { suggestions.style.opacity='0'; setTimeout(()=>suggestions.remove(),300); }
    sendMessage(chip.dataset.suggestion);
});
