/* ============================================================
       TopChat — chatbot interactions (mock AI responses)
       Modified: NO auto-scroll to bottom. Only scroll to user message on send.
    ============================================================ */
    const chatInput = document.getElementById('chatbot-input');
    const chatSend = document.getElementById('chatbot-send');
    const chatMessages = document.getElementById('chatbot-messages');

    // ---- Helper: scroll to element ----
    function scrollToElement(el) {
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    // Add a simple text message
    function addMessage(html, isUser) {
        const div = document.createElement('div');
        div.className = `message ${isUser ? 'user' : 'bot'}`;
        if (isUser) {
            div.innerHTML = `<div class="message-wrap user"><div class="message-content">${html}</div></div>`;
        } else {
            div.innerHTML = `
      <div class="message-wrap">
        <div class="bot-avatar">🤖</div>
        <div class="message-content">${html}</div>
      </div>`;
        }
        chatMessages.appendChild(div);
        // No auto-scroll
    }

    // Add a rich card message
    function addCardMessage(cardData) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.style.maxWidth = '95%'; div.style.width = '95%';
        div.innerHTML = `
    <div class="message-wrap">
      <div class="bot-avatar">🤖</div>
      <div class="message-content card-message" style="padding:16px;width:100%">
        <div class="bot-section-title">${cardData.title}</div>
        <div class="card-items-grid">
          ${cardData.items.map(item => `
            <div class="card-item-vertical">
              <div class="card-item-name-vertical">${item.name}</div>
              <div class="card-item-desc-vertical">${item.desc}</div>
              ${item.details ? `<div class="card-item-info-vertical">${item.details}</div>` : ''}
              <div class="card-item-rating-vertical">⭐ ${item.rating}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>`;
        chatMessages.appendChild(div);
    }

    // Show typing indicator
    function showTyping() {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.id = 'typing-indicator';
        div.innerHTML = `
    <div class="message-wrap">
      <div class="bot-avatar">🤖</div>
      <div class="typing-indicator">
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
        <div class="typing-dot"></div>
      </div>
    </div>`;
        chatMessages.appendChild(div);
    }

    function removeTyping() {
        const t = document.getElementById('typing-indicator');
        if (t) t.remove();
    }

    // ---- Response data (unchanged) ----
    const RESPONSES = {
        dalat: {
            type: 'card',
            trigger: text => text.includes('đà lạt') || text.includes('da lat'),
            card: {
                title: '🌸 Địa điểm nổi bật ở Đà Lạt',
                items: [
                    { name: '🌊 Hồ Xuân Hương', desc: 'Trái tim thành phố — dạo thuyền, cà phê ngắm cảnh sương mờ.', details: 'Rộng 5km², nằm ngay trung tâm. Buổi sáng sương mờ rất đẹp. Thuê thuyền đạp vịt, xe ngựa dạo quanh.', rating: '4.8' },
                    { name: '💑 Thung lũng Tình Yêu', desc: 'Công viên lãng mạn — vườn hoa rực rỡ, cầu Vòng Tay.', details: 'Nhiều khu hoa đặc sắc, phù hợp cặp đôi & gia đình. Vé ~120.000 ₫/người.', rating: '4.5' },
                    { name: '🏔️ Đỉnh LangBiang', desc: 'Chinh phục đỉnh núi 2.167m — view toàn cảnh Đà Lạt.', details: 'Đi bộ hoặc cáp treo. Nên đi sáng sớm để tránh mây. Mang áo ấm!', rating: '4.7' },
                    { name: '🌺 Làng hoa Vạn Thành', desc: 'Làng hoa lớn nhất Đà Lạt — check-in cực xinh, vào cửa miễn phí.', details: 'Hàng trăm loại hoa quanh năm, đặc biệt đẹp dịp Tết & Festival Hoa.', rating: '4.4' },
                ]
            },
            follow: '📌 TopGo gợi ý thêm: mùa tốt nhất đến Đà Lạt là <strong>tháng 11 – 1</strong> (Festival Hoa). Mang áo ấm vì đêm lạnh nhé!'
        },
        danang: {
            type: 'card',
            trigger: text => text.includes('đà nẵng') || text.includes('da nang'),
            card: {
                title: '🏖️ Top địa điểm Đà Nẵng',
                items: [
                    { name: '🌉 Bà Nà Hills', desc: 'Cầu Vàng biểu tượng, làng Pháp, công viên Fantasy Park.', details: 'Cáp treo dài nhất thế giới. Vé ~900K/người (full day). Đặt online tiết kiệm ~100K.', rating: '4.9' },
                    { name: '🏖️ Bãi biển Mỹ Khê', desc: 'Forbes bình chọn top 6 bãi biển đẹp nhất thế giới.', details: 'Cát trắng mịn, nước xanh trong. Tắm biển miễn phí. Nhiều quán hải sản ngon gần bãi.', rating: '4.8' },
                    { name: '🐉 Cầu Rồng', desc: 'Biểu tượng Đà Nẵng — phun lửa & nước tối thứ 7, CN lúc 21h.', details: 'Cầu dài 666m hình rồng vươn ra biển. Đi bộ trên cầu buổi tối rất thú vị.', rating: '4.6' },
                    { name: '🐒 Núi Sơn Trà', desc: 'Rừng nguyên sinh, voọc chà vá chân nâu đặc hữu, view đỉnh.', details: 'Lái xe lên đỉnh ~30 phút. Ngắm toàn cảnh thành phố tuyệt đẹp lúc bình minh.', rating: '4.5' },
                ]
            },
            follow: '✈️ Bay từ Hà Nội hoặc Sài Gòn ~1 tiếng. Mùa đẹp: <strong>tháng 3–8</strong> (ít mưa, nắng đẹp).'
        },
        // New: Detailed itinerary for Da Nang (3 days)
        danang_itinerary: {
            type: 'itinerary',
            trigger: text => text.includes('lịch trình đà nẵng') || text.includes('itinerary đà nẵng') || text.includes('gợi ý lịch trình đà nẵng') || text.includes('lịch trình 3 ngày đà nẵng'),
            data: {
                title: '🗺️ Lịch trình Đà Nẵng – Hội An – Bà Nà Hills (3 ngày)',
                days: [
                    {
                        day: 1,
                        name: 'Khám phá Đà Nẵng',
                        stops: [
                            { time: '07:00', icon: '✈️', name: 'Sân bay Đà Nẵng', desc: 'Đáp chuyến bay sớm, nhận phòng khách sạn.', details: 'Di chuyển bằng taxi ~30 phút.' },
                            { time: '09:00', icon: '🏖️', name: 'Bãi biển Mỹ Khê', desc: 'Tắm biển, dạo bờ cát trắng.', details: 'Một trong những bãi biển đẹp nhất châu Á.' },
                            { time: '12:30', icon: '🍜', name: 'Mỳ Quảng Bà Cụ', desc: 'Thưởng thức mỳ Quảng chuẩn vị Đà Nẵng.', details: 'Giá ~50.000₫/tô.' },
                            { time: '15:00', icon: '🏛️', name: 'Bảo tàng Điêu khắc Chăm', desc: 'Tìm hiểu văn hóa Champa.', details: 'Vé ~60.000₫.' },
                            { time: '19:00', icon: '🐉', name: 'Cầu Rồng', desc: 'Ngắm cầu rồng phun lửa, nước (tối T7, CN).', details: 'Đi bộ dọc sông Hàn, ăn tối hải sản.' }
                        ]
                    },
                    {
                        day: 2,
                        name: 'Bà Nà Hills – Cầu Vàng',
                        stops: [
                            { time: '07:30', icon: '🌉', name: 'Bà Nà Hills', desc: 'Tham quan Cầu Vàng, làng Pháp, Fantasy Park.', details: 'Vé ~900.000₫/người, cáp treo ấn tượng.' },
                            { time: '12:00', icon: '🍽️', name: 'Buffet trưa', desc: 'Nhà hàng trong khuôn viên Bà Nà.', details: 'Khoảng 250.000₫/người.' },
                            { time: '15:00', icon: '🎢', name: 'Fantasy Park', desc: 'Khu vui chơi giải trí trong nhà.', details: 'Miễn phí vé vào, trò chơi tính tiền.' }
                        ]
                    },
                    {
                        day: 3,
                        name: 'Hội An cổ kính',
                        stops: [
                            { time: '08:00', icon: '🏮', name: 'Phố Cổ Hội An', desc: 'Dạo phố cổ, Chùa Cầu, Hội quán.', details: 'Vé tham quan ~120.000₫.' },
                            { time: '11:00', icon: '🍲', name: 'Cao Lầu Thanh', desc: 'Ăn cao lầu đặc sản.', details: '~50.000₫/tô.' },
                            { time: '14:00', icon: '🏖️', name: 'Biển Cửa Đại', desc: 'Tắm biển, nghỉ ngơi.', details: 'Cách phố cổ 5km, xe máy ~15 phút.' },
                            { time: '17:00', icon: '✈️', name: 'Kết thúc', desc: 'Di chuyển ra sân bay Đà Nẵng.', details: 'Xe ôm hoặc taxi ~45 phút.' }
                        ]
                    }
                ]
            }
        },
        food: {
            type: 'food',
            trigger: text => text.includes('ăn gì') || text.includes('đặc sản') || text.includes('món ăn') || text.includes('ngon') || text.includes('quán') || text.includes('hội an'),
        },
        budget: {
            type: 'budget',
            trigger: text => text.includes('ngân sách') || text.includes('bao nhiêu tiền') || text.includes('chi phí') || text.includes('hết bao nhiêu') || text.includes('giá') || text.includes('tốn'),
        },
        weather: {
            type: 'weather',
            trigger: text => text.includes('thời tiết') || text.includes('nhiệt độ') || text.includes('mặc gì') || text.includes('mưa') || text.includes('nắng') || text.includes('tháng'),
        },
        halong: {
            type: 'card',
            trigger: text => text.includes('hạ long') || text.includes('ha long'),
            card: {
                title: '⛵ Kinh nghiệm du lịch Hạ Long',
                items: [
                    { name: '🚢 Tour ngủ đêm trên vịnh', desc: 'Trải nghiệm không thể bỏ qua — ngủ trên thuyền giữa vịnh.', details: 'Tour 2N1Đ ~1.5–3M/người. Book sớm mùa hè vì rất đông. Sunrise trên vịnh cực đẹp.', rating: '4.9' },
                    { name: '🏊 Hang Sửng Sốt & Đảo Ti Tốp', desc: 'Hang động kỳ vĩ nhất vịnh + leo núi ngắm toàn cảnh.', details: 'Ti Tốp có bãi tắm đẹp, leo 400 bậc lên đỉnh. Nên đi sáng sớm.', rating: '4.7' },
                    { name: '🎣 Làng chài Cửa Vạn', desc: 'Làng chài nổi độc đáo giữa vịnh, văn hóa ngư dân truyền thống.', details: 'Chèo thuyền kayak vào làng rất thú vị. Mua hải sản tươi ngay tại chỗ.', rating: '4.6' },
                ]
            },
            follow: '⚠️ Lưu ý: tránh đi Hạ Long <strong>tháng 7–8</strong> vì hay có bão. Tốt nhất: <strong>tháng 3–5</strong> hoặc <strong>10–11</strong>.'
        },
    };

    // ---- Core send logic ----
    function processMessage(text) {
        const t = text.toLowerCase();

        for (const key of Object.keys(RESPONSES)) {
            const resp = RESPONSES[key];
            if (resp.trigger(t)) {
                if (resp.type === 'card') {
                    addCardMessage(resp.card);
                    if (resp.follow) setTimeout(() => addMessage(resp.follow, false), 600);
                    return;
                }
                if (resp.type === 'itinerary') {
                    renderItinerary(resp.data);
                    return;
                }
                if (resp.type === 'food') { renderFoodResponse(t); return; }
                if (resp.type === 'budget') { renderBudgetResponse(t); return; }
                if (resp.type === 'weather') { renderWeatherResponse(t); return; }
            }
        }
        addMessage(
            `🤔 TopGo đang học thêm để trả lời câu hỏi này. <br>` +
            `Bạn thử hỏi về: <strong>Đà Lạt, Đà Nẵng, Hội An, Hạ Long</strong> — ` +
            `hoặc hỏi về <strong>đặc sản, ngân sách, thời tiết, lịch trình Đà Nẵng</strong> nhé!`, false
        );
    }

    // Render detailed itinerary (3 days)
    function renderItinerary(data) {
        const div = document.createElement('div');
        div.className = 'message bot';
        div.style.maxWidth = '95%';
        div.style.width = '95%';
        let html = `<div class="message-wrap">
          <div class="bot-avatar">🤖</div>
          <div class="message-content card-message" style="padding:20px;width:100%">
            <div class="bot-section-title" style="font-size:18px;margin-bottom:12px">${data.title}</div>`;
        data.days.forEach(day => {
            html += `<div style="margin-bottom:24px;border-bottom:1px dashed var(--border-light);padding-bottom:12px">
              <div style="font-weight:800;font-size:16px;color:var(--p1);margin-bottom:10px">📅 Ngày ${day.day}: ${day.name}</div>`;
            day.stops.forEach(stop => {
                html += `<div style="display:flex;gap:12px;margin-bottom:12px;background:rgba(255,255,255,0.5);border-radius:var(--r);padding:10px;">
                  <div style="min-width:50px;font-weight:700;color:var(--p1)">${stop.time}</div>
                  <div style="font-size:20px;min-width:32px">${stop.icon}</div>
                  <div style="flex:1">
                    <div style="font-weight:700">${stop.name}</div>
                    <div style="font-size:13px;color:var(--muted)">${stop.desc}</div>
                    ${stop.details ? `<div style="font-size:12px;color:var(--text);margin-top:4px">📌 ${stop.details}</div>` : ''}
                  </div>
                </div>`;
            });
            html += `</div>`;
        });
        html += `<div style="margin-top:8px;font-size:12.5px;background:var(--bg2);border-radius:var(--r);padding:10px;text-align:center">
          💡 Gợi ý: Bạn có thể linh động thứ tự, đặt tour Bà Nà qua Klook/KKday để tiết kiệm.
        </div>`;
        html += `</div></div></div>`;
        div.innerHTML = html;
        chatMessages.appendChild(div);
    }

    // ---- Specialized renderers (unchanged but no scroll) ----
    function renderFoodResponse(t) {
        let city = 'Hội An'; let foods = FOOD_DATA['hoian'];
        if (t.includes('đà nẵng')) { city = 'Đà Nẵng'; foods = FOOD_DATA['danang']; }
        else if (t.includes('đà lạt')) { city = 'Đà Lạt'; foods = FOOD_DATA['dalat']; }
        else if (t.includes('hà nội')) { city = 'Hà Nội'; foods = FOOD_DATA['hanoi']; }
        else if (t.includes('sài gòn') || t.includes('hcm') || t.includes('hồ chí minh')) { city = 'TP.HCM'; foods = FOOD_DATA['hcm']; }

        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = `
    <div class="message-wrap">
      <div class="bot-avatar">🤖</div>
      <div class="message-content card-message" style="padding:16px;min-width:280px">
        <div class="bot-section-title">🍽️ Đặc sản không thể bỏ lỡ ở ${city}</div>
        ${foods.map(f => `
          <div class="food-item">
            <div class="food-emoji">${f.emoji}</div>
            <div class="food-info">
              <div class="food-name">${f.name}</div>
              <div class="food-desc">${f.desc}</div>
              <div class="food-price">💰 ${f.price}</div>
            </div>
          </div>`).join('')}
      </div>
    </div>`;
        chatMessages.appendChild(div);
        setTimeout(() => addMessage(`😋 Ăn no rồi nhớ đi dạo phố xem nhé! Bạn muốn TopGo gợi ý thêm địa điểm ở <strong>${city}</strong> không?`, false), 600);
    }

    function renderBudgetResponse(t) {
        let city = 'Đà Nẵng'; let bdata = BUDGET_DATA['danang'];
        if (t.includes('đà lạt')) { city = 'Đà Lạt'; bdata = BUDGET_DATA['dalat']; }
        else if (t.includes('hội an')) { city = 'Hội An'; bdata = BUDGET_DATA['hoian']; }
        else if (t.includes('hạ long')) { city = 'Hạ Long'; bdata = BUDGET_DATA['halong']; }
        else if (t.includes('phú quốc')) { city = 'Phú Quốc'; bdata = BUDGET_DATA['phuquoc']; }

        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = `
    <div class="message-wrap">
      <div class="bot-avatar">🤖</div>
      <div class="message-content card-message" style="padding:16px;min-width:300px">
        <div class="bot-section-title">💰 Ước tính ngân sách 3 ngày tại ${city} (1 người)</div>
        <table class="budget-table">
          <thead><tr><th>Hạng mục</th><th>Tiết kiệm</th><th>Thoải mái</th></tr></thead>
          <tbody>
            ${bdata.rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('')}
            <tr><td>💼 Tổng</td><td>${bdata.total[0]}</td><td>${bdata.total[1]}</td></tr>
          </tbody>
        </table>
        <div style="font-size:11.5px;color:var(--muted);margin-top:8px">* Giá ước tính, thực tế có thể thay đổi theo mùa và số người.</div>
      </div>
    </div>`;
        chatMessages.appendChild(div);
        setTimeout(() => addMessage(`📊 Muốn TopGo lên lịch trình chi tiết hơn cho <strong>${city}</strong>? Thử dùng <a href="/" style="color:var(--p1);font-weight:700">AI Planner</a> nhé!`, false), 700);
    }

    function renderWeatherResponse(t) {
        let city = 'Đà Nẵng'; let wdata = WEATHER_DATA['danang'];
        if (t.includes('đà lạt')) { city = 'Đà Lạt'; wdata = WEATHER_DATA['dalat']; }
        else if (t.includes('hà nội')) { city = 'Hà Nội'; wdata = WEATHER_DATA['hanoi']; }
        else if (t.includes('phú quốc')) { city = 'Phú Quốc'; wdata = WEATHER_DATA['phuquoc']; }
        else if (t.includes('hạ long')) { city = 'Hạ Long'; wdata = WEATHER_DATA['halong']; }

        const div = document.createElement('div');
        div.className = 'message bot';
        div.innerHTML = `
    <div class="message-wrap">
      <div class="bot-avatar">🤖</div>
      <div class="message-content card-message" style="padding:16px;min-width:280px">
        <div class="bot-section-title">🌤️ Thời tiết & mùa đẹp tại ${city}</div>
        <div class="weather-grid">
          ${wdata.seasons.map(s => `
            <div class="weather-day">
              <span class="wd-icon">${s.icon}</span>
              <div class="wd-label">${s.label}</div>
              <div class="wd-temp">${s.temp}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:12px;font-size:13px;color:var(--text);line-height:1.6">
          ${wdata.tip}
        </div>
        <div style="margin-top:8px;font-size:12.5px;font-weight:700;color:var(--p1)">
          👕 Nên mặc gì: ${wdata.wear}
        </div>
      </div>
    </div>`;
        chatMessages.appendChild(div);
    }

    // ---- Static data (unchanged) ----
    const FOOD_DATA = {
        hoian: [
            { emoji: '🍜', name: 'Cao Lầu', desc: 'Mì đặc sản chỉ có ở Hội An với nước tương đặc trưng.', price: '35.000–60.000 ₫' },
            { emoji: '🥗', name: 'Cơm Gà Hội An', desc: 'Cơm vàng nghệ, gà xé phay, nước mắm chua ngọt.', price: '40.000–70.000 ₫' },
            { emoji: '🫔', name: 'Bánh Mì Phượng', desc: 'Nổi tiếng toàn cầu, Anthony Bourdain đã khen.', price: '25.000–35.000 ₫' },
            { emoji: '🍡', name: 'Chè Hội An', desc: 'Hàng chục loại chè mát lạnh, đặc biệt chè đậu ván.', price: '15.000–30.000 ₫' },
        ],
        danang: [
            { emoji: '🦞', name: 'Mỳ Quảng', desc: 'Mì vàng nghệ, tôm thịt, bánh đa nướng giòn.', price: '40.000–80.000 ₫' },
            { emoji: '🍢', name: 'Bún Chả Cá', desc: 'Bún với chả cá thu chiên giòn, nước dùng đậm đà.', price: '35.000–60.000 ₫' },
            { emoji: '🦐', name: 'Hải sản Bãi Mỹ Khê', desc: 'Tôm hùm, cua, hào nướng phô mai ngay bên biển.', price: '200K–1M/người' },
            { emoji: '🥞', name: 'Bánh Xèo Bà Dưỡng', desc: 'Bánh xèo giòn nhân tôm thịt, đặc sản Đà Nẵng.', price: '30.000–50.000 ₫' },
        ],
        dalat: [
            { emoji: '🍓', name: 'Dâu tây Đà Lạt', desc: 'Tự hái dâu trong vườn hoặc mua tại chợ.', price: '50.000–150.000 ₫/kg' },
            { emoji: '🫕', name: 'Lẩu bò nhúng dấm', desc: 'Món nóng lý tưởng cho thời tiết lạnh Đà Lạt.', price: '80.000–150.000 ₫/người' },
            { emoji: '☕', name: 'Cà phê Đà Lạt', desc: 'Cà phê đặc sản, uống trong không gian lãng mạn.', price: '35.000–70.000 ₫' },
            { emoji: '🌽', name: 'Bánh tráng nướng', desc: 'Đặc sản vỉa hè, nhiều topping, cực ngon khi lạnh.', price: '15.000–25.000 ₫' },
        ],
        hanoi: [
            { emoji: '🍲', name: 'Bún Chả Hà Nội', desc: 'Chả nướng than, bún tươi, nước chấm chuẩn vị Bắc.', price: '50.000–80.000 ₫' },
            { emoji: '🍜', name: 'Phở Bò Hà Nội', desc: 'Phở tái, chín với bánh phở mỏng, nước dùng trong.', price: '45.000–90.000 ₫' },
            { emoji: '🥚', name: 'Bánh Cuốn Thanh Trì', desc: 'Bánh mỏng nhân thịt nấm, chấm nước mắm chua.', price: '30.000–60.000 ₫' },
            { emoji: '🍡', name: 'Bún Ốc', desc: 'Ốc bươu tươi, bún trắng, nước dùng cà chua chua.', price: '35.000–65.000 ₫' },
        ],
        hcm: [
            { emoji: '🥗', name: 'Hủ Tiếu Nam Vang', desc: 'Hủ tiếu dai với tôm, thịt, trứng cút thơm ngon.', price: '50.000–100.000 ₫' },
            { emoji: '🍜', name: 'Bánh Canh Cua', desc: 'Bánh canh sợi to, cua đồng đậm đà, béo ngậy.', price: '60.000–120.000 ₫' },
            { emoji: '🫙', name: 'Cơm Tấm', desc: 'Cơm tấm sườn bì chả, đặc sản Sài Gòn xịn.', price: '40.000–90.000 ₫' },
            { emoji: '🧆', name: 'Bánh Tét Sài Gòn', desc: 'Bánh tét nhân thịt mỡ đậu xanh, ngày thường cũng có.', price: '20.000–40.000 ₫' },
        ],
    };

    const BUDGET_DATA = {
        danang: {
            rows: [['🛏 Lưu trú/đêm', '300K–600K', '800K–2M'], ['✈️ Vé máy bay (KH)', '700K–1.2M', '1.2M–2.5M'], ['🍜 Ăn uống/ngày', '150K–300K', '400K–800K'], ['🚕 Di chuyển/ngày', '80K–150K', '200K–400K'], ['🎫 Tham quan/ngày', '100K–300K', '400K–900K']],
            total: ['~3.5M–6M', '~8M–15M'],
        },
        dalat: {
            rows: [['🛏 Lưu trú/đêm', '200K–450K', '600K–1.5M'], ['🚌 Xe khách (KH)', '300K–600K', '600K–1M'], ['🍜 Ăn uống/ngày', '120K–250K', '300K–600K'], ['🚕 Di chuyển/ngày', '50K–120K', '150K–300K'], ['🎫 Tham quan/ngày', '50K–150K', '200K–500K']],
            total: ['~2.5M–5M', '~6M–12M'],
        },
        hoian: {
            rows: [['🛏 Lưu trú/đêm', '250K–500K', '700K–1.8M'], ['🚌 Xe/Bay (KH)', '500K–1.2M', '1M–2.5M'], ['🍜 Ăn uống/ngày', '100K–200K', '300K–700K'], ['🚕 Di chuyển/ngày', '60K–120K', '150K–350K'], ['🎫 Tham quan/ngày', '80K–200K', '250K–600K']],
            total: ['~3M–5.5M', '~7M–14M'],
        },
        halong: {
            rows: [['🚢 Tour 2N1Đ', '1.5M–2.5M', '3M–6M'], ['🚌 Xe từ HN (KH)', '200K–400K', '400K–800K'], ['🍜 Ăn uống (tour)', 'Thường bao gồm', 'Thường bao gồm'], ['🎫 Tham quan', '100K–200K', '200K–500K']],
            total: ['~2.5M–4M', '~5M–10M'],
        },
        phuquoc: {
            rows: [['🛏 Resort/đêm', '500K–1M', '1.5M–5M'], ['✈️ Bay (KH)', '800K–1.5M', '1.5M–3M'], ['🍜 Ăn uống/ngày', '150K–350K', '400K–1M'], ['🚕 Di chuyển/ngày', '100K–200K', '200K–500K'], ['🏊 Tham quan/ngày', '100K–300K', '400K–1M']],
            total: ['~4M–8M', '~10M–25M'],
        },
    };

    const WEATHER_DATA = {
        danang: {
            seasons: [{ icon: '☀️', label: 'T3–T8', temp: '27–35°C' }, { icon: '🌧️', label: 'T9–T11', temp: '20–26°C' }, { icon: '⛅', label: 'T12–T2', temp: '18–24°C' }, { icon: '🌊', label: 'Biển đẹp', temp: 'T3–T8' }],
            tip: '✅ <strong>Mùa đẹp nhất:</strong> tháng 3–8 — nắng đẹp, biển êm, ít mưa. Tránh tháng 9–11 vì mưa lũ nhiều.',
            wear: 'Áo thun, quần short, kem chống nắng. Tháng 12–2 mang thêm áo khoác mỏng.',
        },
        dalat: {
            seasons: [{ icon: '🌸', label: 'T3–T5', temp: '17–22°C' }, { icon: '🌧️', label: 'T5–T10', temp: '15–20°C' }, { icon: '🍂', label: 'T10–T12', temp: '14–20°C' }, { icon: '❄️', label: 'T12–T2', temp: '10–17°C' }],
            tip: '✅ <strong>Mùa đẹp nhất:</strong> tháng 11–1 (Festival Hoa) hoặc tháng 3–4 (khô ráo, se lạnh). Tránh T6–T9 vì mưa nhiều.',
            wear: 'Áo khoác len/hoodie mọi tháng. Buổi tối cần áo ấm dù mùa hè.',
        },
        hanoi: {
            seasons: [{ icon: '🌺', label: 'T3–T4', temp: '18–25°C' }, { icon: '☀️', label: 'T5–T8', temp: '28–38°C' }, { icon: '🍂', label: 'T9–T11', temp: '20–27°C' }, { icon: '🌨️', label: 'T12–T2', temp: '12–20°C' }],
            tip: '✅ <strong>Mùa đẹp nhất:</strong> tháng 10–11 (thu vàng, mát mẻ) và tháng 3–4 (xuân, ít mưa). Tránh T6–T8 vì nóng ẩm.',
            wear: 'T3–T11: áo thun + quần dài. T12–T2: áo ấm, khăn len. Mang ô luôn.',
        },
        phuquoc: {
            seasons: [{ icon: '☀️', label: 'T11–T4', temp: '27–33°C' }, { icon: '🌧️', label: 'T5–T10', temp: '25–30°C' }, { icon: '🏖️', label: 'Mùa khô', temp: 'T11–T4' }, { icon: '🌊', label: 'Biển đẹp', temp: 'T11–T3' }],
            tip: '✅ <strong>Mùa đẹp nhất:</strong> tháng 11–4 (khô, biển trong). Tháng 5–10 mưa nhiều, biển động.',
            wear: 'Quần short, áo thun, dép xốp và đồ bơi. Mang áo khoác nhẹ cho buổi tối.',
        },
        halong: {
            seasons: [{ icon: '🌸', label: 'T3–T5', temp: '18–25°C' }, { icon: '☀️', label: 'T6–T8', temp: '27–33°C' }, { icon: '🍂', label: 'T9–T11', temp: '20–27°C' }, { icon: '❄️', label: 'T12–T2', temp: '12–18°C' }],
            tip: '✅ <strong>Mùa đẹp nhất:</strong> tháng 3–5 và 10–11. Tránh T7–T8 vì bão. T12–T2 se lạnh nhưng ít khách.',
            wear: 'T3–T9: áo thun, áo khoác mỏng. T10–T2: áo len, áo gió chắn hơi nước vịnh.',
        },
    };

    // ---- Send message (MODIFIED: scroll to user message only) ----
    function sendMessage(textOverride) {
        const text = (textOverride || chatInput.value).trim();
        if (!text) return;
        addMessage(text, true);
        chatInput.value = '';

        // Scroll to the user message just added
        const lastUserMsg = document.querySelector('.message.user:last-child');
        if (lastUserMsg) {
            lastUserMsg.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        chatSend.disabled = true;
        showTyping();
        setTimeout(() => {
            removeTyping();
            processMessage(text);
            // No additional scrolling
            chatSend.disabled = false;
        }, 700 + Math.random() * 400);
    }

    function sendSuggestion(text) {
        const chips = document.querySelector('.chat-suggestions');
        if (chips) { chips.style.opacity = '0'; setTimeout(() => chips.remove(), 300); }
        sendMessage(text);
    }

    chatSend.addEventListener('click', () => sendMessage());
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendMessage(); });