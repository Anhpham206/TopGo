/* 
  ========================================================================
  FILE: mockFallback.js
  CHỨC NĂNG: 
  - Cung cấp dữ liệu giả lập (Mock Data) toàn diện khi API backend offline.
  - Bao gồm danh sách thành phố, địa điểm, đặc sản, dự toán ngân sách, v.v.
  ========================================================================
*/
const MOCK_ITINERARY_HTML = `<!-- Day 1 -->
<div class="timeline-day-group">
    <div class="timeline-track"></div>
    <div class="timeline-day-header">
        <div class="tdh-num">N1</div>
        <div class="tdh-date">Thứ Tư · 25/06/2025 · 4 điểm</div>
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">07:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Sân bay Đà Nẵng (DAD)</a></h3>
            <p class="tsc-desc">Bay từ Hà Nội, chuyến sớm để tận dụng ngày đầu. Nhận phòng khách sạn.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~1 tiếng</span>
            </div>
        </div>
    </div>
    
    <div class="timeline-transport">
        <span class="glow-text">DI CHUYỂN:</span> Taxi · 5 km · ~30 phút
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">09:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Bãi biển Mỹ Khê</a></h3>
            <p class="tsc-desc">Một trong những bãi biển đẹp nhất châu Á. Nước trong xanh, cát trắng mịn.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~3 tiếng</span>
            </div>
        </div>
    </div>
    
    <div class="timeline-transport">
        <span class="glow-text">DI CHUYỂN:</span> Taxi · 3 km · ~10 phút
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">12:30</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Quán Mỳ Quảng Bà Cụ</a></h3>
            <p class="tsc-desc">Quán mỳ quảng lâu đời, đông khách địa phương, giá bình dân.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~1.5 tiếng</span>
            </div>
        </div>
    </div>
    
    <div class="timeline-transport">
        <span class="glow-text">DI CHUYỂN:</span> Đi bộ · 500 m · ~5 phút
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">15:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Bảo tàng Điêu khắc Chăm</a></h3>
            <p class="tsc-desc">Bảo tàng lưu giữ bộ sưu tập hiện vật Chăm lớn nhất thế giới.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~2 tiếng</span>
            </div>
        </div>
    </div>
</div><!-- /day-1 -->

<!-- Day 2 -->
<div class="timeline-day-group">
    <div class="timeline-track"></div>
    <div class="timeline-day-header">
        <div class="tdh-num">N2</div>
        <div class="tdh-date">Thứ Năm · 26/06/2025 · 2 điểm</div>
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">07:30</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Bà Nà Hills · Cầu Vàng</a></h3>
            <p class="tsc-desc">Khu du lịch trên đỉnh núi nổi tiếng với Cầu Vàng biểu tượng.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> Cả ngày (~9 tiếng)</span>
            </div>
        </div>
    </div>
</div><!-- /day-2 -->

<!-- Day 3 -->
<div class="timeline-day-group">
    <div class="timeline-track"></div>
    <div class="timeline-day-header">
        <div class="tdh-num">N3</div>
        <div class="tdh-date">Thứ Sáu · 27/06/2025 · 3 điểm</div>
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">08:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Phố Cổ Hội An</a></h3>
            <p class="tsc-desc">Di sản văn hóa thế giới, kiến trúc cổ kính, không gian yên bình.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~2.5 tiếng</span>
            </div>
        </div>
    </div>
    
    <div class="timeline-transport">
        <span class="glow-text">DI CHUYỂN:</span> Ô tô riêng · 25 km · ~45 phút
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">11:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Cao Lầu Thanh</a></h3>
            <p class="tsc-desc">Thưởng thức món cao lầu đặc sản Hội An.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~1.5 tiếng</span>
            </div>
        </div>
    </div>
    
    <div class="timeline-transport">
        <span class="glow-text">DI CHUYỂN:</span> Đi bộ · 1 km · ~10 phút
    </div>
    
    <div class="timeline-stop">
        <div class="ts-time-col">
            <div class="ts-time">14:00</div>
            <div class="timeline-node"></div>
        </div>
        <div class="timeline-stop-card">
            <h3 class="tsc-name"><a href="#" target="_blank">Biển Cửa Đại</a></h3>
            <p class="tsc-desc">Bãi biển đẹp, nước ấm, thích hợp tắm biển.</p>
            <div class="tsc-tags">
                <span class="tsc-tag"><span class="glow-text">THỜI GIAN:</span> ~2.5 tiếng</span>
            </div>
        </div>
    </div>
</div><!-- /day-3 -->

<section class="res-accom-section">
    <div class="section-label">
        <span class="section-label-text">Gợi Ý Lưu Trú</span>
    </div>
    <div class="bionic-accom-grid">
        <div class="bionic-accom-card" data-hotel='{"name":"Pulchra Resort Đà Nẵng","lat":16.055,"lng":108.245,"color":"#3674B5"}'>
            <div class="rac-name">Pulchra Resort Đà Nẵng</div>
            <div class="rac-meta">
                <div class="rac-rate"><span class="glow-text">4.8</span> / 5.0</div>
                <div class="rac-ai">Phù hợp <strong class="glow-text">92%</strong></div>
            </div>
            <div class="rac-price-wrap">
                <div class="rac-price">1.850.000 ₫</div>
            </div>
        </div>
        <div class="bionic-accom-card" data-hotel='{"name":"Fusion Suites Đà Nẵng","lat":16.062,"lng":108.250,"color":"#0C9E72"}'>
            <div class="rac-name">Fusion Suites Đà Nẵng</div>
            <div class="rac-meta">
                <div class="rac-rate"><span class="glow-text">4.6</span> / 5.0</div>
                <div class="rac-ai">Phù hợp <strong class="glow-text">89%</strong></div>
            </div>
            <div class="rac-price-wrap">
                <div class="rac-price">1.250.000 ₫</div>
            </div>
        </div>
        <div class="bionic-accom-card" data-hotel='{"name":"Monarque Hotel Đà Nẵng","lat":16.058,"lng":108.242,"color":"#E8A914"}'>
            <div class="rac-name">Monarque Hotel Đà Nẵng</div>
            <div class="rac-meta">
                <div class="rac-rate"><span class="glow-text">4.5</span> / 5.0</div>
                <div class="rac-ai">Phù hợp <strong class="glow-text">85%</strong></div>
            </div>
            <div class="rac-price-wrap">
                <div class="rac-price">980.000 ₫</div>
            </div>
        </div>
    </div>
</section>`;

const MOCK_CHATBOT_RESPONSES = {
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

const MOCK_FOOD_DATA = {
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

const MOCK_BUDGET_DATA = {
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

const MOCK_WEATHER_DATA = {
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


const MOCK_PLACES_BY_CITY = {
    "binh_thuan": [
        {
            "id": "BIT_DTQ_001",
            "name": "Đồi Cát Đỏ (Red Sand Dunes)",
            "lat": 10.949296,
            "lng": 108.29635,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Khám phá"
            ]
        },
        {
            "id": "BIT_DTQ_002",
            "name": "Bàu Trắng - Đồi Cát Trắng (Minh Thái)",
            "lat": 11.060948,
            "lng": 108.427948,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 15000,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Thể thao cát"
            ]
        },
        {
            "id": "BIT_DTQ_003",
            "name": "Hồ Bàu Trắng (White Lake)",
            "lat": 11.063895,
            "lng": 108.423154,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_004",
            "name": "Bàu Trắng U&Me",
            "lat": 11.063796,
            "lng": 108.432414,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Giải trí",
                "ATV"
            ]
        },
        {
            "id": "BIT_DTQ_005",
            "name": "Đồi Cát Trắng ít khách (Less Touristy)",
            "lat": 11.112394,
            "lng": 108.485899,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Yên tĩnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_006",
            "name": "Suối Tiên (Fairy Stream)",
            "lat": 10.95122,
            "lng": 108.25634,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_007",
            "name": "Núi Tà Cú (Khu Du Lịch)",
            "lat": 10.82348,
            "lng": 107.882394,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 250000,
            "tags": [
                "Tâm linh",
                "Thiên nhiên",
                "Cáp treo"
            ]
        },
        {
            "id": "BIT_DTQ_008",
            "name": "Cáp Treo Núi Tà Cú",
            "lat": 10.823204,
            "lng": 107.882084,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 250000,
            "tags": [
                "Tâm linh",
                "Ngắm cảnh",
                "Giải trí"
            ]
        },
        {
            "id": "BIT_DTQ_009",
            "name": "Mũi Kê Gà (Cape Ke Ga)",
            "lat": 10.699425,
            "lng": 107.992976,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_010",
            "name": "Hải Đăng Kê Gà (Ke Ga Lighthouse)",
            "lat": 10.695289,
            "lng": 107.991564,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_011",
            "name": "Tháp Chàm Poshanư (Po Sah Inu)",
            "lat": 10.935968,
            "lng": 108.146018,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 15000,
            "tags": [
                "Lịch sử",
                "Văn hóa Chăm",
                "Kiến trúc"
            ]
        },
        {
            "id": "BIT_DTQ_012",
            "name": "Đình Vạn Thủy Tú (Whale Temple)",
            "lat": 10.922917,
            "lng": 108.10013,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 15000,
            "tags": [
                "Tôn giáo",
                "Văn hóa",
                "Lịch sử"
            ]
        },
        {
            "id": "BIT_DTQ_013",
            "name": "Tháp Nước Phan Thiết (Water Tower)",
            "lat": 10.928808,
            "lng": 108.099939,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Kiến trúc Pháp",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_014",
            "name": "Bảo Tàng Hồ Chí Minh Phan Thiết",
            "lat": 10.928683,
            "lng": 108.095498,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 10000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "BIT_DTQ_015",
            "name": "Bãi Biển Đồi Dương",
            "lat": 10.924222,
            "lng": 108.115016,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thư giãn",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "BIT_DTQ_016",
            "name": "Công Viên Đồi Dương",
            "lat": 10.925517,
            "lng": 108.115651,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Đi bộ",
                "Thư giãn"
            ]
        },
        {
            "id": "BIT_DTQ_017",
            "name": "Bãi Biển Thương Chánh",
            "lat": 10.917281,
            "lng": 108.107973,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Ngắm bình minh",
                "Địa phương"
            ]
        },
        {
            "id": "BIT_DTQ_018",
            "name": "Bãi Biển Hàm Tiến",
            "lat": 10.940443,
            "lng": 108.193159,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Lướt ván diều",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "BIT_DTQ_019",
            "name": "Bãi Biển Mũi Né",
            "lat": 10.95375,
            "lng": 108.306505,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Lướt sóng",
                "Thư giãn"
            ]
        },
        {
            "id": "BIT_DTQ_020",
            "name": "Bãi Sau Mũi Né",
            "lat": 10.922947,
            "lng": 108.294598,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Yên tĩnh",
                "Thư giãn"
            ]
        },
        {
            "id": "BIT_DTQ_021",
            "name": "Gành Đá Mũi Né",
            "lat": 10.914832,
            "lng": 108.292048,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Ngắm hoàng hôn"
            ]
        },
        {
            "id": "BIT_DTQ_022",
            "name": "Làng Chài Mũi Né (Fishing Village)",
            "lat": 10.94101,
            "lng": 108.279127,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Ẩm thực",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_023",
            "name": "Cảng Cá Mũi Né (Fishing Harbour)",
            "lat": 10.942081,
            "lng": 108.276591,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa địa phương",
                "Ẩm thực",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_024",
            "name": "Làng Chài Hòn Rơm",
            "lat": 10.958232,
            "lng": 108.327178,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Biển",
                "Văn hóa địa phương"
            ]
        },
        {
            "id": "BIT_DTQ_025",
            "name": "Lâu Đài Rượu Vang RD Phan Thiết",
            "lat": 10.947464,
            "lng": 108.181997,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 145000,
            "tags": [
                "Kiến trúc độc đáo",
                "Trải nghiệm",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_026",
            "name": "Bờ Kè Sông Cà Ty",
            "lat": 10.922923,
            "lng": 108.106305,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Đi bộ",
                "Ngắm cảnh",
                "Thư giãn"
            ]
        },
        {
            "id": "BIT_DTQ_027",
            "name": "Bãi Biển Cổ Thạch",
            "lat": 11.176661,
            "lng": 108.71396,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Đá màu",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_028",
            "name": "Đức Mẹ Tà Pao (Our Lady of Ta Pao)",
            "lat": 11.138395,
            "lng": 107.728715,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Tôn giáo",
                "Leo núi"
            ]
        },
        {
            "id": "BIT_DTQ_029",
            "name": "Đền Thầy Thím (Lagi)",
            "lat": 10.723474,
            "lng": 107.844593,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Văn hóa",
                "Tâm linh"
            ]
        },
        {
            "id": "BIT_DTQ_030",
            "name": "Chùa Thiện Quang Mũi Né",
            "lat": 10.971099,
            "lng": 108.261678,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Tâm linh"
            ]
        },
        {
            "id": "BIT_DTQ_031",
            "name": "Chùa Thanh Minh Phan Thiết",
            "lat": 10.92912,
            "lng": 108.116291,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Tâm linh"
            ]
        },
        {
            "id": "BIT_DTQ_032",
            "name": "Chùa Phước Thiền Mũi Né",
            "lat": 10.954492,
            "lng": 108.220335,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Yên tĩnh",
                "Tâm linh"
            ]
        },
        {
            "id": "BIT_DTQ_033",
            "name": "Chùa Linh Long Mũi Né",
            "lat": 10.927608,
            "lng": 108.286062,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Tâm linh",
                "Yên tĩnh"
            ]
        },
        {
            "id": "BIT_DTQ_034",
            "name": "Hội Quán Quan Thánh (Guan Yu Temple)",
            "lat": 10.927197,
            "lng": 108.096222,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Văn hóa Hoa",
                "Kiến trúc"
            ]
        },
        {
            "id": "BIT_DTQ_035",
            "name": "Chùa Bà Đức Sanh Phan Thiết",
            "lat": 10.92489,
            "lng": 108.097096,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Tâm linh",
                "Văn hóa"
            ]
        },
        {
            "id": "BIT_DTQ_036",
            "name": "Bảo Tàng Cổ Vật Mũi Né",
            "lat": 10.937589,
            "lng": 108.289448,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "BIT_DTQ_037",
            "name": "Mian Farm Bình Thuận",
            "lat": 11.05453,
            "lng": 108.40395,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Nông trại",
                "Trải nghiệm",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_038",
            "name": "Điểm Tham Quan Du Lịch Suối Tiên",
            "lat": 10.955615,
            "lng": 108.258945,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Suối",
                "Chill"
            ]
        },
        {
            "id": "BIT_DTQ_039",
            "name": "Bãi Biển Lagi (Ham Tan)",
            "lat": 10.704616,
            "lng": 107.843798,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Yên tĩnh",
                "Địa phương"
            ]
        },
        {
            "id": "BIT_DTQ_040",
            "name": "Hòn Bà Lagi Resort & Beach",
            "lat": 10.668982,
            "lng": 107.788122,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Nghỉ dưỡng",
                "Thiên nhiên"
            ]
        },
        {
            "id": "BIT_DTQ_041",
            "name": "Đền Liệt Sĩ Phan Thiết",
            "lat": 10.944022,
            "lng": 108.098817,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Tâm linh",
                "Tưởng niệm"
            ]
        },
        {
            "id": "BIT_DTQ_042",
            "name": "Hồ Tôm Phan Thiết (Ho Tom Restaurant Area)",
            "lat": 10.938267,
            "lng": 108.117773,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Ngắm cảnh",
                "Thư giãn"
            ]
        },
        {
            "id": "BIT_DTQ_043",
            "name": "Gành Đá Bảy Màu (Co Thach)",
            "lat": 11.176661,
            "lng": 108.71396,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Địa chất",
                "Chụp ảnh"
            ]
        },
        {
            "id": "BIT_DTQ_044",
            "name": "Tượng Tam Thế Phật Tà Cú",
            "lat": 10.813573,
            "lng": 107.894317,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc",
                "Tôn giáo"
            ]
        },
        {
            "id": "BIT_DTQ_045",
            "name": "Đỉnh Tà Cú (Trekking 695m)",
            "lat": 10.811897,
            "lng": 107.900003,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Trekking",
                "Thiên nhiên",
                "Khám phá"
            ]
        },
        {
            "id": "BIT_DTQ_046",
            "name": "Chợ Phan Thiết (Phan Thiet Market)",
            "lat": 10.9295,
            "lng": 108.097,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Mua sắm",
                "Văn hóa địa phương"
            ]
        },
        {
            "id": "BIT_DTQ_047",
            "name": "Bãi Biển Hòn Rơm",
            "lat": 10.960961,
            "lng": 108.318668,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "BIT_DTQ_048",
            "name": "Điểm Lướt Ván Diều Mũi Né (Kite Surfing)",
            "lat": 10.952035,
            "lng": 108.212628,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thể thao biển",
                "Lướt ván",
                "Giải trí"
            ]
        },
        {
            "id": "BIT_DTQ_049",
            "name": "Suối Nước Mũi Né (Suoi Nuoc)",
            "lat": 10.984673,
            "lng": 108.342553,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Biển",
                "Yên tĩnh"
            ]
        },
        {
            "id": "BIT_DTQ_050",
            "name": "Faro Café - Điểm Ngắm Cảnh Mũi Né",
            "lat": 10.950925,
            "lng": 108.272871,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chill",
                "Chụp ảnh"
            ]
        }
    ],
    "can_tho": [
        {
            "id": "CT_DTQ_001",
            "name": "Bến Ninh Kiều",
            "lat": 10.032481,
            "lng": 105.788152,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Sông nước",
                "Biểu tượng",
                "Lãng mạn"
            ]
        },
        {
            "id": "CT_DTQ_002",
            "name": "Chợ nổi Cái Răng",
            "lat": 10.005152,
            "lng": 105.745993,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Giao thương",
                "Văn hóa",
                "Đặc sắc"
            ]
        },
        {
            "id": "CT_DTQ_003",
            "name": "Nhà cổ Bình Thủy",
            "lat": 10.067195,
            "lng": 105.749663,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 15000,
            "tags": [
                "Kiến trúc",
                "Lịch sử",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CT_DTQ_004",
            "name": "Làng du lịch Mỹ Khánh",
            "lat": 9.990836,
            "lng": 105.706141,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 99000,
            "tags": [
                "Sinh thái",
                "Gia đình",
                "Trải nghiệm"
            ]
        },
        {
            "id": "CT_DTQ_005",
            "name": "Thiền viện Trúc Lâm Phương Nam",
            "lat": 9.990748,
            "lng": 105.703944,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Thanh tịnh",
                "Kiến trúc"
            ]
        },
        {
            "id": "CT_DTQ_006",
            "name": "Vườn cò Bằng Lăng",
            "lat": 10.28179,
            "lng": 105.505593,
            "category": "diem_tham_quan",
            "rating": 3.8,
            "price": 20000,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Chim chóc"
            ]
        },
        {
            "id": "CT_DTQ_007",
            "name": "Chợ đêm Tây Đô",
            "lat": 10.03296,
            "lng": 105.787701,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Sôi động",
                "Ẩm thực",
                "Mua sắm"
            ]
        },
        {
            "id": "CT_DTQ_008",
            "name": "Cầu đi bộ Ninh Kiều",
            "lat": 10.037044,
            "lng": 105.79104,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Lãng mạn",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CT_DTQ_009",
            "name": "Chùa Ông",
            "lat": 10.034507,
            "lng": 105.788534,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Người Hoa",
                "Di tích"
            ]
        },
        {
            "id": "CT_DTQ_010",
            "name": "Làng hoa Bà Bộ",
            "lat": 10.037347,
            "lng": 105.744981,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 0,
            "tags": [
                "Hoa cảnh",
                "Chụp ảnh",
                "Thư giãn"
            ]
        },
        {
            "id": "CT_DTQ_011",
            "name": "Bảo tàng Cần Thơ",
            "lat": 10.035429,
            "lng": 105.786751,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Trưng bày",
                "Tìm hiểu"
            ]
        },
        {
            "id": "CT_DTQ_012",
            "name": "Cồn Sơn",
            "lat": 10.084061,
            "lng": 105.749352,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 50000,
            "tags": [
                "Sinh thái",
                "Cá lóc bay",
                "Miệt vườn"
            ]
        },
        {
            "id": "CT_DTQ_013",
            "name": "Vườn ca cao Mười Cương",
            "lat": 9.989498,
            "lng": 105.709193,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 50000,
            "tags": [
                "Trải nghiệm",
                "Nông nghiệp",
                "Ẩm thực"
            ]
        },
        {
            "id": "CT_DTQ_014",
            "name": "Giàn Gừa Phong Điền",
            "lat": 9.978894,
            "lng": 105.72299,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Di tích",
                "Độc đáo"
            ]
        },
        {
            "id": "CT_DTQ_015",
            "name": "Bãi tắm Cần Thơ (Nhân tạo)",
            "lat": 10.044089,
            "lng": 105.795963,
            "category": "diem_tham_quan",
            "rating": 3.7,
            "price": 0,
            "tags": [
                "Giải trí",
                "Tắm biển",
                "Sôi động"
            ]
        },
        {
            "id": "CT_DTQ_016",
            "name": "Phim trường Căn Nhà Màu Tím",
            "lat": 9.970206,
            "lng": 105.810999,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 60000,
            "tags": [
                "Chụp ảnh",
                "Sống ảo",
                "Quán cafe"
            ]
        },
        {
            "id": "CT_DTQ_017",
            "name": "Chợ cổ Cần Thơ",
            "lat": 10.034246,
            "lng": 105.788317,
            "category": "diem_tham_quan",
            "rating": 3.3,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Lịch sử",
                "Kiến trúc"
            ]
        },
        {
            "id": "CT_DTQ_018",
            "name": "Khám Lớn Cần Thơ",
            "lat": 10.036462,
            "lng": 105.788587,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Di tích",
                "Tìm hiểu"
            ]
        },
        {
            "id": "CT_DTQ_019",
            "name": "Chùa Phật Học",
            "lat": 10.033087,
            "lng": 105.784307,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc",
                "Yên tĩnh"
            ]
        },
        {
            "id": "CT_DTQ_020",
            "name": "Chùa Munir Ansay",
            "lat": 10.033692,
            "lng": 105.783953,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Kiến trúc Khmer",
                "Tôn giáo",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CT_DTQ_021",
            "name": "KDL Lung Cột Cầu",
            "lat": 9.969212,
            "lng": 105.696319,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 20000,
            "tags": [
                "Sinh thái",
                "Miệt vườn",
                "Trò chơi"
            ]
        },
        {
            "id": "CT_DTQ_022",
            "name": "KDL Sinh thái Ông Đề",
            "lat": 9.991892,
            "lng": 105.707829,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 50000,
            "tags": [
                "Dã ngoại",
                "Trò chơi dân gian"
            ]
        },
        {
            "id": "CT_DTQ_023",
            "name": "Vườn trái cây Chín Hồng",
            "lat": 9.992457,
            "lng": 105.701327,
            "category": "diem_tham_quan",
            "rating": 2.9,
            "price": 30000,
            "tags": [
                "Hái trái cây",
                "Sinh thái",
                "Ẩm thực"
            ]
        },
        {
            "id": "CT_DTQ_024",
            "name": "Cầu Cần Thơ",
            "lat": 10.034359,
            "lng": 105.809749,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Ngắm cảnh",
                "Biểu tượng"
            ]
        },
        {
            "id": "CT_DTQ_025",
            "name": "Chùa Nam Nhã",
            "lat": 10.072368,
            "lng": 105.754319,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Cổ kính"
            ]
        },
        {
            "id": "CT_DTQ_026",
            "name": "Đình Bình Thủy",
            "lat": 10.07273,
            "lng": 105.752467,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Di tích",
                "Lễ hội",
                "Lịch sử"
            ]
        },
        {
            "id": "CT_DTQ_027",
            "name": "Đền thờ Châu Văn Liêm",
            "lat": 10.0951,
            "lng": 105.60118,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tưởng niệm",
                "Di tích"
            ]
        },
        {
            "id": "CT_DTQ_028",
            "name": "Công viên Lưu Hữu Phước",
            "lat": 10.032253,
            "lng": 105.781486,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Công viên",
                "Giải trí",
                "Đi bộ"
            ]
        },
        {
            "id": "CT_DTQ_029",
            "name": "Lò Hủ Tiếu Sáu Hoài",
            "lat": 9.997141,
            "lng": 105.73978,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Nghề truyền thống",
                "Ẩm thực"
            ]
        },
        {
            "id": "CT_DTQ_030",
            "name": "Lò Hủ Tiếu Chín Của",
            "lat": 9.997763,
            "lng": 105.739079,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Trải nghiệm",
                "Mua sắm",
                "Làm hủ tiếu"
            ]
        },
        {
            "id": "CT_DTQ_031",
            "name": "Đền thờ các Vua Hùng",
            "lat": 10.066399,
            "lng": 105.733799,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tưởng niệm",
                "Kiến trúc",
                "Uy nghiêm"
            ]
        },
        {
            "id": "CT_DTQ_032",
            "name": "Nhà lồng chợ Cái Khế",
            "lat": 10.04406,
            "lng": 105.784517,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Ẩm thực",
                "Đời sống"
            ]
        },
        {
            "id": "CT_DTQ_033",
            "name": "Chùa Pôthi Somrôn",
            "lat": 10.110352,
            "lng": 105.616913,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc Khmer",
                "Thanh tịnh"
            ]
        },
        {
            "id": "CT_DTQ_034",
            "name": "Vườn dâu Hạ Châu",
            "lat": 9.97184,
            "lng": 105.624934,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 30000,
            "tags": [
                "Sinh thái",
                "Vườn trái cây"
            ]
        },
        {
            "id": "CT_DTQ_035",
            "name": "Vườn trái cây Ba Cống",
            "lat": 10.028386,
            "lng": 105.732194,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 30000,
            "tags": [
                "Sinh thái",
                "Nông nghiệp",
                "Nghỉ ngơi"
            ]
        },
        {
            "id": "CT_DTQ_036",
            "name": "Chùa Long Quang",
            "lat": 10.065622,
            "lng": 105.727544,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Điêu khắc gỗ",
                "Di tích"
            ]
        },
        {
            "id": "CT_DTQ_037",
            "name": "Vườn Sinh Thái Xẻo Nhum",
            "lat": 9.998051,
            "lng": 105.77714,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Dã ngoại",
                "Thiên nhiên"
            ]
        },
        {
            "id": "CT_DTQ_038",
            "name": "KDL Bảo Gia Trang Viên",
            "lat": 9.960419,
            "lng": 105.758009,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 50000,
            "tags": [
                "Trải nghiệm",
                "Team building",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "CT_DTQ_039",
            "name": "Chợ nổi Phong Điền",
            "lat": 9.990308,
            "lng": 105.663285,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Giao thương sông nước",
                "Yên bình"
            ]
        },
        {
            "id": "CT_DTQ_040",
            "name": "Đình thần Tân Lộc",
            "lat": 10.214768,
            "lng": 105.602883,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Lịch sử",
                "Cù lao"
            ]
        },
        {
            "id": "CT_DTQ_041",
            "name": "Khu di tích Vườn Mận",
            "lat": 10.017876,
            "lng": 105.733935,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Khám phá",
                "Tưởng niệm"
            ]
        },
        {
            "id": "CT_DTQ_042",
            "name": "Sense City Cần Thơ",
            "lat": 10.034489,
            "lng": 105.785954,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Giải trí",
                "Trong nhà"
            ]
        },
        {
            "id": "CT_DTQ_043",
            "name": "Vincom Plaza Xuân Khánh",
            "lat": 10.024823,
            "lng": 105.775068,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Rạp chiếu phim",
                "Hiện đại"
            ]
        },
        {
            "id": "CT_DTQ_044",
            "name": "GO! Cần Thơ",
            "lat": 10.014214,
            "lng": 105.784604,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Siêu thị",
                "Mua sắm",
                "Ăn uống"
            ]
        },
        {
            "id": "CT_DTQ_045",
            "name": "Chợ An Khánh",
            "lat": 10.039457,
            "lng": 105.754502,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Đời sống",
                "Chợ truyền thống"
            ]
        },
        {
            "id": "CT_DTQ_046",
            "name": "Làng du lịch sinh thái Hoa Súng",
            "lat": 9.996179,
            "lng": 105.733711,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Bờ sông",
                "Dạ tiệc"
            ]
        },
        {
            "id": "CT_DTQ_047",
            "name": "Vườn sinh thái Lê Lộc",
            "lat": 9.985131,
            "lng": 105.741201,
            "category": "diem_tham_quan",
            "rating": 3.5,
            "price": 40000,
            "tags": [
                "Trái cây",
                "Nghỉ dưỡng",
                "Thư giãn"
            ]
        },
        {
            "id": "CT_DTQ_048",
            "name": "Chợ Tân An",
            "lat": 10.028802,
            "lng": 105.787539,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Giao thương",
                "Đời sống",
                "Sầm uất"
            ]
        },
        {
            "id": "CT_DTQ_049",
            "name": "Bảo tàng Quân khu 9",
            "lat": 10.035876,
            "lng": 105.785497,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Quân sự",
                "Lịch sử",
                "Khám phá"
            ]
        },
        {
            "id": "CT_DTQ_050",
            "name": "Khu Di Tích Chiến Thắng Ông Hào",
            "lat": 9.979307,
            "lng": 105.626451,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Khám phá",
                "Tưởng niệm"
            ]
        }
    ],
    "ca_mau": [
        {
            "id": "CAM_DTQ_001",
            "name": "Cột cờ Mũi Cà Mau",
            "lat": 8.608081,
            "lng": 104.719275,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Khám phá",
                "Biểu tượng"
            ]
        },
        {
            "id": "CAM_DTQ_002",
            "name": "Vườn Quốc gia U Minh Hạ",
            "lat": 9.19831,
            "lng": 104.95915,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 10000,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Rừng"
            ]
        },
        {
            "id": "CAM_DTQ_003",
            "name": "Hòn Đá Bạc",
            "lat": 9.179023,
            "lng": 104.802054,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 40000,
            "tags": [
                "Biển",
                "Tâm linh",
                "Phong cảnh"
            ]
        },
        {
            "id": "CAM_DTQ_004",
            "name": "Đầm Thị Tường",
            "lat": 8.999779,
            "lng": 104.935965,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Trải nghiệm",
                "Hoàng hôn"
            ]
        },
        {
            "id": "CAM_DTQ_005",
            "name": "Chợ nổi Cà Mau",
            "lat": 9.160601,
            "lng": 105.155683,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Sôi động",
                "Chèo thuyền"
            ]
        },
        {
            "id": "CAM_DTQ_006",
            "name": "Vườn chim Cà Mau",
            "lat": 9.1722,
            "lng": 105.1528,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Động vật",
                "Ngoài trời",
                "Thiên nhiên"
            ]
        },
        {
            "id": "CAM_DTQ_007",
            "name": "Rừng đước Năm Căn",
            "lat": 8.7562,
            "lng": 105.0001,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Khám phá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CAM_DTQ_008",
            "name": "Chùa Monivongsa Bopharam",
            "lat": 9.181028,
            "lng": 105.141022,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Văn hóa"
            ]
        },
        {
            "id": "CAM_DTQ_009",
            "name": "Khu du lịch Khai Long",
            "lat": 8.566853,
            "lng": 104.828653,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Biển",
                "Giải trí",
                "Gia đình"
            ]
        },
        {
            "id": "CAM_DTQ_010",
            "name": "Chùa Bà Thiên Hậu",
            "lat": 9.177787,
            "lng": 105.146526,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_011",
            "name": "Khu tưởng niệm Chủ tịch Hồ Chí Minh",
            "lat": 9.18524,
            "lng": 105.137171,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "CAM_DTQ_012",
            "name": "Đảo Hòn Khoai",
            "lat": 8.431651,
            "lng": 104.830869,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Khám phá",
                "Hải đăng"
            ]
        },
        {
            "id": "CAM_DTQ_013",
            "name": "Vườn dâu Cái Tàu",
            "lat": 9.381423,
            "lng": 105.00156,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Nông trại",
                "Sinh thái",
                "Gia đình"
            ]
        },
        {
            "id": "CAM_DTQ_014",
            "name": "Khu du lịch sinh thái Thư Duy",
            "lat": 9.164436,
            "lng": 105.219512,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Giải trí",
                "Nghỉ dưỡng",
                "Hiện đại"
            ]
        },
        {
            "id": "CAM_DTQ_015",
            "name": "Tượng Đài Cây Đước (Trung Tâm)",
            "lat": 9.176207,
            "lng": 105.150853,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Lịch sử",
                "Ngoài trời"
            ]
        },
        {
            "id": "CAM_DTQ_016",
            "name": "Lâm viên Cà Mau",
            "lat": 9.171,
            "lng": 105.148,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Đi bộ",
                "Gia đình"
            ]
        },
        {
            "id": "CAM_DTQ_017",
            "name": "Chùa Kim Sơn",
            "lat": 9.168261,
            "lng": 105.183754,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Tôn giáo",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_018",
            "name": "Đình Tân Hưng",
            "lat": 9.140742,
            "lng": 105.12918,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Tôn giáo"
            ]
        },
        {
            "id": "CAM_DTQ_019",
            "name": "Vườn Quốc gia Mũi Cà Mau",
            "lat": 8.605564,
            "lng": 104.722946,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Khám phá"
            ]
        },
        {
            "id": "CAM_DTQ_020",
            "name": "Chợ Cà Mau",
            "lat": 9.176528,
            "lng": 105.147182,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Sôi động",
                "Ẩm thực"
            ]
        },
        {
            "id": "CAM_DTQ_021",
            "name": "Cầu Gành Hào",
            "lat": 9.172333,
            "lng": 105.147884,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Giao thông",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_022",
            "name": "Bảo tàng tỉnh Cà Mau",
            "lat": 9.182044,
            "lng": 105.136122,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 10000,
            "tags": [
                "Lịch sử",
                "Trong nhà",
                "Văn hóa"
            ]
        },
        {
            "id": "CAM_DTQ_023",
            "name": "Công viên văn hóa Hùng Vương",
            "lat": 9.178857,
            "lng": 105.1517,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Giải trí",
                "Ngoài trời",
                "Gia đình"
            ]
        },
        {
            "id": "CAM_DTQ_024",
            "name": "Thánh đường Tắc Sậy",
            "lat": 9.221859,
            "lng": 105.397617,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc",
                "Tôn giáo"
            ]
        },
        {
            "id": "CAM_DTQ_025",
            "name": "Khu di tích lịch sử Lung Ngọc Hoàng",
            "lat": 9.35,
            "lng": 105.3,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Thiên nhiên",
                "Khám phá"
            ]
        },
        {
            "id": "CAM_DTQ_026",
            "name": "Cồn Ông Trang",
            "lat": 8.688525,
            "lng": 104.874336,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Hoang sơ"
            ]
        },
        {
            "id": "CAM_DTQ_027",
            "name": "Đầm Dơi",
            "lat": 8.969714,
            "lng": 105.20778,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Khám phá",
                "Thiên nhiên",
                "Trải nghiệm"
            ]
        },
        {
            "id": "CAM_DTQ_028",
            "name": "Cửa biển Sông Đốc",
            "lat": 9.040856,
            "lng": 104.830037,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sôi động",
                "Cảng cá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CAM_DTQ_029",
            "name": "Chùa Quan Âm",
            "lat": 9.139967,
            "lng": 105.210934,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Tâm linh",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_030",
            "name": "Quảng trường Thanh Niên",
            "lat": 9.186623,
            "lng": 105.167112,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sôi động",
                "Ngoài trời",
                "Sự kiện"
            ]
        },
        {
            "id": "CAM_DTQ_031",
            "name": "Khu du lịch sinh thái Mười Ngọt",
            "lat": 9.245352,
            "lng": 104.868524,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Trải nghiệm",
                "Ẩm thực",
                "Thiên nhiên"
            ]
        },
        {
            "id": "CAM_DTQ_032",
            "name": "Đầm Cùng",
            "lat": 8.853272,
            "lng": 105.019991,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Cảnh quan",
                "Sông nước",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CAM_DTQ_033",
            "name": "Khu du lịch Hương Tràm",
            "lat": 9.293388,
            "lng": 104.998469,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Sinh thái",
                "Gia đình",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "CAM_DTQ_034",
            "name": "Chùa Phổ Tạng",
            "lat": 9.188,
            "lng": 105.143,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Thanh tịnh",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_035",
            "name": "Cầu quay Cà Mau",
            "lat": 9.180839,
            "lng": 105.149411,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Biểu tượng",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CAM_DTQ_036",
            "name": "Rừng ngập mặn Năm Căn",
            "lat": 8.76,
            "lng": 105.02,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Khám phá"
            ]
        },
        {
            "id": "CAM_DTQ_037",
            "name": "Khu tưởng niệm cụ Phan Ngọc Hiển",
            "lat": 8.756809,
            "lng": 104.990437,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Tham quan"
            ]
        },
        {
            "id": "CAM_DTQ_038",
            "name": "Chợ Năm Căn",
            "lat": 8.759634,
            "lng": 104.992305,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Sôi động",
                "Đặc sản"
            ]
        },
        {
            "id": "CAM_DTQ_039",
            "name": "Khu sinh thái Đất Mũi",
            "lat": 8.605564,
            "lng": 104.722946,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Khám phá",
                "Thiên nhiên",
                "Biển"
            ]
        },
        {
            "id": "CAM_DTQ_040",
            "name": "Chùa Vạn Phước",
            "lat": 8.855762,
            "lng": 104.912056,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Tâm linh"
            ]
        },
        {
            "id": "CAM_DTQ_041",
            "name": "Công viên 19/5",
            "lat": 9.175,
            "lng": 105.153,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ngoài trời",
                "Gia đình",
                "Đi bộ"
            ]
        },
        {
            "id": "CAM_DTQ_042",
            "name": "Khu di tích lịch sử Xẻo Đước",
            "lat": 8.8,
            "lng": 104.9,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Khám phá",
                "Rừng"
            ]
        },
        {
            "id": "CAM_DTQ_043",
            "name": "Cửa biển Gành Hào",
            "lat": 9.020357,
            "lng": 105.422366,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Chụp ảnh",
                "Sôi động"
            ]
        },
        {
            "id": "CAM_DTQ_044",
            "name": "Nhà công tử Bạc Liêu (chi nhánh CM)",
            "lat": 9.18,
            "lng": 105.15,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 20000,
            "tags": [
                "Kiến trúc",
                "Lịch sử",
                "Trong nhà"
            ]
        },
        {
            "id": "CAM_DTQ_045",
            "name": "Cầu Phan Ngọc Hiển",
            "lat": 9.180937,
            "lng": 105.149357,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Giao thông",
                "Chụp ảnh",
                "Biểu tượng"
            ]
        },
        {
            "id": "CAM_DTQ_046",
            "name": "Đình thần Tân Lộc",
            "lat": 9.266983,
            "lng": 105.178792,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Tôn giáo",
                "Lịch sử"
            ]
        },
        {
            "id": "CAM_DTQ_047",
            "name": "Vườn chim Đầm Dơi",
            "lat": 8.94,
            "lng": 105.21,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Động vật",
                "Thiên nhiên",
                "Ngoài trời"
            ]
        },
        {
            "id": "CAM_DTQ_048",
            "name": "Khu du lịch Đá Bạc - Lợi An",
            "lat": 9.176095,
            "lng": 104.810054,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 40000,
            "tags": [
                "Biển",
                "Giải trí",
                "Chụp ảnh"
            ]
        },
        {
            "id": "CAM_DTQ_049",
            "name": "Chùa Bà Mã Châu",
            "lat": 9.182,
            "lng": 105.146,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Văn hóa",
                "Kiến trúc"
            ]
        },
        {
            "id": "CAM_DTQ_050",
            "name": "Biển Khai Long",
            "lat": 8.566853,
            "lng": 104.828653,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Cảnh quan"
            ]
        }
    ],
    "da_nang": [
        {
            "id": "DNG_DTQ_001",
            "name": "Sun World Bà Nà Hills",
            "lat": 15.995136,
            "lng": 107.996139,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 1000000,
            "tags": [
                "Giải trí",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DNG_DTQ_002",
            "name": "Cầu Vàng (Golden Bridge)",
            "lat": 15.996712,
            "lng": 107.996514,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Chụp ảnh",
                "Kiến trúc"
            ]
        },
        {
            "id": "DNG_DTQ_003",
            "name": "Bãi biển Mỹ Khê",
            "lat": 16.060248,
            "lng": 108.246412,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Thư giãn"
            ]
        },
        {
            "id": "DNG_DTQ_004",
            "name": "Chùa Linh Ứng Bãi Bụt",
            "lat": 16.100145,
            "lng": 108.277561,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DNG_DTQ_005",
            "name": "Danh thắng Ngũ Hành Sơn",
            "lat": 15.9755,
            "lng": 108.2609,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Thiên nhiên",
                "Lịch sử",
                "Tâm linh"
            ]
        },
        {
            "id": "DNG_DTQ_006",
            "name": "Cầu Rồng",
            "lat": 16.061124,
            "lng": 108.227231,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Kiến trúc",
                "Giải trí"
            ]
        },
        {
            "id": "DNG_DTQ_007",
            "name": "Bảo tàng Điêu khắc Chăm",
            "lat": 16.061214,
            "lng": 108.224152,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 60000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Nghệ thuật"
            ]
        },
        {
            "id": "DNG_DTQ_008",
            "name": "Công viên Châu Á (Asia Park)",
            "lat": 16.038412,
            "lng": 108.226514,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 250000,
            "tags": [
                "Giải trí",
                "Hiện đại",
                "Gia đình"
            ]
        },
        {
            "id": "DNG_DTQ_009",
            "name": "Núi Thần Tài (Hot Spring Park)",
            "lat": 15.981245,
            "lng": 107.971241,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 450000,
            "tags": [
                "Nghỉ dưỡng",
                "Thiên nhiên",
                "Sức khỏe"
            ]
        },
        {
            "id": "DNG_DTQ_010",
            "name": "Cầu Sông Hàn",
            "lat": 16.072214,
            "lng": 108.227541,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Kỹ thuật",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DNG_DTQ_011",
            "name": "Bán đảo Sơn Trà",
            "lat": 16.121245,
            "lng": 108.271241,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Sinh thái"
            ]
        },
        {
            "id": "DNG_DTQ_012",
            "name": "Đỉnh Bàn Cờ",
            "lat": 16.11862,
            "lng": 108.27304,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Thiên nhiên",
                "Trekking"
            ]
        },
        {
            "id": "DNG_DTQ_013",
            "name": "Bảo tàng Tranh 3D Art",
            "lat": 16.091214,
            "lng": 108.241214,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 140000,
            "tags": [
                "Nghệ thuật",
                "Trong nhà",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_014",
            "name": "Nhà thờ Chính tòa (Con Gà)",
            "lat": 16.066741,
            "lng": 108.223412,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo",
                "Lịch sử"
            ]
        },
        {
            "id": "DNG_DTQ_015",
            "name": "Chợ Hàn",
            "lat": 16.068214,
            "lng": 108.224152,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Văn hóa",
                "Ẩm thực"
            ]
        },
        {
            "id": "DNG_DTQ_016",
            "name": "Công viên APEC",
            "lat": 16.060145,
            "lng": 108.225412,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Nghệ thuật",
                "Chụp ảnh",
                "Hiện đại"
            ]
        },
        {
            "id": "DNG_DTQ_017",
            "name": "Mikazuki Water Park 365",
            "lat": 16.112145,
            "lng": 108.161241,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 350000,
            "tags": [
                "Giải trí",
                "Trong nhà",
                "Nhật Bản"
            ]
        },
        {
            "id": "DNG_DTQ_018",
            "name": "Đèo Hải Vân",
            "lat": 16.186712,
            "lng": 108.131241,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DNG_DTQ_019",
            "name": "Động Âm Phủ",
            "lat": 15.975412,
            "lng": 108.261241,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 20000,
            "tags": [
                "Khám phá",
                "Tâm linh",
                "Hang động"
            ]
        },
        {
            "id": "DNG_DTQ_020",
            "name": "Chùa Linh Ứng Non Nước",
            "lat": 15.976512,
            "lng": 108.264124,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Lịch sử",
                "Kiến trúc"
            ]
        },
        {
            "id": "DNG_DTQ_021",
            "name": "Bảo tàng Đà Nẵng",
            "lat": 16.075412,
            "lng": 108.223412,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "DNG_DTQ_022",
            "name": "Bảo tàng Mỹ thuật Đà Nẵng",
            "lat": 16.071241,
            "lng": 108.221241,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 20000,
            "tags": [
                "Nghệ thuật",
                "Trong nhà",
                "Sáng tạo"
            ]
        },
        {
            "id": "DNG_DTQ_023",
            "name": "Cầu Thuận Phước",
            "lat": 16.095412,
            "lng": 108.221241,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Ngắm cảnh",
                "Kỹ thuật"
            ]
        },
        {
            "id": "DNG_DTQ_024",
            "name": "Ghềnh Bàng",
            "lat": 16.126514,
            "lng": 108.312412,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Hoang sơ",
                "Lặn biển"
            ]
        },
        {
            "id": "DNG_DTQ_025",
            "name": "Rạn Nam Ô",
            "lat": 16.115412,
            "lng": 108.131241,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Biển",
                "Rêu xanh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_026",
            "name": "Tượng Cá Chép Hóa Rồng",
            "lat": 16.061214,
            "lng": 108.228541,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Chụp ảnh",
                "Sông Hàn"
            ]
        },
        {
            "id": "DNG_DTQ_027",
            "name": "Cầu Tình Yêu",
            "lat": 16.061412,
            "lng": 108.228741,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Lãng mạn",
                "Chụp ảnh",
                "Giải trí"
            ]
        },
        {
            "id": "DNG_DTQ_028",
            "name": "Nhà trưng bày Hoàng Sa",
            "lat": 16.096741,
            "lng": 108.248541,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Chính trị",
                "Văn hóa"
            ]
        },
        {
            "id": "DNG_DTQ_029",
            "name": "Chùa Quan Thế Âm",
            "lat": 15.971241,
            "lng": 108.251241,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Lễ hội",
                "Kiến trúc"
            ]
        },
        {
            "id": "DNG_DTQ_030",
            "name": "Làng đá mỹ nghệ Non Nước",
            "lat": 15.971412,
            "lng": 108.261412,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Thủ công",
                "Lịch sử",
                "Mua sắm"
            ]
        },
        {
            "id": "DNG_DTQ_031",
            "name": "Suối Lương (Hai Van Park)",
            "lat": 16.161241,
            "lng": 108.131241,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 50000,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Cắm trại"
            ]
        },
        {
            "id": "DNG_DTQ_032",
            "name": "Khu du lịch Hòa Phú Thành",
            "lat": 15.961241,
            "lng": 107.971241,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 100000,
            "tags": [
                "Mạo hiểm",
                "Trượt thác",
                "Thiên nhiên"
            ]
        },
        {
            "id": "DNG_DTQ_033",
            "name": "Bảo tàng Đồng Đình",
            "lat": 16.101241,
            "lng": 108.261241,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 20000,
            "tags": [
                "Văn hóa",
                "Nghệ thuật",
                "Thiên nhiên"
            ]
        },
        {
            "id": "DNG_DTQ_034",
            "name": "Hồ Đồng Xanh - Đồng Nghệ",
            "lat": 15.951241,
            "lng": 108.111241,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Yên tĩnh",
                "Chèo thuyền"
            ]
        },
        {
            "id": "DNG_DTQ_035",
            "name": "Bãi biển Non Nước",
            "lat": 15.971241,
            "lng": 108.265412,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Biển",
                "Nghỉ dưỡng",
                "Thư giãn"
            ]
        },
        {
            "id": "DNG_DTQ_036",
            "name": "Hải đăng Sơn Trà",
            "lat": 16.136741,
            "lng": 108.241241,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_037",
            "name": "Cung Văn hóa Thiếu nhi",
            "lat": 16.035412,
            "lng": 108.221241,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Nghệ thuật",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_038",
            "name": "Upside Down World Danang",
            "lat": 16.046741,
            "lng": 108.243412,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 130000,
            "tags": [
                "Giải trí",
                "Sáng tạo",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_039",
            "name": "Chợ Cồn",
            "lat": 16.066741,
            "lng": 108.216741,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Văn hóa",
                "Mua sắm"
            ]
        },
        {
            "id": "DNG_DTQ_040",
            "name": "Cầu Trần Thị Lý",
            "lat": 16.051241,
            "lng": 108.228741,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Ánh sáng",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DNG_DTQ_041",
            "name": "Bãi biển Xuân Thiều",
            "lat": 16.111241,
            "lng": 108.151241,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Biển",
                "Yên tĩnh",
                "Bình minh"
            ]
        },
        {
            "id": "DNG_DTQ_042",
            "name": "Làng cổ Phong Nam",
            "lat": 15.961241,
            "lng": 108.181241,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Nông thôn",
                "Kiến trúc"
            ]
        },
        {
            "id": "DNG_DTQ_043",
            "name": "Khu sinh thái Suối Mơ",
            "lat": 15.991241,
            "lng": 108.011241,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 40000,
            "tags": [
                "Thiên nhiên",
                "Tắm suối",
                "Thư giãn"
            ]
        },
        {
            "id": "DNG_DTQ_044",
            "name": "Giếng Trời",
            "lat": 15.971241,
            "lng": 107.951241,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Hoang sơ",
                "Trekking",
                "Thiên nhiên"
            ]
        },
        {
            "id": "DNG_DTQ_045",
            "name": "Bãi Bụt",
            "lat": 16.101241,
            "lng": 108.271241,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Biển",
                "Dã ngoại",
                "Thiên nhiên"
            ]
        },
        {
            "id": "DNG_DTQ_046",
            "name": "Công viên Biển Đông",
            "lat": 16.071241,
            "lng": 108.246741,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Ngoài trời",
                "Sự kiện",
                "Chim bồ câu"
            ]
        },
        {
            "id": "DNG_DTQ_047",
            "name": "Sky36",
            "lat": 16.076741,
            "lng": 108.224121,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Giải trí đêm",
                "Ngắm cảnh",
                "Hiện đại"
            ]
        },
        {
            "id": "DNG_DTQ_048",
            "name": "Hải đăng Tiên Sa",
            "lat": 16.136712,
            "lng": 108.241245,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Kiến trúc Pháp",
                "Biển"
            ]
        },
        {
            "id": "DNG_DTQ_049",
            "name": "Helio Center",
            "lat": 16.035412,
            "lng": 108.224512,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Giải trí",
                "Ẩm thực",
                "Chợ đêm"
            ]
        },
        {
            "id": "DNG_DTQ_050",
            "name": "Chùa Tam Thai",
            "lat": 15.975412,
            "lng": 108.261245,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Cổ kính",
                "Lịch sử"
            ]
        }
    ],
    "ha_noi": [
        {
            "id": "HN_DTQ_001",
            "name": "Văn Miếu - Quốc Tử Giám",
            "lat": 21.028267,
            "lng": 105.83569,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 70000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "HN_DTQ_002",
            "name": "Hoàng thành Thăng Long",
            "lat": 21.035453,
            "lng": 105.840377,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 100000,
            "tags": [
                "Lịch sử",
                "Di sản",
                "Rộng lớn"
            ]
        },
        {
            "id": "HN_DTQ_003",
            "name": "Lăng Chủ tịch Hồ Chí Minh",
            "lat": 21.037077,
            "lng": 105.834752,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Tôn nghiêm"
            ]
        },
        {
            "id": "HN_DTQ_004",
            "name": "Đền Ngọc Sơn",
            "lat": 21.030868,
            "lng": 105.852321,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 30000,
            "tags": [
                "Lịch sử",
                "Tâm linh",
                "Phong cảnh"
            ]
        },
        {
            "id": "HN_DTQ_005",
            "name": "Hồ Hoàn Kiếm",
            "lat": 21.029165,
            "lng": 105.852536,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Ngoài trời"
            ]
        },
        {
            "id": "HN_DTQ_006",
            "name": "Nhà hát Lớn Hà Nội",
            "lat": 21.024474,
            "lng": 105.857625,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 120000,
            "tags": [
                "Kiến trúc",
                "Nghệ thuật"
            ]
        },
        {
            "id": "HN_DTQ_007",
            "name": "Chợ Đồng Xuân",
            "lat": 21.038333,
            "lng": 105.85006,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Văn hóa"
            ]
        },
        {
            "id": "HN_DTQ_008",
            "name": "Nhà tù Hỏa Lò",
            "lat": 21.025529,
            "lng": 105.846585,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 50000,
            "tags": [
                "Lịch sử",
                "Trong nhà"
            ]
        },
        {
            "id": "HN_DTQ_009",
            "name": "Bảo tàng Dân tộc học VN",
            "lat": 21.040452,
            "lng": 105.798681,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 40000,
            "tags": [
                "Văn hóa",
                "Trưng bày"
            ]
        },
        {
            "id": "HN_DTQ_010",
            "name": "Chùa Một Cột",
            "lat": 21.035927,
            "lng": 105.833394,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo"
            ]
        },
        {
            "id": "HN_DTQ_011",
            "name": "Chùa Trấn Quốc",
            "lat": 21.04804,
            "lng": 105.836901,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Cảnh quan"
            ]
        },
        {
            "id": "HN_DTQ_012",
            "name": "Phố cổ Hà Nội",
            "lat": 21.034269,
            "lng": 105.850636,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Ẩm thực"
            ]
        },
        {
            "id": "HN_DTQ_013",
            "name": "Nhà thờ Lớn Hà Nội",
            "lat": 21.028915,
            "lng": 105.848789,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo"
            ]
        },
        {
            "id": "HN_DTQ_014",
            "name": "Làng gốm Bát Tràng",
            "lat": 20.975229,
            "lng": 105.913425,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Nghề truyền thống",
                "Mua sắm"
            ]
        },
        {
            "id": "HN_DTQ_015",
            "name": "Phố đi bộ Tạ Hiện",
            "lat": 21.035338,
            "lng": 105.852449,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Giải trí",
                "Ẩm thực đêm"
            ]
        },
        {
            "id": "HN_DTQ_016",
            "name": "Chùa Hương",
            "lat": 20.633698,
            "lng": 105.744317,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Thiên nhiên"
            ]
        },
        {
            "id": "HN_DTQ_017",
            "name": "Vườn Quốc gia Ba Vì",
            "lat": 21.081281,
            "lng": 105.362795,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 60000,
            "tags": [
                "Thiên nhiên",
                "Khám phá"
            ]
        },
        {
            "id": "HN_DTQ_018",
            "name": "Thung lũng hoa Hồ Tây",
            "lat": 21.074323,
            "lng": 105.819681,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 120000,
            "tags": [
                "Cảnh quan",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HN_DTQ_019",
            "name": "Bãi đá sông Hồng",
            "lat": 21.078832,
            "lng": 105.835245,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 50000,
            "tags": [
                "Dã ngoại",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HN_DTQ_020",
            "name": "Làng cổ Đường Lâm",
            "lat": 21.157445,
            "lng": 105.472608,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 20000,
            "tags": [
                "Kiến trúc cổ",
                "Văn hóa"
            ]
        },
        {
            "id": "HN_DTQ_021",
            "name": "Bảo tàng Lịch sử QG",
            "lat": 21.024767,
            "lng": 105.859573,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Lịch sử",
                "Trưng bày"
            ]
        },
        {
            "id": "HN_DTQ_022",
            "name": "Bảo tàng Mỹ thuật VN",
            "lat": 21.030744,
            "lng": 105.83703,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Nghệ thuật",
                "Trưng bày"
            ]
        },
        {
            "id": "HN_DTQ_023",
            "name": "Bảo tàng Hà Nội",
            "lat": 21.013534,
            "lng": 105.786459,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 30000,
            "tags": [
                "Hiện đại",
                "Lịch sử"
            ]
        },
        {
            "id": "HN_DTQ_024",
            "name": "Khu du lịch Long Việt",
            "lat": 21.087023,
            "lng": 105.402344,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 75000,
            "tags": [
                "Sinh thái",
                "Dã ngoại"
            ]
        },
        {
            "id": "HN_DTQ_025",
            "name": "Thiên Sơn - Suối Ngà",
            "lat": 21.072376,
            "lng": 105.386545,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 150000,
            "tags": [
                "Thiên nhiên",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "HN_DTQ_026",
            "name": "Trang trại Đồng Quê Ba Vì",
            "lat": 21.087662,
            "lng": 105.396717,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 200000,
            "tags": [
                "Sinh thái",
                "Gia đình"
            ]
        },
        {
            "id": "HN_DTQ_027",
            "name": "Làng Văn hóa các Dân tộc",
            "lat": 21.02395,
            "lng": 105.460488,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 30000,
            "tags": [
                "Văn hóa",
                "Khám phá"
            ]
        },
        {
            "id": "HN_DTQ_028",
            "name": "Cầu Long Biên",
            "lat": 21.04242,
            "lng": 105.854479,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Cảnh quan"
            ]
        },
        {
            "id": "HN_DTQ_029",
            "name": "Đền Quán Thánh",
            "lat": 21.043215,
            "lng": 105.836494,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 10000,
            "tags": [
                "Tôn giáo",
                "Lịch sử"
            ]
        },
        {
            "id": "HN_DTQ_030",
            "name": "Cột cờ Hà Nội",
            "lat": 21.032625,
            "lng": 105.839728,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Di tích",
                "Biểu tượng"
            ]
        },
        {
            "id": "HN_DTQ_031",
            "name": "Hồ Tây",
            "lat": 21.054908,
            "lng": 105.822362,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Phong cảnh",
                "Giải trí"
            ]
        },
        {
            "id": "HN_DTQ_032",
            "name": "Phố đường tàu (Train Street)",
            "lat": 21.032023,
            "lng": 105.845101,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Độc đáo"
            ]
        },
        {
            "id": "HN_DTQ_033",
            "name": "Di tích Nhà 87 Mã Mây",
            "lat": 21.034629,
            "lng": 105.853576,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 10000,
            "tags": [
                "Kiến trúc cổ",
                "Phố cổ"
            ]
        },
        {
            "id": "HN_DTQ_034",
            "name": "Bảo tàng Phụ nữ VN",
            "lat": 21.023473,
            "lng": 105.8515,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 40000,
            "tags": [
                "Văn hóa",
                "Trưng bày"
            ]
        },
        {
            "id": "HN_DTQ_035",
            "name": "Chùa Thầy",
            "lat": 21.023178,
            "lng": 105.646422,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 30000,
            "tags": [
                "Tâm linh",
                "Núi non"
            ]
        },
        {
            "id": "HN_DTQ_036",
            "name": "Đền Bạch Mã",
            "lat": 21.036133,
            "lng": 105.851105,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Tôn giáo"
            ]
        },
        {
            "id": "HN_DTQ_037",
            "name": "Đền Kim Liên",
            "lat": 21.010852,
            "lng": 105.838232,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tứ trấn",
                "Lịch sử"
            ]
        },
        {
            "id": "HN_DTQ_038",
            "name": "Đền Voi Phục",
            "lat": 21.03076,
            "lng": 105.804163,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Tứ trấn",
                "Tôn giáo"
            ]
        },
        {
            "id": "HN_DTQ_039",
            "name": "Núi Trầm",
            "lat": 20.94043,
            "lng": 105.694833,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Dã ngoại",
                "Leo núi"
            ]
        },
        {
            "id": "HN_DTQ_040",
            "name": "Chợ đêm phố cổ",
            "lat": 21.033952,
            "lng": 105.85096,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Sôi động"
            ]
        },
        {
            "id": "HN_DTQ_041",
            "name": "Công viên Thủ Lệ",
            "lat": 21.031248,
            "lng": 105.803657,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 30000,
            "tags": [
                "Gia đình",
                "Động vật"
            ]
        },
        {
            "id": "HN_DTQ_042",
            "name": "Lotte Observation Deck",
            "lat": 21.032252,
            "lng": 105.812563,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 230000,
            "tags": [
                "Ngắm cảnh",
                "Hiện đại"
            ]
        },
        {
            "id": "HN_DTQ_043",
            "name": "Khu di tích Cổ Loa",
            "lat": 21.11168,
            "lng": 105.873337,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 10000,
            "tags": [
                "Lịch sử",
                "Khảo cổ"
            ]
        },
        {
            "id": "HN_DTQ_044",
            "name": "Làng lụa Vạn Phúc",
            "lat": 20.980283,
            "lng": 105.777192,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Làng nghề",
                "Mua sắm"
            ]
        },
        {
            "id": "HN_DTQ_045",
            "name": "Thủy cung Lotte World",
            "lat": 21.076207,
            "lng": 105.812966,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 280000,
            "tags": [
                "Giải trí",
                "Hiện đại"
            ]
        },
        {
            "id": "HN_DTQ_046",
            "name": "Tháp nước Hàng Đậu",
            "lat": 21.040226,
            "lng": 105.847378,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Lịch sử"
            ]
        },
        {
            "id": "HN_DTQ_047",
            "name": "Công viên Yên Sở",
            "lat": 20.964641,
            "lng": 105.85469,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Dã ngoại",
                "Xanh mát"
            ]
        },
        {
            "id": "HN_DTQ_048",
            "name": "Múa rối nước Thăng Long",
            "lat": 21.031772,
            "lng": 105.853378,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 150000,
            "tags": [
                "Nghệ thuật",
                "Văn hóa"
            ]
        },
        {
            "id": "HN_DTQ_049",
            "name": "Chợ hoa Quảng Bá",
            "lat": 21.073491,
            "lng": 105.828462,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Sôi động",
                "Đêm khuya"
            ]
        },
        {
            "id": "HN_DTQ_050",
            "name": "Phố bích họa Phùng Hưng",
            "lat": 21.038549,
            "lng": 105.846747,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Nghệ thuật"
            ]
        }
    ],
    "hoi_an": [
        {
            "id": "HA_DTQ_001",
            "name": "Chùa Cầu",
            "lat": 15.876853,
            "lng": 108.326128,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 80000,
            "tags": [
                "Biểu tượng di sản",
                "Kiến trúc Nhật"
            ]
        },
        {
            "id": "HA_DTQ_002",
            "name": "Hội quán Phúc Kiến",
            "lat": 15.877397,
            "lng": 108.332306,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 80000,
            "tags": [
                "Kiến trúc Hoa",
                "Tâm linh"
            ]
        },
        {
            "id": "HA_DTQ_003",
            "name": "Nhà cổ Tấn Ký",
            "lat": 15.876481,
            "lng": 108.32825,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 80000,
            "tags": [
                "Di sản quốc gia",
                "Nhà cổ"
            ]
        },
        {
            "id": "HA_DTQ_004",
            "name": "Hội quán Quảng Đông",
            "lat": 15.877286,
            "lng": 108.326858,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 80000,
            "tags": [
                "Di tích người Hoa",
                "Mỹ thuật"
            ]
        },
        {
            "id": "HA_DTQ_005",
            "name": "Nhà cổ Phùng Hưng",
            "lat": 15.877134,
            "lng": 108.326081,
            "category": "diem_tham_quan",
            "rating": 3.7,
            "price": 80000,
            "tags": [
                "Giao thoa văn hóa",
                "Gỗ quý"
            ]
        },
        {
            "id": "HA_DTQ_006",
            "name": "Nhà thờ tộc Trần",
            "lat": 15.87895,
            "lng": 108.328012,
            "category": "diem_tham_quan",
            "rating": 3.7,
            "price": 80000,
            "tags": [
                "Phong thủy Việt",
                "Nhà thờ cổ"
            ]
        },
        {
            "id": "HA_DTQ_007",
            "name": "Bảo tàng Sa Huỳnh",
            "lat": 15.877025,
            "lng": 108.325041,
            "category": "diem_tham_quan",
            "rating": 3.7,
            "price": 80000,
            "tags": [
                "Khảo cổ",
                "Lịch sử cổ đại"
            ]
        },
        {
            "id": "HA_DTQ_008",
            "name": "Bảo tàng Gốm sứ",
            "lat": 15.877341,
            "lng": 108.329584,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 80000,
            "tags": [
                "Thương cảng",
                "Con đường tơ lụa"
            ]
        },
        {
            "id": "HA_DTQ_009",
            "name": "Bảo tàng Dân gian",
            "lat": 15.876321,
            "lng": 108.331521,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 80000,
            "tags": [
                "Nghề truyền thống",
                "Đời sống"
            ]
        },
        {
            "id": "HA_DTQ_010",
            "name": "Đình Cẩm Phô",
            "lat": 15.877843,
            "lng": 108.323521,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 80000,
            "tags": [
                "Đình làng cổ",
                "Lễ hội"
            ]
        },
        {
            "id": "HA_DTQ_011",
            "name": "Miếu Quan Công",
            "lat": 15.877412,
            "lng": 108.331045,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc uy nghi"
            ]
        },
        {
            "id": "HA_DTQ_012",
            "name": "Nhà cổ Đức An",
            "lat": 15.877543,
            "lng": 108.329021,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 80000,
            "tags": [
                "Trầm mặc",
                "Di tích lịch sử"
            ]
        },
        {
            "id": "HA_DTQ_013",
            "name": "Nhà cổ Quân Thắng",
            "lat": 15.877231,
            "lng": 108.330045,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 80000,
            "tags": [
                "Nghệ thuật điêu khắc",
                "Cổ kính"
            ]
        },
        {
            "id": "HA_DTQ_014",
            "name": "Hội quán Hải Nam",
            "lat": 15.877843,
            "lng": 108.332512,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 80000,
            "tags": [
                "Di tích cộng đồng",
                "Văn hóa"
            ]
        },
        {
            "id": "HA_DTQ_015",
            "name": "Xứ Đàng Trong",
            "lat": 15.876843,
            "lng": 108.330245,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 80000,
            "tags": [
                "Biểu diễn nghệ thuật",
                "Di sản"
            ]
        },
        {
            "id": "HA_DTQ_016",
            "name": "Lăng mộ Gu Sokukun",
            "lat": 15.885045,
            "lng": 108.314521,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 80000,
            "tags": [
                "Lịch sử Nhật Bản",
                "Di tích"
            ]
        },
        {
            "id": "HA_DTQ_017",
            "name": "Rừng dừa Bảy Mẫu",
            "lat": 15.865012,
            "lng": 108.365045,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 30000,
            "tags": [
                "Sinh thái",
                "Thuyền thúng"
            ]
        },
        {
            "id": "HA_DTQ_018",
            "name": "Làng gốm Thanh Hà",
            "lat": 15.878021,
            "lng": 108.305045,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 35000,
            "tags": [
                "Nghề cổ",
                "Trải nghiệm nặn gốm"
            ]
        },
        {
            "id": "HA_DTQ_019",
            "name": "Công viên Terracotta",
            "lat": 15.878543,
            "lng": 108.305512,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 35000,
            "tags": [
                "Kiến trúc gốm",
                "Nghệ thuật"
            ]
        },
        {
            "id": "HA_DTQ_020",
            "name": "Làng rau Trà Quế",
            "lat": 15.905012,
            "lng": 108.342045,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 35000,
            "tags": [
                "Nông nghiệp xanh",
                "Cooking"
            ]
        },
        {
            "id": "HA_DTQ_021",
            "name": "Làng mộc Kim Bồng",
            "lat": 15.868045,
            "lng": 108.325012,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Chạm khắc",
                "Đóng thuyền"
            ]
        },
        {
            "id": "HA_DTQ_022",
            "name": "Đảo Cù Lao Chàm",
            "lat": 15.951111,
            "lng": 108.523056,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 70000,
            "tags": [
                "Sinh quyển thế giới",
                "Biển"
            ]
        },
        {
            "id": "HA_DTQ_023",
            "name": "Chùa Hải Tạng",
            "lat": 15.946012,
            "lng": 108.514012,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Cổ tự biển đảo",
                "Tâm linh"
            ]
        },
        {
            "id": "HA_DTQ_024",
            "name": "Giếng cổ Chăm-pa",
            "lat": 15.945512,
            "lng": 108.516045,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Lịch sử Chăm",
                "Nguồn nước"
            ]
        },
        {
            "id": "HA_DTQ_025",
            "name": "VinWonders Nam Hội An",
            "lat": 15.815045,
            "lng": 108.375012,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 650000,
            "tags": [
                "Giải trí hiện đại",
                "Safari"
            ]
        },
        {
            "id": "HA_DTQ_026",
            "name": "Công viên Ấn tượng",
            "lat": 15.874512,
            "lng": 108.338521,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 100000,
            "tags": [
                "Thực cảnh",
                "Văn hóa"
            ]
        },
        {
            "id": "HA_DTQ_027",
            "name": "Show Ký ức Hội An",
            "lat": 15.874012,
            "lng": 108.338012,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 600000,
            "tags": [
                "Nghệ thuật thực cảnh",
                "Đỉnh cao"
            ]
        },
        {
            "id": "HA_DTQ_028",
            "name": "Chùa Bà Mụ",
            "lat": 15.877912,
            "lng": 108.328512,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Check-in",
                "Kiến trúc tâm linh"
            ]
        },
        {
            "id": "HA_DTQ_029",
            "name": "Làng Lụa Hội An",
            "lat": 15.885512,
            "lng": 108.321045,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 50000,
            "tags": [
                "Dệt lụa",
                "Văn hóa tơ lụa"
            ]
        },
        {
            "id": "HA_DTQ_030",
            "name": "Biển An Bàng",
            "lat": 15.912045,
            "lng": 108.351021,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Bãi biển top châu Á",
                "Thư giãn"
            ]
        },
        {
            "id": "HA_DTQ_031",
            "name": "Biển Cửa Đại",
            "lat": 15.895012,
            "lng": 108.375045,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Nghỉ dưỡng",
                "Hải sản"
            ]
        },
        {
            "id": "HA_DTQ_032",
            "name": "Sông Hoài",
            "lat": 15.876045,
            "lng": 108.327512,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Thả hoa đăng",
                "Thuyền dòng"
            ]
        },
        {
            "id": "HA_DTQ_033",
            "name": "Chợ Hội An",
            "lat": 15.878234,
            "lng": 108.331821,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Ẩm thực bản địa",
                "Mua sắm"
            ]
        },
        {
            "id": "HA_DTQ_034",
            "name": "Chợ đêm Nguyễn Hoàng",
            "lat": 15.876512,
            "lng": 108.326212,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Đèn lồng",
                "Quà lưu niệm"
            ]
        },
        {
            "id": "HA_DTQ_035",
            "name": "Phố đèn lồng",
            "lat": 15.877045,
            "lng": 108.328021,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Check-in rực rỡ",
                "Đêm phố cổ"
            ]
        },
        {
            "id": "HA_DTQ_036",
            "name": "Hẻm tường vàng",
            "lat": 15.877234,
            "lng": 108.329245,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Đặc sản ảnh",
                "Kiến trúc hẻm"
            ]
        },
        {
            "id": "HA_DTQ_037",
            "name": "Faifo Coffee",
            "lat": 15.877341,
            "lng": 108.330812,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Cà phê view cao",
                "Toàn cảnh"
            ]
        },
        {
            "id": "HA_DTQ_038",
            "name": "Làng đúc đồng",
            "lat": 15.885012,
            "lng": 108.285045,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Đúc đồng",
                "Cồng chiêng"
            ]
        },
        {
            "id": "HA_DTQ_039",
            "name": "Tụy Tiên Đường",
            "lat": 15.877543,
            "lng": 108.327821,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 80000,
            "tags": [
                "Di tích Minh Hương",
                "Văn hóa"
            ]
        },
        {
            "id": "HA_DTQ_040",
            "name": "Bảo tàng Nghề Y",
            "lat": 15.876612,
            "lng": 108.328512,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 80000,
            "tags": [
                "Lịch sử y dược",
                "Nhà cổ"
            ]
        },
        {
            "id": "HA_DTQ_041",
            "name": "Chùa Viên Giác",
            "lat": 15.882045,
            "lng": 108.335012,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Cổ tự yên bình",
                "Kiến trúc"
            ]
        },
        {
            "id": "HA_DTQ_042",
            "name": "Chùa Chúc Thánh",
            "lat": 15.889012,
            "lng": 108.332045,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tổ đình lâu đời",
                "Cổ kính"
            ]
        },
        {
            "id": "HA_DTQ_043",
            "name": "Nhà thờ tộc Nguyễn Tường",
            "lat": 15.878045,
            "lng": 108.324512,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 80000,
            "tags": [
                "Văn học",
                "Di tích dòng họ"
            ]
        },
        {
            "id": "HA_DTQ_044",
            "name": "Lò gạch cũ Duy Vinh",
            "lat": 15.845012,
            "lng": 108.315045,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Check-in đồng lúa",
                "Hoang sơ"
            ]
        },
        {
            "id": "HA_DTQ_045",
            "name": "Cầu An Hội",
            "lat": 15.876543,
            "lng": 108.327021,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "View sông Hoài",
                "Check-in"
            ]
        },
        {
            "id": "HA_DTQ_046",
            "name": "Roving Chillhouse",
            "lat": 15.892045,
            "lng": 108.345021,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Cafe cánh đồng",
                "Thư giãn"
            ]
        },
        {
            "id": "HA_DTQ_047",
            "name": "Bảo tàng Hội An",
            "lat": 15.878012,
            "lng": 108.329045,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 80000,
            "tags": [
                "Lịch sử thành phố",
                "Hiện vật"
            ]
        },
        {
            "id": "HA_DTQ_048",
            "name": "Đảo Ký Ức Hội An",
            "lat": 15.874234,
            "lng": 108.338212,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Điểm check-in",
                "Resort"
            ]
        },
        {
            "id": "HA_DTQ_049",
            "name": "Sân bóng rổ Lễ Nghĩa",
            "lat": 15.878512,
            "lng": 108.328812,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Phim trường",
                "Thanh xuân"
            ]
        },
        {
            "id": "HA_DTQ_050",
            "name": "Phố cổ Hội An",
            "lat": 15.877012,
            "lng": 108.328045,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 120000,
            "tags": [
                "Di sản UNESCO",
                "Đi bộ"
            ]
        }
    ],
    "lam_dong": [
        {
            "id": "DAL_DTQ_001",
            "name": "Hồ Xuân Hương",
            "lat": 11.936089,
            "lng": 108.44154,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Lãng mạn"
            ]
        },
        {
            "id": "DAL_DTQ_002",
            "name": "Chợ Đà Lạt",
            "lat": 11.929958,
            "lng": 108.436878,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Ẩm thực",
                "Văn hóa"
            ]
        },
        {
            "id": "DAL_DTQ_003",
            "name": "Nhà thờ Con Gà",
            "lat": 11.903629,
            "lng": 108.437711,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_004",
            "name": "Dinh Bảo Đại (Dinh III)",
            "lat": 11.903432,
            "lng": 108.429638,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Kiến trúc",
                "Trong nhà"
            ]
        },
        {
            "id": "DAL_DTQ_005",
            "name": "Thiền Viện Trúc Lâm",
            "lat": 11.97881,
            "lng": 108.435711,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Thiên nhiên",
                "Tâm linh"
            ]
        },
        {
            "id": "DAL_DTQ_006",
            "name": "Thác Datanla",
            "lat": 12.019321,
            "lng": 108.4497,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 60000,
            "tags": [
                "Thiên nhiên",
                "Giải trí",
                "Khám phá"
            ]
        },
        {
            "id": "DAL_DTQ_007",
            "name": "Thung Lũng Tình Yêu",
            "lat": 11.939362,
            "lng": 108.448308,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Lãng mạn",
                "Ngoài trời",
                "Giải trí"
            ]
        },
        {
            "id": "DAL_DTQ_008",
            "name": "Khu Du Lịch Langbiang",
            "lat": 11.941617,
            "lng": 108.424388,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 100000,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Leo núi"
            ]
        },
        {
            "id": "DAL_DTQ_009",
            "name": "Quảng Trường Lâm Viên",
            "lat": 11.944633,
            "lng": 108.445203,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sôi động",
                "Ngoài trời",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_010",
            "name": "Ga Đà Lạt",
            "lat": 11.950248,
            "lng": 108.454465,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 10000,
            "tags": [
                "Lịch sử",
                "Kiến trúc Pháp",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_011",
            "name": "Chùa Linh Phước",
            "lat": 11.89983,
            "lng": 108.499322,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Nghệ thuật"
            ]
        },
        {
            "id": "DAL_DTQ_012",
            "name": "Vườn Hoa Thành Phố Đà Lạt",
            "lat": 11.923215,
            "lng": 108.449829,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 100000,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Hoa"
            ]
        },
        {
            "id": "DAL_DTQ_013",
            "name": "Hồ Tuyền Lâm",
            "lat": 12.026012,
            "lng": 108.42983,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Lãng mạn"
            ]
        },
        {
            "id": "DAL_DTQ_014",
            "name": "Cáp Treo Đà Lạt (Đồi Robin)",
            "lat": 11.701881,
            "lng": 108.443778,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 150000,
            "tags": [
                "Ngắm cảnh",
                "Giải trí",
                "Thiên nhiên"
            ]
        },
        {
            "id": "DAL_DTQ_015",
            "name": "Làng Cù Lần",
            "lat": 11.940772,
            "lng": 108.3637,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 150000,
            "tags": [
                "Văn hóa dân tộc",
                "Khám phá",
                "Sinh thái"
            ]
        },
        {
            "id": "DAL_DTQ_016",
            "name": "Samten Hills Đà Lạt",
            "lat": 11.941401,
            "lng": 108.41973,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 250000,
            "tags": [
                "Tâm linh",
                "Kiến trúc Tây Tạng",
                "Tôn giáo"
            ]
        },
        {
            "id": "DAL_DTQ_017",
            "name": "Bảo Tàng Lâm Đồng",
            "lat": 11.963378,
            "lng": 108.459852,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 22000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "DAL_DTQ_018",
            "name": "Chợ Đêm Đà Lạt",
            "lat": 11.877211,
            "lng": 108.437291,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Mua sắm",
                "Sôi động"
            ]
        },
        {
            "id": "DAL_DTQ_019",
            "name": "Thiền Viện Vạn Hạnh",
            "lat": 11.950169,
            "lng": 108.444231,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Tâm linh",
                "Yên tĩnh"
            ]
        },
        {
            "id": "DAL_DTQ_020",
            "name": "Thác Prenn",
            "lat": 11.947693,
            "lng": 108.470557,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_021",
            "name": "Chùa Linh Sơn",
            "lat": 11.824434,
            "lng": 108.436954,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Tâm linh"
            ]
        },
        {
            "id": "DAL_DTQ_022",
            "name": "Khu Du Lịch Fresh Garden",
            "lat": 11.934733,
            "lng": 108.409073,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 120000,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Gia đình"
            ]
        },
        {
            "id": "DAL_DTQ_023",
            "name": "Chùa Linh Ẩn (Nam Ban)",
            "lat": 11.956837,
            "lng": 108.333592,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DAL_DTQ_024",
            "name": "Crazy House (Nhà Hàng Nga)",
            "lat": 11.935623,
            "lng": 108.430881,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 60000,
            "tags": [
                "Kiến trúc độc đáo",
                "Nghệ thuật",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_025",
            "name": "Hồ Than Thở",
            "lat": 11.944336,
            "lng": 108.47898,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 20000,
            "tags": [
                "Lãng mạn",
                "Thiên nhiên",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DAL_DTQ_026",
            "name": "Dinh Bảo Đại (Dinh II)",
            "lat": 11.915731,
            "lng": 108.447997,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Kiến trúc",
                "Tham quan"
            ]
        },
        {
            "id": "DAL_DTQ_027",
            "name": "Dinh Bảo Đại (Dinh I)",
            "lat": 11.902427,
            "lng": 108.46971,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Lịch sử",
                "Thiên nhiên",
                "Kiến trúc"
            ]
        },
        {
            "id": "DAL_DTQ_028",
            "name": "Mongo Land Đà Lạt",
            "lat": 12.002715,
            "lng": 108.339222,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 120000,
            "tags": [
                "Giải trí",
                "Thiên nhiên",
                "Chill"
            ]
        },
        {
            "id": "DAL_DTQ_029",
            "name": "Dapa Hill Đà Lạt",
            "lat": 11.972613,
            "lng": 108.344222,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 100000,
            "tags": [
                "Chụp ảnh",
                "Giải trí",
                "Trải nghiệm"
            ]
        },
        {
            "id": "DAL_DTQ_030",
            "name": "PiNi Đà Lạt (Quần thể du lịch)",
            "lat": 11.941805,
            "lng": 108.350434,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 150000,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "DAL_DTQ_031",
            "name": "Làng Hoa Thái Phiên",
            "lat": 11.943796,
            "lng": 108.482737,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Hoa",
                "Sinh thái",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_032",
            "name": "Thác Cam Ly",
            "lat": 11.945467,
            "lng": 108.420848,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_033",
            "name": "Nhà thờ Cam Ly",
            "lat": 11.952483,
            "lng": 108.422043,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc đá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_034",
            "name": "Trường Cao Đẳng Sư Phạm Đà Lạt",
            "lat": 11.984206,
            "lng": 108.452773,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Kiến trúc Pháp",
                "Chụp ảnh",
                "Lịch sử"
            ]
        },
        {
            "id": "DAL_DTQ_035",
            "name": "Sân Golf Đồi Cù (Dalat Palace)",
            "lat": 12.047434,
            "lng": 108.444571,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thể thao",
                "Ngoài trời",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DAL_DTQ_036",
            "name": "Hồ Đa Thiện",
            "lat": 11.923215,
            "lng": 108.450973,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Giải trí"
            ]
        },
        {
            "id": "DAL_DTQ_037",
            "name": "Núi Langbiang (Đỉnh núi trekking)",
            "lat": 11.879081,
            "lng": 108.440737,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 100000,
            "tags": [
                "Trekking",
                "Thiên nhiên",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "DAL_DTQ_038",
            "name": "Đồi Robin - Điểm ngắm cảnh",
            "lat": 11.955,
            "lng": 108.443778,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Lãng mạn"
            ]
        },
        {
            "id": "DAL_DTQ_039",
            "name": "Đồi Chè Cầu Đất",
            "lat": 11.940736,
            "lng": 108.560507,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Nông trại",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_040",
            "name": "Vườn Dâu Tây Đà Lạt",
            "lat": 11.938,
            "lng": 108.43,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Nông trại",
                "Sinh thái",
                "Gia đình"
            ]
        },
        {
            "id": "DAL_DTQ_041",
            "name": "Hồ Xuân Hương - Công viên bờ hồ",
            "lat": 11.948,
            "lng": 108.44154,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Đi bộ",
                "Thư giãn"
            ]
        },
        {
            "id": "DAL_DTQ_042",
            "name": "Rừng Thông Đà Lạt (Ái Ân)",
            "lat": 11.895,
            "lng": 108.461,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Yên tĩnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "DAL_DTQ_043",
            "name": "Vườn Hồng Đà Lạt",
            "lat": 11.880797,
            "lng": 108.452,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Hoa hồng",
                "Chụp ảnh",
                "Lãng mạn"
            ]
        },
        {
            "id": "DAL_DTQ_044",
            "name": "Khu du lịch sinh thái Hòa Phú Thành",
            "lat": 12.044,
            "lng": 108.41,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 80000,
            "tags": [
                "Sinh thái",
                "Gia đình",
                "Cắm trại"
            ]
        },
        {
            "id": "DAL_DTQ_045",
            "name": "Vườn Châu Âu Đà Lạt",
            "lat": 11.958292,
            "lng": 108.562855,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 150000,
            "tags": [
                "Hoa",
                "Chụp ảnh",
                "Lãng mạn"
            ]
        },
        {
            "id": "DAL_DTQ_046",
            "name": "Tháp Truyền Hình - Đỉnh Radar Langbiang",
            "lat": 11.944,
            "lng": 108.432,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Khám phá",
                "Ngoài trời"
            ]
        },
        {
            "id": "DAL_DTQ_047",
            "name": "Khu du lịch Bonsai Garden",
            "lat": 11.880064,
            "lng": 108.397299,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Nghệ thuật bonsai",
                "Yên tĩnh"
            ]
        },
        {
            "id": "DAL_DTQ_048",
            "name": "Sân Vận Động Đà Lạt",
            "lat": 11.949656,
            "lng": 108.43,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Kiến trúc",
                "Thể thao"
            ]
        },
        {
            "id": "DAL_DTQ_049",
            "name": "Khu du lịch Lỡ Đà Lạt (Suối Tía)",
            "lat": 11.8800644,
            "lng": 108.41235,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Suối",
                "Chill"
            ]
        },
        {
            "id": "DAL_DTQ_050",
            "name": "Nhà Thờ Domaine de Marie",
            "lat": 11.9496557,
            "lng": 108.430241,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Kiến trúc Pháp",
                "Tôn giáo",
                "Chụp ảnh"
            ]
        }
    ],
    "nha_trang": [
        {
            "id": "NTG_DTQ_001",
            "name": "Tháp Bà Ponagar",
            "lat": 12.265355,
            "lng": 109.195821,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 30000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Kiến trúc"
            ]
        },
        {
            "id": "NTG_DTQ_002",
            "name": "Chùa Long Sơn",
            "lat": 12.250556,
            "lng": 109.180278,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Tâm linh",
                "Kiến trúc"
            ]
        },
        {
            "id": "NTG_DTQ_003",
            "name": "Nhà thờ Đá Nha Trang",
            "lat": 12.246732,
            "lng": 109.188231,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo",
                "Lịch sử"
            ]
        },
        {
            "id": "NTG_DTQ_004",
            "name": "Viện Hải Dương Học",
            "lat": 12.2075,
            "lng": 109.215556,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Khoa học",
                "Khám phá",
                "Trong nhà"
            ]
        },
        {
            "id": "NTG_DTQ_005",
            "name": "Dinh Bảo Đại",
            "lat": 12.215556,
            "lng": 109.215833,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 40000,
            "tags": [
                "Lịch sử",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTG_DTQ_006",
            "name": "VinWonders Nha Trang",
            "lat": 12.218889,
            "lng": 109.241389,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 800000,
            "tags": [
                "Giải trí",
                "Hiện đại",
                "Gia đình"
            ]
        },
        {
            "id": "NTG_DTQ_007",
            "name": "Vinpearl Harbour",
            "lat": 12.215278,
            "lng": 109.231111,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 190000,
            "tags": [
                "Mua sắm",
                "Ẩm thực",
                "Hiện đại"
            ]
        },
        {
            "id": "NTG_DTQ_008",
            "name": "Nhà hát Đó",
            "lat": 12.285278,
            "lng": 109.198611,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Nghệ thuật",
                "Kiến trúc",
                "Hiện đại"
            ]
        },
        {
            "id": "NTG_DTQ_009",
            "name": "Tháp Trầm Hương",
            "lat": 12.239722,
            "lng": 109.196389,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Biểu tượng",
                "Chụp ảnh",
                "Ngoài trời"
            ]
        },
        {
            "id": "NTG_DTQ_010",
            "name": "Đảo Hòn Mun",
            "lat": 12.1675,
            "lng": 109.303333,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 22000,
            "tags": [
                "Biển",
                "San hô",
                "Khám phá"
            ]
        },
        {
            "id": "NTG_DTQ_011",
            "name": "Đảo Hòn Tằm",
            "lat": 12.213333,
            "lng": 109.242778,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 250000,
            "tags": [
                "Nghỉ dưỡng",
                "Tắm bùn",
                "Biển"
            ]
        },
        {
            "id": "NTG_DTQ_012",
            "name": "Hòn Chồng",
            "lat": 12.2725,
            "lng": 109.206111,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTG_DTQ_013",
            "name": "Bãi Tranh",
            "lat": 12.203611,
            "lng": 109.231944,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 30000,
            "tags": [
                "Biển",
                "Thể thao nước",
                "Sôi động"
            ]
        },
        {
            "id": "NTG_DTQ_014",
            "name": "Đảo Yến (Hòn Nội)",
            "lat": 12.185556,
            "lng": 109.351389,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 490000,
            "tags": [
                "Biển đôi",
                "Thiên nhiên",
                "Đặc biệt"
            ]
        },
        {
            "id": "NTG_DTQ_015",
            "name": "Đảo Khỉ (Hòn Lao)",
            "lat": 12.357778,
            "lng": 109.213611,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 120000,
            "tags": [
                "Động vật",
                "Khám phá",
                "Ngoài trời"
            ]
        },
        {
            "id": "NTG_DTQ_016",
            "name": "Suối Hoa Lan",
            "lat": 12.385278,
            "lng": 109.235556,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 170000,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTG_DTQ_017",
            "name": "Đảo Điệp Sơn",
            "lat": 12.601389,
            "lng": 109.203611,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 200000,
            "tags": [
                "Biển",
                "Con đường đi bộ",
                "Hoang sơ"
            ]
        },
        {
            "id": "NTG_DTQ_018",
            "name": "Đảo Bình Ba",
            "lat": 11.838889,
            "lng": 109.223611,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 30000,
            "tags": [
                "Ẩm thực",
                "Biển",
                "Hoang sơ"
            ]
        },
        {
            "id": "NTG_DTQ_019",
            "name": "Đảo Bình Hưng",
            "lat": 11.785278,
            "lng": 109.208611,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 20000,
            "tags": [
                "Biển",
                "Hải sản",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTG_DTQ_020",
            "name": "I-Resort Nha Trang",
            "lat": 12.285556,
            "lng": 109.188333,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 170000,
            "tags": [
                "Sức khỏe",
                "Tắm bùn",
                "Thư giãn"
            ]
        },
        {
            "id": "NTG_DTQ_021",
            "name": "Tắm bùn Tháp Bà",
            "lat": 12.268611,
            "lng": 109.183611,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 180000,
            "tags": [
                "Sức khỏe",
                "Lịch sử",
                "Thư giãn"
            ]
        },
        {
            "id": "NTG_DTQ_022",
            "name": "Thác Yang Bay",
            "lat": 12.185278,
            "lng": 108.921389,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 150000,
            "tags": [
                "Thiên nhiên",
                "Thác",
                "Văn hóa"
            ]
        },
        {
            "id": "NTG_DTQ_023",
            "name": "Thác Ba Hồ",
            "lat": 12.388611,
            "lng": 109.141389,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 100000,
            "tags": [
                "Thiên nhiên",
                "Trekking",
                "Khám phá"
            ]
        },
        {
            "id": "NTG_DTQ_024",
            "name": "Galina Lake View",
            "lat": 12.198611,
            "lng": 109.141389,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Chèo thuyền",
                "Chill"
            ]
        },
        {
            "id": "NTG_DTQ_025",
            "name": "Suối Thạch Lâm",
            "lat": 12.128611,
            "lng": 109.083611,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Giải trí",
                "Ngoài trời"
            ]
        },
        {
            "id": "NTG_DTQ_026",
            "name": "Chợ Đầm",
            "lat": 12.254167,
            "lng": 109.191389,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Văn hóa",
                "Sôi động"
            ]
        },
        {
            "id": "NTG_DTQ_027",
            "name": "Bãi biển Trần Phú",
            "lat": 12.238611,
            "lng": 109.196111,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Biển",
                "Miễn phí",
                "Sôi động"
            ]
        },
        {
            "id": "NTG_DTQ_028",
            "name": "Bãi Dài Cam Ranh",
            "lat": 12.038611,
            "lng": 109.196111,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Biển",
                "Hoang sơ",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "NTG_DTQ_029",
            "name": "Biển Dốc Lết",
            "lat": 12.535556,
            "lng": 109.228611,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 50000,
            "tags": [
                "Biển",
                "Cát trắng",
                "Gia đình"
            ]
        },
        {
            "id": "NTG_DTQ_030",
            "name": "Quảng trường 2/4",
            "lat": 12.241389,
            "lng": 109.196389,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Sôi động",
                "Cộng đồng",
                "Miễn phí"
            ]
        },
        {
            "id": "NTG_DTQ_031",
            "name": "Đèo Cù Hin",
            "lat": 12.138611,
            "lng": 109.208611,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Ngoài trời"
            ]
        },
        {
            "id": "NTG_DTQ_032",
            "name": "Chùa Suối Đổ",
            "lat": 12.238611,
            "lng": 109.101389,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Núi",
                "Thác"
            ]
        },
        {
            "id": "NTG_DTQ_033",
            "name": "Đồng Cừu Suối Tiên",
            "lat": 11.901389,
            "lng": 109.121389,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 40000,
            "tags": [
                "Nông trại",
                "Chụp ảnh",
                "Gia đình"
            ]
        },
        {
            "id": "NTG_DTQ_034",
            "name": "Kong Forest",
            "lat": 12.181389,
            "lng": 108.988611,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 500000,
            "tags": [
                "Mạo hiểm",
                "Rừng",
                "Zipline"
            ]
        },
        {
            "id": "NTG_DTQ_035",
            "name": "Hòn Một",
            "lat": 12.181389,
            "lng": 109.273611,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Biển",
                "Lặn ngắm san hô",
                "Yên tĩnh"
            ]
        },
        {
            "id": "NTG_DTQ_036",
            "name": "Ga Nha Trang",
            "lat": 12.250278,
            "lng": 109.183611,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Kiến trúc",
                "Giao thông"
            ]
        },
        {
            "id": "NTG_DTQ_037",
            "name": "Bảo tàng Khánh Hòa",
            "lat": 12.250556,
            "lng": 109.196389,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Lịch sử",
                "Trong nhà"
            ]
        },
        {
            "id": "NTG_DTQ_038",
            "name": "Skylight Nha Trang",
            "lat": 12.241389,
            "lng": 109.196389,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 200000,
            "tags": [
                "Ngắm cảnh",
                "Hiện đại",
                "Bar"
            ]
        },
        {
            "id": "NTG_DTQ_039",
            "name": "Sailing Club",
            "lat": 12.238611,
            "lng": 109.196944,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 150000,
            "tags": [
                "Giải trí đêm",
                "Sang trọng",
                "Biển"
            ]
        },
        {
            "id": "NTG_DTQ_040",
            "name": "Mũi Đôi",
            "lat": 12.648611,
            "lng": 109.458611,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Cực Đông",
                "Chinh phục",
                "Khám phá"
            ]
        },
        {
            "id": "NTG_DTQ_041",
            "name": "Đầm Nha Phu",
            "lat": 12.378611,
            "lng": 109.201389,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Biển",
                "Hoang sơ"
            ]
        },
        {
            "id": "NTG_DTQ_042",
            "name": "Hang Heo",
            "lat": 12.338611,
            "lng": 109.208611,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Miễn phí"
            ]
        },
        {
            "id": "NTG_DTQ_043",
            "name": "Cầu Trần Phú",
            "lat": 12.258611,
            "lng": 109.196111,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Kiến trúc",
                "Giao thông"
            ]
        },
        {
            "id": "NTG_DTQ_044",
            "name": "Bãi Tiên",
            "lat": 12.288611,
            "lng": 109.201389,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Biển",
                "Chụp ảnh",
                "Miễn phí"
            ]
        },
        {
            "id": "NTG_DTQ_045",
            "name": "Đảo Robinson",
            "lat": 12.218611,
            "lng": 109.263611,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 100000,
            "tags": [
                "Giải trí",
                "Tiệc bãi biển",
                "Sôi động"
            ]
        },
        {
            "id": "NTG_DTQ_046",
            "name": "Hồ cá Trí Nguyên",
            "lat": 12.213333,
            "lng": 109.223611,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 170000,
            "tags": [
                "Tham quan",
                "Động vật biển",
                "Gia đình"
            ]
        },
        {
            "id": "NTG_DTQ_047",
            "name": "Công viên nước Phù Đổng",
            "lat": 12.235556,
            "lng": 109.198611,
            "category": "diem_tham_quan",
            "rating": 3.8,
            "price": 30000,
            "tags": [
                "Giải trí",
                "Trẻ em",
                "Ngoài trời"
            ]
        },
        {
            "id": "NTG_DTQ_048",
            "name": "Tranh thêu XQ",
            "lat": 12.235278,
            "lng": 109.196111,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Nghệ thuật",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "NTG_DTQ_049",
            "name": "Bãi Sỏi",
            "lat": 12.221389,
            "lng": 109.228611,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 40000,
            "tags": [
                "Biển",
                "Chụp ảnh",
                "Độc đáo"
            ]
        },
        {
            "id": "NTG_DTQ_050",
            "name": "Hòn Đỏ",
            "lat": 12.275833,
            "lng": 109.205278,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Biển",
                "Yên tĩnh"
            ]
        }
    ],
    "ninh_binh": [
        {
            "id": "NB_DTQ_001",
            "name": "Quần Thể Danh Thắng Tràng An",
            "lat": 20.253158,
            "lng": 105.918315,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 250000,
            "tags": [
                "Thiên nhiên",
                "Di sản UNESCO",
                "Hang động"
            ]
        },
        {
            "id": "NB_DTQ_002",
            "name": "Thung Nham Ninh Bình",
            "lat": 20.218308,
            "lng": 105.893184,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 250000,
            "tags": [
                "Vườn chim",
                "Sinh thái",
                "Cảnh quan"
            ]
        },
        {
            "id": "NB_DTQ_003",
            "name": "Cố Đô Hoa Lư",
            "lat": 20.284627,
            "lng": 105.90836,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Di tích",
                "Đền thờ"
            ]
        },
        {
            "id": "NB_DTQ_004",
            "name": "Động Am Tiên (Tuyệt Tịnh Cốc)",
            "lat": 20.280661,
            "lng": 105.915866,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 50000,
            "tags": [
                "Phong cảnh",
                "Sống ảo",
                "Yên tĩnh"
            ]
        },
        {
            "id": "NB_DTQ_005",
            "name": "Khu Bảo tồn Thiên nhiên Vân Long",
            "lat": 20.394736,
            "lng": 105.868039,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 100000,
            "tags": [
                "Khu bảo tồn",
                "Đất ngập nước",
                "Bơi thuyền"
            ]
        },
        {
            "id": "NB_DTQ_006",
            "name": "Vườn Quốc Gia Cúc Phương",
            "lat": 20.316836,
            "lng": 105.608248,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 60000,
            "tags": [
                "Rừng nguyên sinh",
                "Khám phá",
                "Trekking"
            ]
        },
        {
            "id": "NB_DTQ_007",
            "name": "Núi Non Nước",
            "lat": 20.260184,
            "lng": 105.982447,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Thành phố",
                "Thơ ca"
            ]
        },
        {
            "id": "NB_DTQ_008",
            "name": "Chùa Bái Đính",
            "lat": 20.268062,
            "lng": 105.855603,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kỷ lục Châu Á",
                "Kiến trúc"
            ]
        },
        {
            "id": "NB_DTQ_009",
            "name": "Tam Cốc - Bích Động",
            "lat": 20.21679,
            "lng": 105.937365,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 250000,
            "tags": [
                "Ngồi đò",
                "Cảnh quan",
                "Vịnh Hạ Long cạn"
            ]
        },
        {
            "id": "NB_DTQ_010",
            "name": "Nhà Thờ Đá Phát Diệm",
            "lat": 20.093161,
            "lng": 106.079454,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc gỗ đá",
                "Tôn giáo",
                "Cổ kính"
            ]
        },
        {
            "id": "NB_DTQ_011",
            "name": "Hang Múa",
            "lat": 20.229227,
            "lng": 105.931879,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 100000,
            "tags": [
                "Leo núi",
                "Sống ảo",
                "Ngắm toàn cảnh"
            ]
        },
        {
            "id": "NB_DTQ_012",
            "name": "Động Thiên Hà",
            "lat": 20.195459,
            "lng": 105.852066,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 120000,
            "tags": [
                "Hang động",
                "Thạch nhũ",
                "Huyền ảo"
            ]
        },
        {
            "id": "NB_DTQ_013",
            "name": "Kênh Gà (Suối Khoáng Nóng)",
            "lat": 20.334061,
            "lng": 105.813963,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 100000,
            "tags": [
                "Nghỉ dưỡng",
                "Khoáng nóng",
                "Chăm sóc sức khỏe"
            ]
        },
        {
            "id": "NB_DTQ_014",
            "name": "Trung tâm bảo tồn gấu Ninh Bình",
            "lat": 20.207942,
            "lng": 105.763538,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Bảo vệ động vật",
                "Giáo dục",
                "Tự nhiên"
            ]
        },
        {
            "id": "NB_DTQ_015",
            "name": "Hồ Đồng Chương",
            "lat": 20.224,
            "lng": 105.795375,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 0,
            "tags": [
                "Hồ nước",
                "Rừng thông",
                "Dã ngoại"
            ]
        },
        {
            "id": "NB_DTQ_016",
            "name": "Đồi dứa Tam Điệp",
            "lat": 20.168315,
            "lng": 105.911378,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Nông trại",
                "Sống ảo",
                "Miễn phí"
            ]
        },
        {
            "id": "NB_DTQ_017",
            "name": "Biển Kim Sơn (Cồn Sơn)",
            "lat": 19.870418,
            "lng": 106.069469,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Cửa biển",
                "Đầm lầy",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_018",
            "name": "Đồi thông Hồ Đồng Chương",
            "lat": 20.228242,
            "lng": 105.786778,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Dã ngoại",
                "Chụp ảnh",
                "Thiên nhiên"
            ]
        },
        {
            "id": "NB_DTQ_019",
            "name": "Thung Nắng",
            "lat": 20.217444,
            "lng": 105.916444,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 100000,
            "tags": [
                "Ngồi đò",
                "Cảnh quan",
                "Yên bình"
            ]
        },
        {
            "id": "NB_DTQ_020",
            "name": "Phố Cổ Hoa Lư",
            "lat": 20.263675,
            "lng": 105.968114,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Ánh sáng",
                "Văn hóa",
                "Ban đêm"
            ]
        },
        {
            "id": "NB_DTQ_021",
            "name": "Đan Viện Châu Sơn",
            "lat": 20.341186,
            "lng": 105.735675,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Kiến trúc Gothic",
                "Thanh tịnh",
                "Tôn giáo"
            ]
        },
        {
            "id": "NB_DTQ_022",
            "name": "Đền Đinh Lê",
            "lat": 20.284629,
            "lng": 105.905241,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Di tích",
                "Tâm linh"
            ]
        },
        {
            "id": "NB_DTQ_023",
            "name": "Hang Bụt",
            "lat": 20.216798,
            "lng": 105.891387,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 100000,
            "tags": [
                "Hang động",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_024",
            "name": "Đền Thái Vi",
            "lat": 20.224456,
            "lng": 105.929947,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Kiến trúc đá",
                "Di tích nhà Trần"
            ]
        },
        {
            "id": "NB_DTQ_025",
            "name": "Động Tiên Cá",
            "lat": 20.237622,
            "lng": 105.889964,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 250000,
            "tags": [
                "Hang động",
                "Thạch nhũ"
            ]
        },
        {
            "id": "NB_DTQ_026",
            "name": "Cố Viên Lầu",
            "lat": 20.219126,
            "lng": 105.936235,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 50000,
            "tags": [
                "Làng cổ",
                "Kiến trúc truyền thống"
            ]
        },
        {
            "id": "NB_DTQ_027",
            "name": "Núi Kỳ Lân",
            "lat": 20.26463,
            "lng": 105.967607,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Phong cảnh",
                "Hang động nhỏ"
            ]
        },
        {
            "id": "NB_DTQ_028",
            "name": "Chùa Bích Động",
            "lat": 20.217709,
            "lng": 105.915776,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Nam thiên đệ nhị động",
                "Tâm linh"
            ]
        },
        {
            "id": "NB_DTQ_029",
            "name": "Hồ Yên Thắng",
            "lat": 20.135146,
            "lng": 105.964537,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Hồ nước",
                "Câu cá",
                "Dã ngoại"
            ]
        },
        {
            "id": "NB_DTQ_030",
            "name": "Động Vái Giời",
            "lat": 20.216418,
            "lng": 105.900587,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 150000,
            "tags": [
                "Thạch nhũ",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_031",
            "name": "Đền Trình (Tràng An)",
            "lat": 20.257225,
            "lng": 105.906905,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Khởi đầu tuyến đò"
            ]
        },
        {
            "id": "NB_DTQ_032",
            "name": "Phủ Khống (Tràng An)",
            "lat": 20.26857,
            "lng": 105.904161,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Phong cảnh"
            ]
        },
        {
            "id": "NB_DTQ_033",
            "name": "Hành Cung Vũ Lâm",
            "lat": 20.247516,
            "lng": 105.914392,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Điểm dừng chân Tràng An"
            ]
        },
        {
            "id": "NB_DTQ_034",
            "name": "Đền Thánh Nguyễn",
            "lat": 20.308198,
            "lng": 105.875339,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Tâm linh"
            ]
        },
        {
            "id": "NB_DTQ_035",
            "name": "Hang Sáng, Hang Tối",
            "lat": 20.260897,
            "lng": 105.90069,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Hang động nước",
                "Cảnh đẹp"
            ]
        },
        {
            "id": "NB_DTQ_036",
            "name": "Chùa Địch Lộng",
            "lat": 20.373909,
            "lng": 105.912865,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Di tích quốc gia"
            ]
        },
        {
            "id": "NB_DTQ_037",
            "name": "Núi Mèo Cào",
            "lat": 20.374166,
            "lng": 105.873324,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Phong cảnh",
                "Sông suối"
            ]
        },
        {
            "id": "NB_DTQ_038",
            "name": "Hầm đi bộ Tràng An",
            "lat": 20.253135,
            "lng": 105.918606,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Trải nghiệm",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_039",
            "name": "Làng nghề đá mỹ nghệ Ninh Vân",
            "lat": 20.208966,
            "lng": 105.959861,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Nghề chạm khắc đá"
            ]
        },
        {
            "id": "NB_DTQ_040",
            "name": "Động Am Tiên",
            "lat": 20.283545,
            "lng": 105.912083,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Hang động",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_041",
            "name": "Cây Đăng Cổ Thụ (Cúc Phương)",
            "lat": 20.351848,
            "lng": 105.592378,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Sinh thái rừng"
            ]
        },
        {
            "id": "NB_DTQ_042",
            "name": "Hồ Mạc (Cúc Phương)",
            "lat": 20.25728,
            "lng": 105.708144,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Nghỉ dưỡng",
                "Hồ nước trong rừng"
            ]
        },
        {
            "id": "NB_DTQ_043",
            "name": "Hang Con Moong (Cúc Phương)",
            "lat": 20.264356,
            "lng": 105.62368,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Khảo cổ học",
                "Di chỉ người tiền sử"
            ]
        },
        {
            "id": "NB_DTQ_044",
            "name": "Vườn Chim Thung Nham",
            "lat": 20.22222,
            "lng": 105.88572,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Phong cảnh",
                "Động vật",
                "Khám phá"
            ]
        },
        {
            "id": "NB_DTQ_045",
            "name": "Chùa Tam Chúc",
            "lat": 20.570923,
            "lng": 105.814059,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Phật giáo",
                "Phong cảnh"
            ]
        },
        {
            "id": "NB_DTQ_046",
            "name": "Chùa Nhất Trụ",
            "lat": 20.288087,
            "lng": 105.907627,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Phật giáo",
                "Tâm linh"
            ]
        },
        {
            "id": "NB_DTQ_047",
            "name": "Đền Suối Tiên",
            "lat": 20.246192,
            "lng": 105.905054,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Di tích"
            ]
        },
        {
            "id": "NB_DTQ_048",
            "name": "Đền thờ Vua Lê Đại Hành",
            "lat": 19.851245,
            "lng": 106.121245,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Di tích",
                "Nghiêm trang",
                "Lịch sử"
            ]
        },
        {
            "id": "NB_DTQ_049",
            "name": "Đền thờ Vua Đinh Tiên Hoàng",
            "lat": 20.284822,
            "lng": 105.905214,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Di tích",
                "Nghiêm trang",
                "Lịch sử"
            ]
        },
        {
            "id": "NB_DTQ_050",
            "name": "Bảo tàng Ninh Bình",
            "lat": 20.259062,
            "lng": 105.980438,
            "category": "diem_tham_quan",
            "rating": 3.9,
            "price": 20000,
            "tags": [
                "Trưng bày",
                "Lịch sử văn hóa"
            ]
        }
    ],
    "ninh_thuan": [
        {
            "id": "NTH_DTQ_001",
            "name": "Vịnh Vĩnh Hy",
            "lat": 11.71762,
            "lng": 109.202127,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Biển",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_002",
            "name": "Tháp Chàm Po Klong Garai (Panduranga)",
            "lat": 11.601906,
            "lng": 108.946504,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Văn hóa Chăm",
                "Kiến trúc"
            ]
        },
        {
            "id": "NTH_DTQ_003",
            "name": "Tháp Chàm Po Rome (Bimong)",
            "lat": 11.501211,
            "lng": 108.865829,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa Chăm",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_004",
            "name": "Tháp Chàm Hòa Lai",
            "lat": 11.676042,
            "lng": 109.035627,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Kiến trúc Chăm",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_005",
            "name": "Vườn Quốc Gia Núi Chúa",
            "lat": 11.680879,
            "lng": 109.175057,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_006",
            "name": "Đồi Cát Nam Cương",
            "lat": 11.50879,
            "lng": 108.997104,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_007",
            "name": "Bãi Biển Ninh Chữ",
            "lat": 11.586519,
            "lng": 109.033244,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thư giãn",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "NTH_DTQ_008",
            "name": "Bãi Biển Bình Sơn",
            "lat": 11.564854,
            "lng": 109.024474,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thư giãn",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_009",
            "name": "Bãi Thùng (Vinh Hy - ẩn)",
            "lat": 11.745862,
            "lng": 109.223417,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển hoang sơ",
                "Khám phá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTH_DTQ_010",
            "name": "Hòn Rùa Vĩnh Hy (Đảo Rùa)",
            "lat": 11.716037,
            "lng": 109.221121,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lặn san hô",
                "Biển",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_011",
            "name": "Hang Yến Vĩnh Hy",
            "lat": 11.70633,
            "lng": 109.202628,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Khám phá",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTH_DTQ_012",
            "name": "Bãi Cầu - Hòn Cầu Vĩnh Hy",
            "lat": 11.713526,
            "lng": 109.200402,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Lặn san hô",
                "Biển",
                "Yên tĩnh"
            ]
        },
        {
            "id": "NTH_DTQ_013",
            "name": "Bãi Tắm Vĩnh Hy",
            "lat": 11.71327,
            "lng": 109.200664,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Bơi lội",
                "Nghỉ ngơi"
            ]
        },
        {
            "id": "NTH_DTQ_014",
            "name": "Làng Gốm Chăm Bàu Trúc",
            "lat": 11.529783,
            "lng": 108.924957,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa Chăm",
                "Thủ công mỹ nghệ",
                "Tham quan"
            ]
        },
        {
            "id": "NTH_DTQ_015",
            "name": "Gốm Chăm Ninh Thuận (Nghệ nhân)",
            "lat": 11.527764,
            "lng": 108.925866,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa Chăm",
                "Nghệ thuật",
                "Tham quan"
            ]
        },
        {
            "id": "NTH_DTQ_016",
            "name": "Làng Dệt Thổ Cẩm Mỹ Nghiệp",
            "lat": 11.521536,
            "lng": 108.942482,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa Chăm",
                "Dệt thổ cẩm",
                "Tham quan"
            ]
        },
        {
            "id": "NTH_DTQ_017",
            "name": "Brocade Thanh Đan - Mỹ Nghiệp",
            "lat": 11.522624,
            "lng": 108.940482,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa Chăm",
                "Dệt lụa",
                "Mua sắm"
            ]
        },
        {
            "id": "NTH_DTQ_018",
            "name": "Bảo Tàng Ninh Thuận",
            "lat": 11.564286,
            "lng": 108.999495,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "NTH_DTQ_019",
            "name": "Mũi Dinh - Hải Đăng Mũi Dinh",
            "lat": 11.360804,
            "lng": 109.013972,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 10000,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_020",
            "name": "Bãi Tràng - Mũi Dinh",
            "lat": 11.355811,
            "lng": 109.005907,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển hoang sơ",
                "Cắm trại",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTH_DTQ_021",
            "name": "Làng Chài Hòn Thiên (Mural Village)",
            "lat": 11.633983,
            "lng": 109.020017,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa địa phương",
                "Bích họa",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTH_DTQ_022",
            "name": "Vịnh Vĩnh Hy Tour (Thuận Châu)",
            "lat": 11.725591,
            "lng": 109.196587,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 150000,
            "tags": [
                "Tham quan vịnh",
                "Lặn biển",
                "Ẩm thực hải sản"
            ]
        },
        {
            "id": "NTH_DTQ_023",
            "name": "MyHoa Lagoon - Khu Lướt Ván Diều",
            "lat": 11.608149,
            "lng": 109.145843,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Lướt ván diều",
                "Nghỉ dưỡng",
                "Thiên nhiên"
            ]
        },
        {
            "id": "NTH_DTQ_024",
            "name": "Suối Ba Hồ",
            "lat": 11.772456,
            "lng": 109.053675,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Tắm suối",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_025",
            "name": "Cánh Đồng Muối Cà Ná",
            "lat": 11.341141,
            "lng": 108.894768,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Trải nghiệm"
            ]
        },
        {
            "id": "NTH_DTQ_026",
            "name": "Hồ Tân Giang",
            "lat": 11.493764,
            "lng": 108.785342,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Picnic"
            ]
        },
        {
            "id": "NTH_DTQ_027",
            "name": "Đảo Hòn Cau (Cù Lao Câu)",
            "lat": 11.225074,
            "lng": 108.826927,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển hoang sơ",
                "Lặn san hô",
                "Cắm trại"
            ]
        },
        {
            "id": "NTH_DTQ_028",
            "name": "Long Thuận Resort Ninh Chữ",
            "lat": 11.561979,
            "lng": 109.023218,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Nghỉ dưỡng",
                "Biển",
                "Lướt ván"
            ]
        },
        {
            "id": "NTH_DTQ_029",
            "name": "Vườn Nho Thái An",
            "lat": 11.671466,
            "lng": 109.175653,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Nông trại",
                "Trải nghiệm",
                "Ẩm thực"
            ]
        },
        {
            "id": "NTH_DTQ_030",
            "name": "Đầm Nại Wind Farm & Rừng Ngập Mặn",
            "lat": 11.667647,
            "lng": 109.039916,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Chim thú"
            ]
        },
        {
            "id": "NTH_DTQ_031",
            "name": "Cánh Đồng Điện Gió Ninh Thuận",
            "lat": 11.501211,
            "lng": 108.865829,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_032",
            "name": "Bãi Biển Cà Ná",
            "lat": 11.324337,
            "lng": 108.839128,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thư giãn",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_033",
            "name": "Đèo Cây Cóc - Ngắm Vịnh Vĩnh Hy",
            "lat": 11.72885,
            "lng": 109.198715,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Phong cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_034",
            "name": "Chợ Đêm Phan Rang",
            "lat": 11.5635,
            "lng": 108.988,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Mua sắm",
                "Sôi động"
            ]
        },
        {
            "id": "NTH_DTQ_035",
            "name": "Hồ Đá Vách - Núi Chúa",
            "lat": 11.680879,
            "lng": 109.175057,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Trekking",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_036",
            "name": "Bãi Biển Mỹ Hòa - Lướt Ván Diều",
            "lat": 11.607758,
            "lng": 109.146572,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thư giãn",
                "Địa phương"
            ]
        },
        {
            "id": "NTH_DTQ_037",
            "name": "Đền Thánh Mẫu Thiên Ya Na (Po Ino Nagar)",
            "lat": 11.53,
            "lng": 108.992,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Văn hóa Chăm",
                "Tâm linh"
            ]
        },
        {
            "id": "NTH_DTQ_038",
            "name": "Bãi Tràng - Mũi Dinh",
            "lat": 11.355811,
            "lng": 109.005907,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_039",
            "name": "Hồ Sông Sắt - Bác Ái",
            "lat": 11.862931,
            "lng": 108.941309,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Picnic"
            ]
        },
        {
            "id": "NTH_DTQ_040",
            "name": "Suối Lồ Ồ - Vĩnh Hy",
            "lat": 11.727719,
            "lng": 109.189084,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 50000,
            "tags": [
                "Thiên nhiên",
                "Trekking",
                "Suối"
            ]
        },
        {
            "id": "NTH_DTQ_041",
            "name": "Tháp Chăm Po Dam",
            "lat": 11.266654,
            "lng": 108.692141,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Văn hóa Chăm",
                "Lịch sử"
            ]
        },
        {
            "id": "NTH_DTQ_042",
            "name": "Làng Chài Vĩnh Hy (Fishing Village)",
            "lat": 11.725591,
            "lng": 109.196587,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Văn hóa địa phương",
                "Ẩm thực hải sản",
                "Tham quan"
            ]
        },
        {
            "id": "NTH_DTQ_043",
            "name": "Sân Chim Đầm Nại",
            "lat": 11.64,
            "lng": 109.015,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Quan sát chim",
                "Thiên nhiên"
            ]
        },
        {
            "id": "NTH_DTQ_044",
            "name": "Chợ Sơn Hải - Bãi Biển Sơn Hải",
            "lat": 11.413364,
            "lng": 109.006533,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Hoang sơ",
                "Chụp ảnh"
            ]
        },
        {
            "id": "NTH_DTQ_045",
            "name": "Đồi Sim Ninh Thuận (Po Rome)",
            "lat": 11.501211,
            "lng": 108.865829,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Chụp ảnh",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "NTH_DTQ_046",
            "name": "Vườn Nho Thái Phong Ninh Thuận",
            "lat": 11.671466,
            "lng": 109.175653,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 30000,
            "tags": [
                "Nông trại nho",
                "Ẩm thực",
                "Trải nghiệm"
            ]
        },
        {
            "id": "NTH_DTQ_047",
            "name": "Bãi Biển Khánh Hội (Ninh Hải)",
            "lat": 11.564854,
            "lng": 109.024474,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Yên tĩnh"
            ]
        },
        {
            "id": "NTH_DTQ_048",
            "name": "Tháp Chàm Po Klong Garai (Phan Rang)",
            "lat": 11.601906,
            "lng": 108.946504,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Văn hóa Chăm",
                "Khám phá"
            ]
        },
        {
            "id": "NTH_DTQ_049",
            "name": "Đèo Cậu - Điểm Ngắm Vịnh Vĩnh Hy",
            "lat": 11.72885,
            "lng": 109.198715,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Đi bộ"
            ]
        },
        {
            "id": "NTH_DTQ_050",
            "name": "Vườn Quốc Gia Núi Chúa (Cổng chính)",
            "lat": 11.680879,
            "lng": 109.175057,
            "category": "diem_tham_quan",
            "rating": 0,
            "price": 40000,
            "tags": [
                "Thiên nhiên",
                "Ngắm cảnh",
                "Trekking"
            ]
        }
    ],
    "phu_quoc": [
        {
            "id": "PQC_DTQ_001",
            "name": "VinWonders Phú Quốc",
            "lat": 10.334231,
            "lng": 103.856214,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 950000,
            "tags": [
                "Giải trí",
                "Hiện đại",
                "Gia đình"
            ]
        },
        {
            "id": "PQC_DTQ_002",
            "name": "Vinpearl Safari Phú Quốc",
            "lat": 10.342152,
            "lng": 103.858342,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 850000,
            "tags": [
                "Động vật",
                "Thiên nhiên",
                "Giáo dục"
            ]
        },
        {
            "id": "PQC_DTQ_003",
            "name": "Grand World Phú Quốc",
            "lat": 10.328451,
            "lng": 103.854312,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Sôi động",
                "Kiến trúc",
                "Mua sắm"
            ]
        },
        {
            "id": "PQC_DTQ_004",
            "name": "Cung điện Hải Vương",
            "lat": 10.336512,
            "lng": 103.857123,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Trong nhà",
                "Thủy cung",
                "Khám phá"
            ]
        },
        {
            "id": "PQC_DTQ_005",
            "name": "Bảo tàng Gấu Teddy",
            "lat": 10.327123,
            "lng": 103.853456,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 200000,
            "tags": [
                "Gia đình",
                "Trưng bày",
                "Trong nhà"
            ]
        },
        {
            "id": "PQC_DTQ_006",
            "name": "Tinh hoa Việt Nam (Show)",
            "lat": 10.329234,
            "lng": 103.855678,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 300000,
            "tags": [
                "Nghệ thuật",
                "Văn hóa",
                "Lịch sử"
            ]
        },
        {
            "id": "PQC_DTQ_007",
            "name": "Sông Venice (Grand World)",
            "lat": 10.328112,
            "lng": 103.854987,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 200000,
            "tags": [
                "Lãng mạn",
                "Ngắm cảnh",
                "Chụp ảnh"
            ]
        },
        {
            "id": "PQC_DTQ_008",
            "name": "Cáp treo Hòn Thơm",
            "lat": 10.027123,
            "lng": 104.008456,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 600000,
            "tags": [
                "Ngắm cảnh",
                "Biển",
                "Kỷ lục"
            ]
        },
        {
            "id": "PQC_DTQ_009",
            "name": "Aquatopia Water Park",
            "lat": 10.005678,
            "lng": 104.01789,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Giải trí",
                "Nước",
                "Gia đình"
            ]
        },
        {
            "id": "PQC_DTQ_010",
            "name": "Exotica Park (Hòn Thơm)",
            "lat": 10.006123,
            "lng": 104.018234,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Giải trí",
                "Mạo hiểm",
                "Ngoài trời"
            ]
        },
        {
            "id": "PQC_DTQ_011",
            "name": "Cầu Hôn (Kiss Bridge)",
            "lat": 10.025432,
            "lng": 104.004567,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 100000,
            "tags": [
                "Chụp ảnh",
                "Kiến trúc",
                "Lãng mạn"
            ]
        },
        {
            "id": "PQC_DTQ_012",
            "name": "Sunset Town (Địa Trung Hải)",
            "lat": 10.026789,
            "lng": 104.005678,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Chụp ảnh",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "PQC_DTQ_013",
            "name": "Show Kiss of the Sea",
            "lat": 10.02589,
            "lng": 104.004231,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 750000,
            "tags": [
                "Nghệ thuật",
                "Hiện đại",
                "Ban đêm"
            ]
        },
        {
            "id": "PQC_DTQ_014",
            "name": "Bãi Sao",
            "lat": 10.053456,
            "lng": 104.034567,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Biển",
                "Thiên nhiên",
                "Thư giãn"
            ]
        },
        {
            "id": "PQC_DTQ_015",
            "name": "Bãi Khem",
            "lat": 10.023456,
            "lng": 104.035678,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Biển",
                "Cao cấp",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "PQC_DTQ_016",
            "name": "Nhà tù Phú Quốc",
            "lat": 10.045678,
            "lng": 104.01789,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "PQC_DTQ_017",
            "name": "Chùa Hộ Quốc",
            "lat": 10.078901,
            "lng": 104.045678,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Kiến trúc",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "PQC_DTQ_018",
            "name": "Suối Tranh",
            "lat": 10.145678,
            "lng": 104.005678,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 30000,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Thác"
            ]
        },
        {
            "id": "PQC_DTQ_019",
            "name": "Dinh Cậu",
            "lat": 10.21789,
            "lng": 103.956789,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Biểu tượng",
                "Hoàng hôn"
            ]
        },
        {
            "id": "PQC_DTQ_020",
            "name": "Dinh Bà",
            "lat": 10.218234,
            "lng": 103.957123,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Tâm linh",
                "Văn hóa",
                "Lịch sử"
            ]
        },
        {
            "id": "PQC_DTQ_021",
            "name": "Chợ đêm Phú Quốc",
            "lat": 10.216789,
            "lng": 103.958901,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Mua sắm",
                "Sôi động"
            ]
        },
        {
            "id": "PQC_DTQ_022",
            "name": "Làng chài Hàm Ninh",
            "lat": 10.178901,
            "lng": 104.056789,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Ẩm thực",
                "Hải sản"
            ]
        },
        {
            "id": "PQC_DTQ_023",
            "name": "Rạch Vẹm (Vương quốc Sao Biển)",
            "lat": 10.356789,
            "lng": 103.934567,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Hoang sơ",
                "Chụp ảnh"
            ]
        },
        {
            "id": "PQC_DTQ_024",
            "name": "Mũi Gành Dầu",
            "lat": 10.378901,
            "lng": 103.845678,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Biển",
                "Biên giới"
            ]
        },
        {
            "id": "PQC_DTQ_025",
            "name": "Vườn Quốc gia Phú Quốc",
            "lat": 10.323456,
            "lng": 103.956789,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Rừng",
                "Khám phá"
            ]
        },
        {
            "id": "PQC_DTQ_026",
            "name": "Cơ sở Ngọc trai Ngọc Hiền",
            "lat": 10.176543,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Trải nghiệm",
                "Trang sức"
            ]
        },
        {
            "id": "PQC_DTQ_027",
            "name": "Nhà thùng Nước mắm Khải Hoàn",
            "lat": 10.219876,
            "lng": 103.959876,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Trải nghiệm",
                "Đặc sản"
            ]
        },
        {
            "id": "PQC_DTQ_028",
            "name": "Vườn tiêu Khu Tượng",
            "lat": 10.289012,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Nông nghiệp",
                "Chụp ảnh",
                "Đặc sản"
            ]
        },
        {
            "id": "PQC_DTQ_029",
            "name": "Trại Ong Phú Quốc",
            "lat": 10.298765,
            "lng": 103.978901,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Sinh thái",
                "Giáo dục",
                "Nông nghiệp"
            ]
        },
        {
            "id": "PQC_DTQ_030",
            "name": "Rượu sim Bảy Gáo",
            "lat": 10.205678,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Đặc sản",
                "Tham quan",
                "Văn hóa"
            ]
        },
        {
            "id": "PQC_DTQ_031",
            "name": "Hòn Móng Tay",
            "lat": 9.923456,
            "lng": 103.978901,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Đảo",
                "Biển",
                "Lặn ngắm san hô"
            ]
        },
        {
            "id": "PQC_DTQ_032",
            "name": "Hòn May Rút Trong",
            "lat": 9.905678,
            "lng": 103.987654,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 0,
            "tags": [
                "Đảo",
                "Biển",
                "Hoang sơ"
            ]
        },
        {
            "id": "PQC_DTQ_033",
            "name": "Hòn May Rút Ngoài",
            "lat": 9.901234,
            "lng": 103.989012,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Đảo",
                "Biển",
                "Cắm trại"
            ]
        },
        {
            "id": "PQC_DTQ_034",
            "name": "Hòn Dăm Ngang (Gam Ghi)",
            "lat": 9.912345,
            "lng": 103.990123,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Đảo",
                "San hô",
                "Chụp ảnh"
            ]
        },
        {
            "id": "PQC_DTQ_035",
            "name": "Hòn Một",
            "lat": 10.356789,
            "lng": 104.056789,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Hoang sơ",
                "Cầu gỗ",
                "Khám phá"
            ]
        },
        {
            "id": "PQC_DTQ_036",
            "name": "Hòn Đồi Mồi",
            "lat": 10.334567,
            "lng": 103.834567,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Đảo nhỏ",
                "Hoàng hôn",
                "Lặn biển"
            ]
        },
        {
            "id": "PQC_DTQ_037",
            "name": "Bãi Dài",
            "lat": 10.334231,
            "lng": 103.856214,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Biển",
                "Cát trắng",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "PQC_DTQ_038",
            "name": "Bãi Ông Lang",
            "lat": 10.26789,
            "lng": 103.923456,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Biển",
                "Yên tĩnh",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "PQC_DTQ_039",
            "name": "Bãi Trường (Long Beach)",
            "lat": 10.189012,
            "lng": 103.965432,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Biển",
                "Sôi động",
                "Hoàng hôn"
            ]
        },
        {
            "id": "PQC_DTQ_040",
            "name": "Bảo tàng Cội Nguồn",
            "lat": 10.198765,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 20000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trưng bày"
            ]
        },
        {
            "id": "PQC_DTQ_041",
            "name": "Suối Đá Bàn",
            "lat": 10.245678,
            "lng": 104.005678,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 10000,
            "tags": [
                "Thiên nhiên",
                "Picnic",
                "Ngoài trời"
            ]
        },
        {
            "id": "PQC_DTQ_042",
            "name": "Sunset Sanato Beach Club",
            "lat": 10.176543,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 100000,
            "tags": [
                "Chụp ảnh",
                "Giải trí",
                "Biển"
            ]
        },
        {
            "id": "PQC_DTQ_043",
            "name": "Viewpoint Chuồn Chuồn",
            "lat": 10.218901,
            "lng": 103.96789,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Thành phố",
                "Chill"
            ]
        },
        {
            "id": "PQC_DTQ_044",
            "name": "Công viên San hô Namaste",
            "lat": 10.023456,
            "lng": 104.01789,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 950000,
            "tags": [
                "Trải nghiệm",
                "Lặn biển",
                "San hô"
            ]
        },
        {
            "id": "PQC_DTQ_045",
            "name": "Khu bảo tồn chó xoáy",
            "lat": 10.223456,
            "lng": 103.987654,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 50000,
            "tags": [
                "Động vật",
                "Đặc hữu",
                "Tham quan"
            ]
        },
        {
            "id": "PQC_DTQ_046",
            "name": "Suối Tiên",
            "lat": 10.156789,
            "lng": 104.01789,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Leo núi",
                "Hoang sơ"
            ]
        },
        {
            "id": "PQC_DTQ_047",
            "name": "Tiên Sơn Đỉnh",
            "lat": 10.15789,
            "lng": 104.018901,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Trekking",
                "Ngắm cảnh",
                "Mạo hiểm"
            ]
        },
        {
            "id": "PQC_DTQ_048",
            "name": "Vui-Fest Bazaar",
            "lat": 10.025678,
            "lng": 104.004567,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Nghệ thuật",
                "Sôi động"
            ]
        },
        {
            "id": "PQC_DTQ_049",
            "name": "Corona Casino",
            "lat": 10.334567,
            "lng": 103.856789,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Giải trí",
                "Sang trọng",
                "Trong nhà"
            ]
        },
        {
            "id": "PQC_DTQ_050",
            "name": "Cảng An Thới",
            "lat": 10.025678,
            "lng": 104.01789,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 10000,
            "tags": [
                "Giao thương",
                "Biển",
                "Tham quan"
            ]
        }
    ],
    "thanh_pho_ho_chi_minh": [
        {
            "id": "HCM_DTQ_001",
            "name": "Dinh Độc Lập",
            "lat": 10.7773,
            "lng": 106.695346,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Lịch sử",
                "Trong nhà",
                "Kiến trúc"
            ]
        },
        {
            "id": "HCM_DTQ_002",
            "name": "Bưu điện Trung tâm Sài Gòn",
            "lat": 10.780098,
            "lng": 106.699831,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Lịch sử",
                "Kiến trúc",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HCM_DTQ_003",
            "name": "Chợ Bến Thành",
            "lat": 10.772737,
            "lng": 106.697962,
            "category": "diem_tham_quan",
            "rating": 4,
            "price": 0,
            "tags": [
                "Sôi động",
                "Mua sắm",
                "Văn hóa"
            ]
        },
        {
            "id": "HCM_DTQ_004",
            "name": "Bảo tàng Chứng tích Chiến tranh",
            "lat": 10.779584,
            "lng": 106.692102,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 40000,
            "tags": [
                "Lịch sử",
                "Trong nhà",
                "Trưng bày"
            ]
        },
        {
            "id": "HCM_DTQ_005",
            "name": "Địa đạo Củ Chi",
            "lat": 11.141705,
            "lng": 106.461589,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 110000,
            "tags": [
                "Lịch sử",
                "Ngoài trời",
                "Khám phá"
            ]
        },
        {
            "id": "HCM_DTQ_006",
            "name": "Nhà thờ Đức Bà Sài Gòn",
            "lat": 10.779943,
            "lng": 106.698911,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo",
                "Lịch sử"
            ]
        },
        {
            "id": "HCM_DTQ_007",
            "name": "Thảo Cầm Viên Sài Gòn",
            "lat": 10.787608,
            "lng": 106.705002,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 60000,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Động vật"
            ]
        },
        {
            "id": "HCM_DTQ_008",
            "name": "Landmark 81 SkyView",
            "lat": 10.795185,
            "lng": 106.722085,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 450000,
            "tags": [
                "Hiện đại",
                "Trong nhà",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "HCM_DTQ_009",
            "name": "Khu du lịch Văn hoá Suối Tiên",
            "lat": 10.866312,
            "lng": 106.80321,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 180000,
            "tags": [
                "Giải trí",
                "Ngoài trời",
                "Gia đình"
            ]
        },
        {
            "id": "HCM_DTQ_010",
            "name": "Bitexco Financial Tower",
            "lat": 10.771748,
            "lng": 106.704343,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 240000,
            "tags": [
                "Hiện đại",
                "Trong nhà",
                "Ngắm cảnh"
            ]
        },
        {
            "id": "HCM_DTQ_011",
            "name": "Nhà hát Thành phố",
            "lat": 10.776855,
            "lng": 106.703214,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Nghệ thuật",
                "Kiến trúc",
                "Lịch sử"
            ]
        },
        {
            "id": "HCM_DTQ_012",
            "name": "Phố đi bộ Nguyễn Huệ",
            "lat": 10.773986,
            "lng": 106.703613,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Sôi động",
                "Ngoài trời",
                "Giải trí"
            ]
        },
        {
            "id": "HCM_DTQ_013",
            "name": "Phố đi bộ Bùi Viện",
            "lat": 10.767551,
            "lng": 106.693883,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Sôi động",
                "Giải trí đêm",
                "Ẩm thực"
            ]
        },
        {
            "id": "HCM_DTQ_014",
            "name": "Chợ hoa Hồ Thị Kỷ",
            "lat": 10.765505,
            "lng": 106.676972,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Ẩm thực",
                "Sôi động"
            ]
        },
        {
            "id": "HCM_DTQ_015",
            "name": "Công viên Nước Đầm Sen",
            "lat": 10.769137,
            "lng": 106.635999,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 220000,
            "tags": [
                "Giải trí",
                "Thể thao nước",
                "Gia đình"
            ]
        },
        {
            "id": "HCM_DTQ_016",
            "name": "VinWonders Grand Park",
            "lat": 10.840161,
            "lng": 106.84564,
            "category": "diem_tham_quan",
            "rating": 4.8,
            "price": 270000,
            "tags": [
                "Giải trí",
                "Hiện đại",
                "Gia đình"
            ]
        },
        {
            "id": "HCM_DTQ_017",
            "name": "Chùa Ngọc Hoàng",
            "lat": 10.79227,
            "lng": 106.6982,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Tâm linh"
            ]
        },
        {
            "id": "HCM_DTQ_018",
            "name": "Bảo tàng Mỹ thuật TP.HCM",
            "lat": 10.770126,
            "lng": 106.699216,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 30000,
            "tags": [
                "Nghệ thuật",
                "Lịch sử",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_019",
            "name": "Bảo tàng Lịch sử TP.HCM",
            "lat": 10.788227,
            "lng": 106.704609,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 30000,
            "tags": [
                "Lịch sử",
                "Trưng bày",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_020",
            "name": "Công viên Vinhomes Central Park",
            "lat": 10.79362,
            "lng": 106.724355,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Hiện đại"
            ]
        },
        {
            "id": "HCM_DTQ_021",
            "name": "KDL sinh thái Cần Giờ",
            "lat": 10.500854,
            "lng": 106.801723,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 60000,
            "tags": [
                "Thiên nhiên",
                "Sinh thái",
                "Khám phá"
            ]
        },
        {
            "id": "HCM_DTQ_022",
            "name": "Cầu Ánh Sao",
            "lat": 10.724898,
            "lng": 106.718621,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Lãng mạn",
                "Ngoài trời",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HCM_DTQ_023",
            "name": "Công viên Tao Đàn",
            "lat": 10.775821,
            "lng": 106.691993,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Thiên nhiên",
                "Ngoài trời",
                "Giải trí"
            ]
        },
        {
            "id": "HCM_DTQ_024",
            "name": "KDL sinh thái Bình Quới",
            "lat": 10.830168,
            "lng": 106.739569,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 130000,
            "tags": [
                "Văn hóa",
                "Ẩm thực",
                "Gia đình"
            ]
        },
        {
            "id": "HCM_DTQ_025",
            "name": "Rừng Sác Cần Giờ",
            "lat": 10.326336,
            "lng": 106.74386,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 35000,
            "tags": [
                "Sinh thái",
                "Thiên nhiên",
                "Khám phá"
            ]
        },
        {
            "id": "HCM_DTQ_026",
            "name": "KDL sinh thái Dần Xây",
            "lat": 10.501351,
            "lng": 106.867634,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 50000,
            "tags": [
                "Cắm trại",
                "Sinh thái",
                "Yên tĩnh"
            ]
        },
        {
            "id": "HCM_DTQ_027",
            "name": "Nóc hầm Thủ Thiêm",
            "lat": 10.770505,
            "lng": 106.709823,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Chụp ảnh",
                "Ngoài trời"
            ]
        },
        {
            "id": "HCM_DTQ_028",
            "name": "Chợ Bình Tây",
            "lat": 10.749564,
            "lng": 106.651045,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Lịch sử",
                "Văn hóa"
            ]
        },
        {
            "id": "HCM_DTQ_029",
            "name": "Chùa Bà Thiên Hậu",
            "lat": 10.759688,
            "lng": 106.662993,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Kiến trúc"
            ]
        },
        {
            "id": "HCM_DTQ_030",
            "name": "Bến Nhà Rồng",
            "lat": 10.768533,
            "lng": 106.706717,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 40000,
            "tags": [
                "Lịch sử",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_031",
            "name": "Chợ Tân Định",
            "lat": 10.789838,
            "lng": 106.689787,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Ẩm thực",
                "Giao thương"
            ]
        },
        {
            "id": "HCM_DTQ_032",
            "name": "Nhà thờ Tân Định",
            "lat": 10.788599,
            "lng": 106.690743,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Kiến trúc",
                "Tôn giáo",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HCM_DTQ_033",
            "name": "Saigon Waterbus",
            "lat": 10.775609,
            "lng": 106.706834,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 15000,
            "tags": [
                "Ngắm cảnh",
                "Giao thông",
                "Lãng mạn"
            ]
        },
        {
            "id": "HCM_DTQ_034",
            "name": "Saigon Centre / Takashimaya",
            "lat": 10.773134,
            "lng": 106.700931,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Hiện đại",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_035",
            "name": "Trung tâm thương mại Gigamall",
            "lat": 10.828655,
            "lng": 106.721581,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Giải trí",
                "Mua sắm",
                "Nghệ thuật"
            ]
        },
        {
            "id": "HCM_DTQ_036",
            "name": "Hồ Con Rùa",
            "lat": 10.782613,
            "lng": 106.695885,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Giao lộ",
                "Lịch sử",
                "Ngoài trời"
            ]
        },
        {
            "id": "HCM_DTQ_037",
            "name": "Cầu Ba Son (Cầu Thủ Thiêm 2)",
            "lat": 10.779762,
            "lng": 106.710132,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Hiện đại",
                "Chụp ảnh",
                "Giao thông"
            ]
        },
        {
            "id": "HCM_DTQ_038",
            "name": "Bảo tàng Y học Cổ truyền",
            "lat": 10.776371,
            "lng": 106.671781,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 120000,
            "tags": [
                "Văn hóa",
                "Lịch sử",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_039",
            "name": "Chùa Giác Lâm",
            "lat": 10.778822,
            "lng": 106.649148,
            "category": "diem_tham_quan",
            "rating": 4.7,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Lịch sử",
                "Yên tĩnh"
            ]
        },
        {
            "id": "HCM_DTQ_040",
            "name": "Khu phố Tàu (Chinatown Quận 5)",
            "lat": 10.751535,
            "lng": 106.658262,
            "category": "diem_tham_quan",
            "rating": 3.7,
            "price": 0,
            "tags": [
                "Văn hóa",
                "Ẩm thực",
                "Kiến trúc"
            ]
        },
        {
            "id": "HCM_DTQ_041",
            "name": "AEON MALL Bình Tân",
            "lat": 10.742918,
            "lng": 106.611845,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Giải trí",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_042",
            "name": "Khu du lịch Bến Xưa",
            "lat": 10.852866,
            "lng": 106.677396,
            "category": "diem_tham_quan",
            "rating": 4.3,
            "price": 0,
            "tags": [
                "Ẩm thực",
                "Gia đình",
                "Nghỉ dưỡng"
            ]
        },
        {
            "id": "HCM_DTQ_043",
            "name": "Công viên bến Bạch Đằng",
            "lat": 10.775088,
            "lng": 106.706448,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Ngắm cảnh",
                "Ngoài trời",
                "Giải trí"
            ]
        },
        {
            "id": "HCM_DTQ_044",
            "name": "Chùa Bửu Long",
            "lat": 10.88342,
            "lng": 106.836002,
            "category": "diem_tham_quan",
            "rating": 4.9,
            "price": 0,
            "tags": [
                "Tôn giáo",
                "Kiến trúc Thái",
                "Tâm linh"
            ]
        },
        {
            "id": "HCM_DTQ_045",
            "name": "Saigon Sniper",
            "lat": 10.788468,
            "lng": 106.703742,
            "category": "diem_tham_quan",
            "rating": 4.6,
            "price": 35000,
            "tags": [
                "Thể thao",
                "Trải nghiệm",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_046",
            "name": "Nhà hát Rồng Vàng",
            "lat": 10.776502,
            "lng": 106.692601,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 330000,
            "tags": [
                "Nghệ thuật",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_047",
            "name": "Bảo tàng Địa chất TP.HCM",
            "lat": 10.785007,
            "lng": 106.707704,
            "category": "diem_tham_quan",
            "rating": 4.5,
            "price": 0,
            "tags": [
                "Khoa học",
                "Khám phá",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_048",
            "name": "Chợ An Đông",
            "lat": 10.75842,
            "lng": 106.672238,
            "category": "diem_tham_quan",
            "rating": 4.1,
            "price": 0,
            "tags": [
                "Mua sắm sỉ",
                "Văn hóa",
                "Trong nhà"
            ]
        },
        {
            "id": "HCM_DTQ_049",
            "name": "Saigon Garden",
            "lat": 10.776741,
            "lng": 106.703957,
            "category": "diem_tham_quan",
            "rating": 4.2,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Hiện đại",
                "Chụp ảnh"
            ]
        },
        {
            "id": "HCM_DTQ_050",
            "name": "Trung Tâm Thương Mại Vạn Hạnh",
            "lat": 10.770712,
            "lng": 106.669922,
            "category": "diem_tham_quan",
            "rating": 4.4,
            "price": 0,
            "tags": [
                "Mua sắm",
                "Giải trí",
                "Nghệ thuật"
            ]
        }
    ]
};
