/* 
  ========================================================================
  FILE: shared.js
  CHỨC NĂNG: 
  - Quản lý các tiện ích UI dùng chung toàn hệ thống (hiển thị Toast thông báo, bật/tắt Popup).
  - Tự động nạp và khởi tạo các thành phần giao diện dùng chung (Header, Footer) từ thư mục \`components/\`.
  - Thiết lập Event Delegation cấp cao nhất trên body/container để xử lý đóng Popup, chuyển hướng banner quảng cáo chung.
  - Tệp này được import ở hầu hết các entry points để đảm bảo các yếu tố UI cơ bản luôn hoạt động.
  ========================================================================
*/
import { fetchHtmlFragment } from './fragmentLoader.js';

// ── Shared UI utilities ───────────────────────────────────────

export function showPopup(id) { document.getElementById(id)?.classList.add('open'); }
export function closePopup(id) { document.getElementById(id)?.classList.remove('open'); }

let _toastTimer;
export function showToast(msg, type) {
    const t=document.getElementById('toast'), tm=document.getElementById('toast-msg');
    if (!t||!tm) return;
    tm.textContent=msg;
    t.className='toast show'+(type?' '+type:'');
    clearTimeout(_toastTimer);
    _toastTimer=setTimeout(()=>{t.className='toast';}, type==='error'?4500:type==='warning'?5000:3200);
}

const CACHE_VERSION = Date.now(); // force update
const HEADER_COMPONENT_URL = new URL(`../components/header.html?v=${CACHE_VERSION}`, import.meta.url);
const FOOTER_COMPONENT_URL = new URL(`../components/footer.html?v=${CACHE_VERSION}`, import.meta.url);

// ── Shared event delegation ───────────────────────────────────

function initSharedEvents(container) {
    // Popup overlay: click outside to close
    container.querySelectorAll('.popup-ov').forEach(o=>{
        o.addEventListener('click', e=>{ if(e.target===o) o.classList.remove('open'); });
    });

    // Declarative: data-popup-close="id"
    container.addEventListener('click', e=>{
        const btn = e.target.closest('[data-popup-close]');
        if (btn) {
            closePopup(btn.dataset.popupClose);
            // data-toast-success: show success toast after close
            if (btn.dataset.toastSuccess) showToast(btn.dataset.toastSuccess, 'success');
        }
        // Ad banner navigation: data-nav="chatbot|planner"
        const ad = e.target.closest('[data-nav]');
        if (ad) {
            const nav = ad.dataset.nav;
            window.location.href = nav==='chatbot' ? './chatbot.html' : './planner.html';
        }
    });
}

// ── Update header user state from localStorage ──────────────
function _updateHeaderUser() {
    try {
        const user = JSON.parse(localStorage.getItem('topgo_user'));
        const nameEl = document.getElementById('user-name-display');
        const linkEl = document.getElementById('user-info-btn');
        if (user && nameEl && linkEl) {
            nameEl.textContent = user.firstname || user.email || 'Tài khoản';
            linkEl.href = './profile.html';
        }
    } catch {}
}

// ── Load shared HTML components ───────────────────────────────

export async function loadSharedComponents() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html'; // index.html = homepage
    try {
        const [headerFrag, footerFrag] = await Promise.all([
            fetchHtmlFragment('header', HEADER_COMPONENT_URL),
            fetchHtmlFragment('footer', FOOTER_COMPONENT_URL),
        ]);

        const headerEl = document.getElementById('site-header');
        if (headerEl) {
            headerEl.innerHTML = headerFrag.text;
            // Active nav detection
            let activeId = 'nav-planner';
            if (currentPage === 'chatbot.html') activeId = 'nav-chatbot';
            else if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') activeId = 'nav-home';
            else if (currentPage === 'auth.html' || currentPage === 'profile.html') activeId = null;
            if (activeId) document.getElementById(activeId)?.classList.add('active');

            // User state in header
            _updateHeaderUser();
        }

        const sharedEl = document.getElementById('site-shared');
        if (sharedEl) {
            sharedEl.innerHTML = footerFrag.text;
            initSharedEvents(sharedEl);
        }
    } catch(err) {
        console.warn('[TopGo] loadSharedComponents failed:', err.message);
    } finally {
        document.body.classList.add('app-ready');

        // Thêm floating mini chatbot cho mọi trang ngoại trừ trang chatbot
        if (currentPage !== 'chatbot.html') {
            const miniChatHTML = `
            <div id="mini-chat-widget" class="mc-widget">
                <div id="mc-window" class="mc-window">
                    <div class="mc-header">
                        <div class="mc-header-left">
                            <span class="mc-eyebrow">Trợ lý AI</span>
                            <h3 class="mc-title">TopChat</h3>
                        </div>
                        <button id="mc-close" class="mc-close">&times;</button>
                    </div>
                    <div class="mc-body" id="mc-body">
                        <div class="mc-msg bot">
                            <div class="mc-bubble">Chào bạn! Mình là TopChat AI. Bạn đang lên kế hoạch du lịch ở đâu?</div>
                        </div>
                        <div class="mc-chips">
                            <div class="mc-chip" data-q="Gợi ý Đà Nẵng">Gợi ý Đà Nẵng</div>
                            <div class="mc-chip" data-q="Ăn gì Phú Quốc?">Ăn gì Phú Quốc?</div>
                        </div>
                    </div>
                    <div class="mc-footer">
                        <input type="text" id="mc-input" class="mc-input" placeholder="Hỏi TopChat..." autocomplete="off">
                        <button id="mc-send" class="mc-send">Gửi</button>
                    </div>
                </div>
                <button id="mc-trigger" class="mc-trigger" aria-label="Mở TopChat">
                    <span class="mc-trigger-label" aria-hidden="true">
                        <span class="mc-trigger-top">Top</span>
                        <span class="mc-trigger-chat">Chat</span>
                    </span>
                </button>
                <div id="mc-invite-bubble" class="mc-invite-bubble" role="status" aria-live="polite"></div>
            </div>
            `;
            document.body.insertAdjacentHTML('beforeend', miniChatHTML);

            const mcWidget = document.getElementById('mini-chat-widget');
            const mcTrigger = document.getElementById('mc-trigger');
            const mcClose = document.getElementById('mc-close');
            const mcInput = document.getElementById('mc-input');
            const mcSend = document.getElementById('mc-send');
            const mcBody = document.getElementById('mc-body');

            // Invite bubble: 4 messages luân phiên, văn phong hài hước tự nhiên
            const bubble = document.getElementById('mc-invite-bubble');
            const BUBBLE_MSGS = [
                'Bí ở đâu, TopChat giúp ở đó!',
                'Chưa biết đi đâu? Hỏi mình đi, mình biết hết!',
                'Mùa hè đến rồi, kế hoạch chưa có à?',
                'Đặt lịch trình xịn chỉ mất 2 phút thôi!',
            ];
            let _bubbleMsgIdx = 0;
            let _bubbleCycleTimer = null;

            function _showBubble() {
                if (!bubble || mcWidget.classList.contains('open')) return;
                bubble.textContent = BUBBLE_MSGS[_bubbleMsgIdx];
                _bubbleMsgIdx = (_bubbleMsgIdx + 1) % BUBBLE_MSGS.length;
                bubble.classList.add('show');
                // Hiện 5.5s, chờ 4.4s rồi hiện lại với message tiếp theo
                _bubbleCycleTimer = setTimeout(() => {
                    bubble.classList.remove('show');
                    _bubbleCycleTimer = setTimeout(_showBubble, 4400);
                }, 5500);
            }

            // Start immediately after a brief page-settle delay
            _bubbleCycleTimer = setTimeout(_showBubble, 1200);



            mcTrigger.addEventListener('click', (e) => {
                e.stopPropagation();
                mcWidget.classList.add('open');
                mcInput.focus();
                // Stop cycle and hide bubble when chat opens
                clearTimeout(_bubbleCycleTimer);
                if (bubble) bubble.classList.remove('show');
            });

            mcClose.addEventListener('click', (e) => {
                e.stopPropagation();
                mcWidget.classList.remove('open');
            });

            document.addEventListener('click', (e) => {
                if (mcWidget.classList.contains('open') && !mcWidget.contains(e.target)) {
                    mcWidget.classList.remove('open');
                }
            });

            // Chuẩn bị sẵn function call BE trong tương lai
            const fetchMiniChatResponse = async (query) => {
                return new Promise(resolve => {
                    setTimeout(() => {
                        const lowerQ = query.toLowerCase();
                        if (lowerQ.includes('đà nẵng')) {
                            resolve("Đà Nẵng là thành phố biển tuyệt vời nhất Việt Nam. Bạn có thể ghé thăm Bà Nà Hills với Cầu Vàng nổi tiếng, check-in tại Cầu Rồng phun lửa vào cuối tuần, và tận hưởng bãi biển Mỹ Khê trong xanh. Về ẩm thực, đừng quên thử mì Quảng, bánh tráng cuốn thịt heo và hải sản tươi sống ở các quán ven biển. Mình có thể lên một lịch trình chi tiết 3 ngày 2 đêm cho bạn, bao gồm cả Hội An nếu bạn muốn.");
                        } else if (lowerQ.includes('phú quốc')) {
                            resolve("Phú Quốc được mệnh danh là Đảo Ngọc với những bãi biển đẹp như Bãi Sao, Bãi Dài. Khi đến đây, bạn nhất định phải thử bún quậy Kiến Xây, gỏi cá trích cực kỳ tươi ngon, và hải sản tại làng chài Hàm Ninh. Ngoài ra, việc trải nghiệm đi cáp treo Hòn Thơm và lặn ngắm san hô là những hoạt động không thể bỏ qua. Nếu bạn dự định đi gia đình, khu vui chơi VinWonders cũng là một lựa chọn xuất sắc.");
                        } else {
                            resolve(`Địa điểm "${query}" rất thú vị! Chuyến đi đến đây sẽ mang lại nhiều trải nghiệm đáng nhớ. Khu vực này nổi tiếng với các danh lam thắng cảnh tự nhiên tuyệt đẹp cùng nền văn hóa ẩm thực vô cùng đa dạng và độc đáo. Có rất nhiều hoạt động từ khám phá mạo hiểm đến nghỉ dưỡng thư giãn. Để mình lên một kế hoạch chi tiết nhất phù hợp với sở thích của bạn nhé.`);
                        }
                    }, 600); // Giả lập độ trễ mạng
                });
            };

            const appendBotMessage = (content, query) => {
                const maxLen = 100;
                let textToShow = content;
                let showContinueBtn = false;
                
                if (content.length > maxLen) {
                    textToShow = content.substring(0, maxLen) + '...';
                    showContinueBtn = true;
                }
                
                let bubbleHTML = `<div class="mc-bubble">${textToShow}`;
                if (showContinueBtn) {
                    bubbleHTML += `<br><a href="./chatbot.html?q=${encodeURIComponent(query)}" class="mc-continue-btn">Tiếp tục trò chuyện &rarr;</a>`;
                }
                bubbleHTML += `</div>`;
                
                mcBody.insertAdjacentHTML('beforeend', `<div class="mc-msg bot">${bubbleHTML}</div>`);
                mcBody.scrollTop = mcBody.scrollHeight;
            };

            const sendMsg = async (text) => {
                if (!text.trim()) return;
                const query = text.trim();
                
                // Add user message
                mcBody.insertAdjacentHTML('beforeend', `<div class="mc-msg user"><div class="mc-bubble">${query}</div></div>`);
                mcInput.value = '';
                mcBody.scrollTop = mcBody.scrollHeight;
                
                // Typing indicator
                const typingId = 'typing-' + Date.now();
                mcBody.insertAdjacentHTML('beforeend', `<div id="${typingId}" class="mc-msg bot"><div class="mc-bubble"><div class="mc-typing"><span class="mc-dot"></span><span class="mc-dot"></span><span class="mc-dot"></span></div></div></div>`);
                mcBody.scrollTop = mcBody.scrollHeight;

                try {
                    const responseText = await fetchMiniChatResponse(query);
                    const typingEl = document.getElementById(typingId);
                    if (typingEl) typingEl.remove();
                    appendBotMessage(responseText, query);
                } catch(err) {
                    const typingEl = document.getElementById(typingId);
                    if (typingEl) typingEl.remove();
                    appendBotMessage("Xin lỗi, có lỗi xảy ra. Hãy thử lại.", query);
                }
            };

            mcSend.addEventListener('click', () => sendMsg(mcInput.value));
            mcInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') sendMsg(mcInput.value);
            });
            
            mcWidget.querySelectorAll('.mc-chip').forEach(chip => {
                chip.addEventListener('click', () => sendMsg(chip.dataset.q));
            });
        }
    }
}

// Auto-run on import (both index and chatbot pages need this)
loadSharedComponents();
