/* 
  ========================================================================
  FILE: shared.js
  CHỨC NĂNG: 
  - Quản lý các tiện ích UI dùng chung toàn hệ thống (hiển thị Toast thông báo, bật/tắt Popup).
  - Tự động nạp và khởi tạo các thành phần giao diện dùng chung (Header, Footer) từ thư mục `components/`.
  - Thiết lập Event Delegation cấp cao nhất trên body/container để xử lý đóng Popup, chuyển hướng banner quảng cáo chung.
  - Tệp này được import ở hầu hết các entry points để đảm bảo các yếu tố UI cơ bản luôn hoạt động.
  ========================================================================
*/
import { fetchHtmlFragment } from './fragmentLoader.js';

// ── Immediate Dark Mode Application to prevent FOUC ───────────────────
try {
    import('./darkmode.js').catch(() => {
        // Silently catch error if darkmode.js is missing or ignored by git
    });
} catch (e) {
    // Safe fallback
}

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

    // Google Sign-In inside popup-login
    const popupLoginGoogleBtn = container.querySelector('#popup-login-google-btn');
    if (popupLoginGoogleBtn) {
        popupLoginGoogleBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            closePopup('popup-login');
            try {
                if (window.TopGoAuth) {
                    await window.TopGoAuth.loginWithGoogle();
                    showToast('Đăng nhập thành công!', 'success');
                    
                    // Tự động lưu lịch trình đang chờ sau khi đăng nhập thành công
                    if (window._pendingSaveTrip) {
                        showToast('Đang tự động lưu lịch trình...', 'warning');
                        try {
                            await window.TopGoAuth.saveTrip(window._pendingSaveTrip);
                            delete window._pendingSaveTrip;
                            showToast('Lịch trình đã được lưu vào hồ sơ cá nhân!', 'success');
                        } catch (err) {
                            showToast('Lưu lịch trình thất bại: ' + err.message, 'error');
                        }
                    }
                } else {
                    console.warn("AuthService (TopGoAuth) chưa được nạp");
                }
            } catch (err) {
                console.error("Popup login error:", err);
                showToast('Đăng nhập thất bại hoặc bị hủy', 'error');
            }
        });
    }
}

// ── Update header user state from localStorage ──────────────
function _updateHeaderUser() {
    try {
        const user = JSON.parse(localStorage.getItem('topgo_user'));
        const nameEl = document.getElementById('user-name-display');
        const linkEl = document.getElementById('user-info-btn');
        const iconEl = document.getElementById('user-icon');
        if (user) {
            if (nameEl) nameEl.textContent = user.firstname || user.email || 'Tài khoản';
            if (linkEl) linkEl.href = './profile.html';
            if (iconEl && user.photoURL) {
                iconEl.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            }
        } else {
            if (nameEl) nameEl.textContent = 'Đăng nhập';
            if (linkEl) linkEl.href = './auth.html';
            if (iconEl) {
                iconEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                </svg>`;
            }
        }
    } catch (e) {
        console.error("Lỗi đồng bộ header:", e);
    }
}

// Lắng nghe sự kiện thay đổi trạng thái xác thực để đồng bộ Header lập tức
window.addEventListener('topgo-auth-change', _updateHeaderUser);


// ── Initialize Mobile Toggle Dropdown ──────────────────────────
function _initMobileToggle(headerEl) {
    const toggleBtn = document.getElementById('header-mobile-toggle');
    const dropdownMenu = document.getElementById('header-dropdown-menu');
    if (!toggleBtn || !dropdownMenu) return;

    const header = document.querySelector('.header');

    // Click handler to toggle open class
    toggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = toggleBtn.classList.toggle('open');
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        dropdownMenu.classList.toggle('open', isOpen);
        if (header) {
            header.classList.toggle('dropdown-active', isOpen);
        }
    });

    // Close when clicking a link
    dropdownMenu.querySelectorAll('.mobile-nav-a').forEach(link => {
        link.addEventListener('click', () => {
            toggleBtn.classList.remove('open');
            toggleBtn.setAttribute('aria-expanded', 'false');
            dropdownMenu.classList.remove('open');
            if (header) {
                header.classList.remove('dropdown-active');
            }
        });
    });

    // Close when clicking outside header
    document.addEventListener('click', (e) => {
        if (toggleBtn.classList.contains('open')) {
            const clickedInsideHeader = headerEl.contains(e.target) || dropdownMenu.contains(e.target);
            if (!clickedInsideHeader) {
                toggleBtn.classList.remove('open');
                toggleBtn.setAttribute('aria-expanded', 'false');
                dropdownMenu.classList.remove('open');
                if (header) {
                    header.classList.remove('dropdown-active');
                }
            }
        }
    });
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
            let mobActiveId = 'mob-nav-planner';
            if (currentPage === 'chatbot.html') {
                activeId = 'nav-chatbot';
                mobActiveId = 'mob-nav-chatbot';
            } else if (currentPage === 'index.html' || currentPage === '' || currentPage === '/') {
                activeId = 'nav-home';
                mobActiveId = 'mob-nav-home';
            } else if (currentPage === 'aboutus.html') {
                activeId = 'nav-aboutus';
                mobActiveId = 'mob-nav-aboutus';
            } else if (currentPage === 'pricing.html') {
                activeId = 'nav-pricing';
                mobActiveId = 'mob-nav-pricing';
            } else if (currentPage === 'auth.html' || currentPage === 'profile.html') {
                activeId = null;
                mobActiveId = null;
            }
            if (activeId) document.getElementById(activeId)?.classList.add('active');
            if (mobActiveId) document.getElementById(mobActiveId)?.classList.add('active');

            // User state in header
            _updateHeaderUser();

            // Initialize Dark Mode Toggle if the module exists
            try {
                const dm = await import('./darkmode.js');
                if (dm && typeof dm.initThemeToggle === 'function') {
                    dm.initThemeToggle();
                }
            } catch (err) {
                // Silently catch error if darkmode.js is missing or fails to load
            }

            // Initialize Mobile Toggle Dropdown
            _initMobileToggle(headerEl);
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
            // Khởi tạo session_id riêng biệt cho mini chatbot
            const miniSessionId = 'mini_' + Math.random().toString(36).substring(2, 11);

            const fetchMiniChatResponse = async (query) => {
                try {
                    const _isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
                    const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
                    
                    // Thêm chỉ thị yêu cầu trả lời ngắn gọn vào câu hỏi gửi lên backend
                    const modifiedQuery = query + "\n\n(Lưu ý từ hệ thống: Vì đây là ô chat nhỏ góc màn hình, hãy trả lời thật ngắn gọn, súc tích trong vòng 2-3 câu ngắn, tối giản nhưng đầy đủ ý)";
                    
                    const res = await fetch(`${API_BASE}/api/chat`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ message: modifiedQuery, session_id: miniSessionId }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    const data = await res.json();
                    
                    // Phát hiện lỗi từ backend trả về thành công dạng chuỗi lỗi
                    if (data.reply && (data.reply.includes('Lỗi khi giao tiếp với AI') || data.reply.includes('429') || data.reply.includes('RESOURCE_EXHAUSTED') || data.reply.includes('Quota exceeded'))) {
                        throw new Error('AI_QUOTA_EXCEEDED');
                    }
                    
                    return data.reply;
                } catch(err) {
                    console.warn('[TopGo] Mini chatbot API error, falling back to mock:', err);
                    return new Promise(resolve => {
                        setTimeout(() => {
                            const prefix = "⚠️ [AI Bận - Offline Mode] ";
                            const lowerQ = query.toLowerCase();
                            if (lowerQ.includes('đà nẵng')) {
                                resolve(prefix + "Đà Nẵng có bãi biển Mỹ Khê, Bà Nà Hills và ẩm thực đa dạng (mì Quảng, hải sản). Rất đáng để ghé thăm trải nghiệm!");
                            } else if (lowerQ.includes('phú quốc')) {
                                resolve(prefix + "Phú Quốc có các bãi biển đẹp như Bãi Sao, Bãi Dài, đặc sản bún quậy, gỏi cá trích và cáp treo Hòn Thơm.");
                            } else {
                                resolve(prefix + `Điểm đến ${query} rất thú vị! Hãy dùng công cụ AI Planner để thiết lập lịch trình cụ thể nhé.`);
                            }
                        }, 500);
                    });
                }
            };

            const appendBotMessage = (content, query) => {
                const maxLen = 200;
                let textToShow = content;
                let showContinueBtn = false;
                
                if (content.length > maxLen) {
                    textToShow = content.substring(0, maxLen) + '...';
                    showContinueBtn = true;
                }
                
                // Format basic Markdown to HTML
                const formattedText = textToShow
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\*(.*?)\*/g, '<em>$1</em>')
                    .replace(/\n/g, '<br>');
                
                let bubbleHTML = `<div class="mc-bubble">${formattedText}`;
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


