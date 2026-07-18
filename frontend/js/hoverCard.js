/**
 * ========================================================================
 * FILE: hoverCard.js
 * CHỨC NĂNG:
 * - Hiển thị popup card (Account Hover) khi di chuột vào avatar/tên người dùng.
 * ========================================================================
 */
// js/hoverCard.js — Account Hover Popup Card
// Shows a floating card when hovering over post author avatars/names.

(function() {
  'use strict';

  let _hoverCard = null;
  let _showTimeout = null;
  let _hideTimeout = null;
  let _currentTarget = null;

  function createHoverCard() {
    if (_hoverCard) return _hoverCard;
    const card = document.createElement('div');
    card.className = 'hover-card';
    card.innerHTML = `
      <div class="hc-header">
        <a class="hc-avatar" id="hc-avatar" href="./profile.html"></a>
        <div class="hc-info">
          <a class="hc-name" id="hc-name" href="./profile.html">—</a>
          <div class="hc-handle" id="hc-handle">@—</div>
        </div>
      </div>
      <div class="hc-stats">
        <span class="hc-stat"><strong id="hc-trips">0</strong> chuyến đi</span>
        <span class="hc-dot">·</span>
        <span class="hc-stat"><strong id="hc-posts">0</strong> bài viết</span>
        <span class="hc-dot">·</span>
        <span class="hc-stat" id="hc-nation">Việt Nam</span>
      </div>
      <a class="hc-link" id="hc-link" href="./profile.html">Xem trang cá nhân →</a>
    `;
    document.body.appendChild(card);
    
    // Keep card visible while mouse is on it
    card.addEventListener('mouseenter', () => {
      clearTimeout(_hideTimeout);
    });
    card.addEventListener('mouseleave', () => {
      hideCard();
    });

    _hoverCard = card;
    return card;
  }

  function showCard(target) {
    const card = createHoverCard();
    
    // Read data from the closest post-header or quote-author-row
    const sourceEl = target.closest('.post-header, .quote-author-row');
    if (!sourceEl) return;

    const userId = sourceEl.dataset.userId || '';
    const userName = sourceEl.dataset.userName || 'Thành viên';
    const userAvatar = sourceEl.dataset.userAvatar || '';

    // Populate card
    const nameEl = card.querySelector('#hc-name');
    const handleEl = card.querySelector('#hc-handle');
    const avatarEl = card.querySelector('#hc-avatar');
    const linkEl = card.querySelector('#hc-link');
    const tripsEl = card.querySelector('#hc-trips');
    const postsEl = card.querySelector('#hc-posts');

    if (nameEl) nameEl.textContent = userName;
    if (handleEl) handleEl.textContent = `@${userId.substring(0, 8) || '—'}`;
    
    const profileUrl = `./profile.html${userId ? '?userId=' + userId : ''}`;
    if (linkEl) linkEl.href = profileUrl;
    if (nameEl) nameEl.href = profileUrl;
    if (avatarEl) avatarEl.href = profileUrl;

    // Set loading / default states
    if (tripsEl) tripsEl.textContent = '...';
    if (postsEl) postsEl.textContent = '...';

    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBase = isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

    if (userId) {
        fetch(`${apiBase}/api/users/${userId}/profile`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (data && _currentTarget === target) {
                    if (tripsEl) tripsEl.textContent = data.tripsCount ?? 0;
                    if (postsEl) postsEl.textContent = data.postsCount ?? 0;
                    if (data.nationality && card.querySelector('#hc-nation')) {
                        card.querySelector('#hc-nation').textContent = data.nationality;
                    }
                }
            })
            .catch(err => {
                console.warn('Lỗi tải hover profile:', err);
                if (tripsEl) tripsEl.textContent = '0';
                if (postsEl) tripsEl.textContent = '0';
            });
    }

    if (avatarEl) {
      if (userAvatar && userAvatar !== 'undefined' && userAvatar !== 'null') {
        avatarEl.innerHTML = `<img src="${userAvatar}" alt="">`;
      } else {
        const initial = userName.charAt(0).toUpperCase() || 'T';
        avatarEl.innerHTML = `<span class="hc-avatar-letter">${initial}</span>`;
      }
    }

    // Position card
    const rect = target.getBoundingClientRect();
    const cardW = 280;
    const cardH = 160;
    let top = rect.bottom + 8;
    let left = rect.left;

    // Flip up if near bottom
    if (top + cardH > window.innerHeight - 20) {
      top = rect.top - cardH - 8;
    }
    // Keep within viewport horizontally
    if (left + cardW > window.innerWidth - 20) {
      left = window.innerWidth - cardW - 20;
    }
    if (left < 10) left = 10;

    card.style.top = top + 'px';
    card.style.left = left + 'px';
    card.classList.add('visible');
    _currentTarget = target;
  }

  function hideCard() {
    _hideTimeout = setTimeout(() => {
      if (_hoverCard) {
        _hoverCard.classList.remove('visible');
      }
      _currentTarget = null;
    }, 200);
  }

  function handleMouseEnter(e) {
    const target = e.target.closest('.post-author-avatar, .post-author-name, .quote-avatar, .quote-author-name');
    if (!target) return;

    clearTimeout(_hideTimeout);
    clearTimeout(_showTimeout);

    _showTimeout = setTimeout(() => {
      showCard(target);
    }, 300);
  }

  function handleMouseLeave(e) {
    const target = e.target.closest('.post-author-avatar, .post-author-name, .quote-avatar, .quote-author-name');
    if (!target) return;

    clearTimeout(_showTimeout);
    hideCard();
  }

  // Use event delegation on document
  document.addEventListener('mouseover', handleMouseEnter);
  document.addEventListener('mouseout', handleMouseLeave);

  // ── Inject CSS ──
  const style = document.createElement('style');
  style.textContent = `
    .hover-card {
      position: fixed;
      z-index: 1000;
      width: 280px;
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(24px) saturate(180%);
      -webkit-backdrop-filter: blur(24px) saturate(180%);
      border: 1px solid rgba(255,255,255,0.6);
      border-radius: 16px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,169,255,0.08);
      padding: 16px;
      pointer-events: none;
      opacity: 0;
      transform: translateY(4px) scale(0.97);
      transition: opacity 0.15s ease, transform 0.15s ease;
    }
    .hover-card.visible {
      pointer-events: auto;
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    body.dark .hover-card {
      background: rgba(22,32,51,0.9);
      border: 1px solid rgba(255,255,255,0.08);
      box-shadow: 0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2);
    }
    .hc-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 12px;
    }
    .hc-avatar {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--p1), var(--p2));
      display: flex; align-items: center; justify-content: center;
      overflow: hidden; text-decoration: none;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    .hc-avatar:hover {
      transform: scale(1.05);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .hc-avatar img {
      width: 100%; height: 100%; object-fit: cover; border-radius: 50%;
    }
    .hc-avatar-letter {
      color: #fff; font-family: var(--font-label); font-weight: 700; font-size: 18px;
    }
    .hc-info { flex: 1; min-width: 0; }
    .hc-name {
      font-family: var(--font-label); font-weight: 700; font-size: 15px;
      color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      text-decoration: none; transition: color 0.2s; display: block;
    }
    .hc-name:hover {
      color: var(--p1);
      text-decoration: underline;
    }
    .hc-handle {
      font-size: 12px; color: var(--muted); font-family: var(--font);
    }
    .hc-stats {
      display: flex; align-items: center; gap: 8px;
      font-family: var(--font-label); font-size: 12.5px; color: var(--muted);
      padding: 8px 0; border-top: 1px solid var(--border-light);
      margin-bottom: 8px;
    }
    .hc-stats strong {
      font-weight: 700; color: var(--p1);
    }
    .hc-dot { opacity: 0.4; }
    .hc-link {
      display: block; text-align: center;
      padding: 8px 0; border-radius: 8px;
      background: linear-gradient(135deg, var(--p1), var(--p2));
      color: #fff; font-family: var(--font-label); font-size: 13px; font-weight: 600;
      text-decoration: none; transition: all 0.2s ease;
      letter-spacing: 0.3px;
    }
    .hc-link:hover {
      box-shadow: 0 4px 16px rgba(0,169,255,0.3);
      transform: translateY(-1px);
    }
  `;
  document.head.appendChild(style);
})();
