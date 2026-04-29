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
            window.location.href = nav==='chatbot' ? './chatbot.html' : './index.html';
        }
    });
}

// ── Load shared HTML components ───────────────────────────────

export async function loadSharedComponents() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    try {
        const [headerFrag, footerFrag] = await Promise.all([
            fetchHtmlFragment('header', HEADER_COMPONENT_URL),
            fetchHtmlFragment('footer', FOOTER_COMPONENT_URL),
        ]);

        const headerEl = document.getElementById('site-header');
        if (headerEl) {
            headerEl.innerHTML = headerFrag.text;
            let activeId = 'nav-planner';
            if (currentPage === 'chatbot.html') activeId = 'nav-chatbot';
            else if (currentPage === 'home.html' || currentPage === '' || currentPage === '/') activeId = 'nav-home';
            document.getElementById(activeId)?.classList.add('active');
        }

        const sharedEl = document.getElementById('site-shared');
        if (sharedEl) {
            sharedEl.innerHTML = footerFrag.text;
            initSharedEvents(sharedEl);
        }
    } catch(err) {
        console.warn('[TopGo] loadSharedComponents failed:', err.message);
    }
}

// Auto-run on import (both index and chatbot pages need this)
loadSharedComponents();
