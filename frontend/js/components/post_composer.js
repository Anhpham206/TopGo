/* =====================================================================
   post_composer.js  —  Component Ô Đăng bài ở đầu Newsfeed (Bích Diệp)
   Mục đích:
   - Render một khối giao diện inline nhỏ ở đầu trang News Feed.
   - Khi người dùng click vào → mở Post Modal (post_create_modal.js).
   - Không phụ thuộc vào trip — chỉ dùng cho bài đăng mới không kèm lịch trình.
   Cách dùng (Kiên nhúng vào feed.html / explore.html):
     <div id="post-composer-container"></div>
     <div id="post-modal-container"></div>
     <script type="module">
       import { renderPostComposer } from './js/components/post_composer.js';
       import { initPostModal }      from './js/components/post_create_modal.js';
       initPostModal();
       renderPostComposer();
     </script>
   ===================================================================== */

/**
 * Render khối composer đăng bài ở đầu Newsfeed.
 * @param {string} containerId  - ID của div chứa (mặc định: 'post-composer-container')
 * @param {Object|null} trip    - Dữ liệu lịch trình đính kèm nếu muốn mở modal kèm lịch trình (tuỳ chọn)
 */
export function renderPostComposer(containerId = 'post-composer-container', trip = null) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.warn(`[PostComposer] Không tìm thấy container #${containerId}`);
    return;
  }

  /* ── Lấy thông tin user từ localStorage ── */
  let user = null;
  try { 
    user = JSON.parse(localStorage.getItem('topgo_user')); 
  } catch (e) {}
  
  // Nếu chưa đăng nhập: tên là 'User', avatar trống
  const photoUrl  = user?.photoUrl || '';
  const displayName = user ? (user.firstname || user.displayName || 'Thành viên') : 'User';

  /* ── Avatar HTML ── */
  const avatarHtml = photoUrl
    ? `<img src="${photoUrl}" alt="avatar" class="pc-avatar-img" referrerpolicy="no-referrer" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const avatarFallback = `
    <div class="pc-avatar-fallback" style="${photoUrl ? 'display:none' : ''}">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    </div>`;

  container.innerHTML = `
  <style>
    /* ── Post Composer Wrapper ── */
    .pc-wrapper {
      background: rgba(255, 255, 255, 0.95);
      border: 1px solid var(--border, #cde9f5);
      border-radius: 20px;
      padding: 16px 20px;
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      box-shadow: 0 4px 20px rgba(0, 169, 255, 0.07);
      font-family: var(--font, 'Inter'), sans-serif;
      transition: box-shadow 0.2s;
    }
    .pc-wrapper:hover {
      box-shadow: 0 6px 28px rgba(0, 169, 255, 0.13);
    }

    /* ── Top row: avatar + input trigger ── */
    .pc-top {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    /* ── Avatar ── */
    .pc-avatar {
      width: 42px; height: 42px;
      border-radius: 50%;
      flex-shrink: 0;
      overflow: hidden;
      border: 2px solid var(--border, #cde9f5);
      background: rgba(0, 169, 255, 0.06);
      display: flex; align-items: center; justify-content: center;
    }
    .pc-avatar-img {
      width: 100%; height: 100%;
      object-fit: cover;
    }
    .pc-avatar-fallback {
      width: 100%; height: 100%;
      display: flex; align-items: center; justify-content: center;
      color: var(--p1, #00a9ff);
    }

    /* ── Input placeholder trigger ── */
    .pc-input-trigger {
      flex: 1;
      background: var(--bg-soft, #f4f9fd);
      border: 1.5px solid var(--border, #cde9f5);
      border-radius: 999px;
      padding: 11px 20px;
      font-size: 14px;
      color: var(--muted, #8aabb8);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      font-family: inherit;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pc-input-trigger:hover {
      border-color: var(--p1, #00a9ff);
      background: rgba(0, 169, 255, 0.04);
      color: var(--text, #264e6b);
    }

    /* ── Divider ── */
    .pc-divider {
      height: 1px;
      background: var(--border-light, #eaf4fb);
      margin: 0 -4px;
    }

    /* ── Bottom action buttons ── */
    .pc-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }
    .pc-actions-left {
      display: flex;
      gap: 8px;
    }
    .pc-icon-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 38px;
      height: 38px;
      border: none;
      border-radius: 50%;
      background: rgba(0, 169, 255, 0.04);
      color: var(--p1, #00a9ff);
      cursor: pointer;
      transition: all 0.2s;
    }
    .pc-icon-btn:hover {
      background: rgba(0, 169, 255, 0.12);
      transform: scale(1.05);
    }
    .pc-action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      padding: 9px 18px;
      border: none;
      border-radius: 20px;
      background: transparent;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--muted, #6b8ca0);
      cursor: pointer;
      transition: all 0.18s;
      font-family: inherit;
    }
    .pc-action-btn.pc-btn-post {
      color: #fff;
      background: linear-gradient(90deg, var(--p1, #00a9ff), var(--p2, #0051ff));
      box-shadow: 0 4px 12px rgba(0,169,255,0.2);
    }
    .pc-action-btn.pc-btn-post:hover {
      box-shadow: 0 4px 16px rgba(0,169,255,0.35);
      transform: translateY(-1px);
    }

    /* ── Dark Mode Overrides ── */
    body.dark .pc-wrapper {
      background: rgba(22, 32, 51, 0.75);
      border-color: rgba(255, 255, 255, 0.08);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.35);
    }
    body.dark .pc-avatar {
      border-color: rgba(255, 255, 255, 0.08);
      background: rgba(0, 0, 0, 0.2);
    }
    body.dark .pc-input-trigger {
      background: rgba(0, 0, 0, 0.2);
      border-color: rgba(255, 255, 255, 0.08);
      color: var(--muted, #94a3b8);
    }
    body.dark .pc-input-trigger:hover {
      border-color: var(--p1, #00a9ff);
      background: rgba(0, 169, 255, 0.08);
      color: #fff;
    }
    body.dark .pc-divider {
      background: rgba(255, 255, 255, 0.08);
    }
    body.dark .pc-icon-btn {
      background: rgba(255, 255, 255, 0.04);
      color: var(--p1, #00a9ff);
    }
    body.dark .pc-icon-btn:hover {
      background: rgba(0, 169, 255, 0.15);
    }
  </style>

  <div class="pc-wrapper">

    <!-- Avatar + Input trigger -->
    <div class="pc-top">
      <div class="pc-avatar">
        ${avatarHtml}
        ${avatarFallback}
      </div>
      <button class="pc-input-trigger" id="pc-trigger-input">
        ${displayName} đang nghĩ gì về chuyến đi?
      </button>
    </div>

    <!-- Divider -->
    <div class="pc-divider"></div>

    <!-- Action buttons -->
    <div class="pc-actions">
      <div class="pc-actions-left">
        <!-- Ảnh -->
        <button class="pc-icon-btn" id="pc-btn-photo" title="Thêm ảnh">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>

        <!-- Video -->
        <button class="pc-icon-btn" id="pc-btn-video" title="Thêm video">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect>
            <line x1="7" y1="2" x2="7" y2="22"></line>
            <line x1="17" y1="2" x2="17" y2="22"></line>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <line x1="2" y1="7" x2="7" y2="7"></line>
            <line x1="2" y1="17" x2="7" y2="17"></line>
            <line x1="17" y1="17" x2="22" y2="17"></line>
            <line x1="17" y1="7" x2="22" y2="7"></line>
          </svg>
        </button>

        <!-- Tag địa điểm -->
        <button class="pc-icon-btn" id="pc-btn-tag" title="Thẻ địa điểm">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </button>
      </div>

      <!-- Đăng bài -->
      <button class="pc-action-btn pc-btn-post" id="pc-btn-post">
        Đăng bài
      </button>
    </div>
  </div>
  `;

  /* ── Gán sự kiện: tất cả đều mở Post Modal ── */
  const openModal = () => {
    if (window.openPostModal) {
      window.openPostModal(trip);
    } else {
      console.warn('[PostComposer] window.openPostModal chưa được khởi tạo. Hãy gọi initPostModal() trước.');
    }
  };

  document.getElementById('pc-trigger-input')?.addEventListener('click', openModal);
  document.getElementById('pc-btn-photo')?.addEventListener('click',   openModal);
  document.getElementById('pc-btn-video')?.addEventListener('click',   openModal);
  document.getElementById('pc-btn-tag')?.addEventListener('click',     openModal);
  document.getElementById('pc-btn-post')?.addEventListener('click',    openModal);

  /* ── Lắng nghe sự kiện thay đổi đăng nhập để tự động cập nhật lại UI ── */
  if (!window._postComposerListenerBound) {
    window._postComposerListenerBound = true;
    window.addEventListener('topgo-auth-change', () => {
      renderPostComposer(containerId, trip);
    });
  }
}

/* Expose ra window để dùng không cần import */
window.renderPostComposer = renderPostComposer;


/* Expose ra window để dùng không cần import */
window.renderPostComposer = renderPostComposer;
