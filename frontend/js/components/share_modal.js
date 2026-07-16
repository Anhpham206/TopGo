/* =====================================================================
   share_modal.js  —  Modal Phân quyền Chia sẻ Lịch trình (Bích Diệp)
   Cải tiến:
   - Thay thế toàn bộ emoji thành icon SVG đồng màu sắc với logo/web (--p1, --text)
   - Thiết kế Light Mode Glassmorphism đồng bộ
   ===================================================================== */

/* ── API Base URL ── */
const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

/* ── Toast nội bộ ── */
function showToast(msg, type = 'success') {
  const id = 'post-modal-toast';
  let t = document.getElementById(id);
  if (!t) {
    t = document.createElement('div');
    t.id = id;
    t.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
      padding:12px 24px; border-radius:999px; font-size:14px; font-weight:600;
      box-shadow:0 8px 32px rgba(0, 169, 255, 0.15); z-index:9999;
      opacity:0; transition:opacity .3s, transform .3s; pointer-events:none;
    `;
    document.body.appendChild(t);
  }
  const colors = { success:'#2e7d64', error:'#d62929', warning:'#ffb347', info:'#00a9ff' };
  t.style.background = colors[type] || colors.info;
  t.style.color = '#fff';
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3000);
}

export function initShareModal() {
  const container = document.getElementById('share-modal-container');
  if (!container) return;

  container.innerHTML = `
  <style>
    /* ── Overlay & Card (Light Mode Glassmorphism) ── */
    #share-modal-overlay {
      position:fixed; inset:0; background:rgba(38, 78, 107, 0.2); backdrop-filter:blur(10px);
      display:flex; align-items:center; justify-content:center;
      z-index:1000; opacity:0; transition:opacity .25s; pointer-events:none;
    }
    #share-modal-overlay.open { opacity:1; pointer-events:all; }
    #share-modal-card {
      background: rgba(255, 255, 255, 0.96); border:1px solid var(--border, #cde9f5);
      border-radius:24px; width:90%; max-width:420px; overflow:hidden;
      transform:translateY(30px) scale(.97); transition:transform .3s;
      box-shadow: 0 20px 50px rgba(0, 169, 255, 0.15);
      font-family: var(--font), sans-serif;
    }
    #share-modal-overlay.open #share-modal-card { transform:translateY(0) scale(1); }

    .sm-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px 16px; border-bottom:1px solid var(--border-light, #e5f3fa);
    }
    .sm-header-title { display:flex; align-items:center; gap:10px; }
    .sm-header-title svg { color: var(--p1, #00a9ff); }
    .sm-header h2 { font-size:18px; font-weight:700; color: var(--text, #264e6b); margin:0; letter-spacing:.3px; }
    .sm-close {
      width:32px; height:32px; border-radius:50%; border:none; cursor:pointer;
      background: var(--border-light, #e5f3fa); color: var(--text, #264e6b);
      font-size:18px; display:flex; align-items:center; justify-content:center;
      transition: all var(--t); padding:0;
    }
    .sm-close:hover { background: var(--border, #cde9f5); transform: rotate(90deg); }
    .sm-close:disabled { opacity:.4; cursor:not-allowed; }

    .sm-body { padding:20px 24px; display:flex; flex-direction:column; gap:12px; }
    .sm-hint { font-size:14px; color:var(--muted,#6b8ca0); margin:0 0 4px; font-weight: 600; }

    /* Visibility option cards */
    .sm-option {
      display:flex; align-items:center; gap:16px; padding:14px 18px;
      border:1.5px solid var(--border, #cde9f5); border-radius:16px;
      cursor:pointer; transition: all var(--t);
      background: var(--white, #ffffff); text-align:left; width:100%; color:var(--text,#264e6b);
    }
    .sm-option:hover:not(:disabled) { border-color:var(--p1,#00a9ff); background:rgba(0, 169, 255, 0.04); }
    .sm-option:disabled { opacity:.5; cursor:not-allowed; }
    
    .sm-option-icon {
      width: 40px; height: 40px; border-radius: 12px;
      background: rgba(0, 169, 255, 0.08);
      display: flex; align-items: center; justify-content: center;
      color: var(--p1, #00a9ff); flex-shrink: 0;
      transition: all var(--t);
    }
    .sm-option:hover .sm-option-icon {
      background: var(--p1); color: #fff;
    }
    .sm-option-text strong { display:block; font-size:14.5px; font-weight:700; margin-bottom:2px; color: var(--text); }
    .sm-option-text span   { font-size:12.5px; color:var(--muted,#6b8ca0); line-height:1.4; }
    
    .sm-option .sm-loader {
      margin-left:auto; width:18px; height:18px; border:2.5px solid rgba(0, 169, 255, 0.2);
      border-top-color:var(--p1); border-radius:50%; animation:sm-spin .7s linear infinite; display:none;
      flex-shrink:0;
    }
    .sm-option.loading .sm-loader { display:block; }
    @keyframes sm-spin { to { transform:rotate(360deg); } }

    /* Unlisted link box */
    #sm-link-box {
      background: rgba(0, 169, 255, 0.02); border:1.5px dashed var(--border, #cde9f5);
      border-radius:16px; padding:14px; display:none; flex-direction:column; gap:10px;
      animation: sm-fadein .3s;
    }
    #sm-link-box.visible { display:flex; }
    @keyframes sm-fadein { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
    
    .sm-link-title { font-size:12px; color:var(--text,#264e6b); font-weight:700; letter-spacing:.5px; display:flex; align-items:center; gap:6px; }
    .sm-link-title svg { color: var(--p1); }
    .sm-link-row { display:flex; gap:10px; }
    #sm-link-input {
      flex:1; background: var(--white, #ffffff); border:1.5px solid var(--border, #cde9f5);
      border-radius:10px; padding:10px; font-size:12.5px; color:var(--text,#264e6b);
      font-family: monospace; outline: none; transition: border-color var(--t);
    }
    #sm-link-input:focus { border-color: var(--p1); }
    #sm-copy-btn {
      padding:10px 18px; border-radius:10px; border:none; cursor:pointer;
      background: var(--p1, #00a9ff); color: #ffffff; font-size:13px; font-weight:600;
      transition: all var(--t); white-space:nowrap;
      box-shadow: 0 4px 10px rgba(0, 169, 255, 0.15);
    }
    #sm-copy-btn:hover { opacity: 0.9; }
    #sm-copy-btn.copied { background: var(--success, #2e7d64); color:#ffffff; box-shadow: none; }
  </style>

  <div id="share-modal-overlay">
    <div id="share-modal-card">
      
      <!-- Header -->
      <div class="sm-header">
        <div class="sm-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <h2>Chia sẻ lịch trình</h2>
        </div>
        <button class="sm-close" id="sm-close-btn" aria-label="Đóng">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div class="sm-body">
        <p class="sm-hint">Chọn phương thức bạn muốn chia sẻ:</p>

        <!-- Private Option -->
        <button class="sm-option" id="sm-btn-private">
          <div class="sm-option-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <div class="sm-option-text">
            <strong>Private</strong>
            <span>Chỉ mình bạn có thể xem lịch trình này.</span>
          </div>
          <div class="sm-loader"></div>
        </button>

        <!-- Unlisted Option -->
        <button class="sm-option" id="sm-btn-unlisted">
          <div class="sm-option-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
          </div>
          <div class="sm-option-text">
            <strong>Unlisted — Tạo link ẩn</strong>
            <span>Ai có link thì xem được, ẩn trên News Feed.</span>
          </div>
          <div class="sm-loader"></div>
        </button>

        <!-- Public Option -->
        <button class="sm-option" id="sm-btn-public">
          <div class="sm-option-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="12" cy="12" r="10"/>
              <path d="M2 12h20"/>
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10A15.3 15.3 0 0 1 12 2z"/>
            </svg>
          </div>
          <div class="sm-option-text">
            <strong>Public — Đăng lên News Feed</strong>
            <span>Chia sẻ hành trình với cộng đồng và viết bài cảm nghĩ.</span>
          </div>
          <div class="sm-loader"></div>
        </button>

        <!-- Link box (hiện sau khi chọn Unlisted) -->
        <div id="sm-link-box">
          <div class="sm-link-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            <span>LINK CHIA SẺ LỊCH TRÌNH</span>
          </div>
          <div class="sm-link-row">
            <input type="text" id="sm-link-input" readonly>
            <button id="sm-copy-btn">Copy</button>
          </div>
        </div>

      </div>
    </div>
  </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   openShareModal(trip) — mở modal với dữ liệu lịch trình
   ═══════════════════════════════════════════════════════════════════ */
export function openShareModal(trip) {
  const overlay = document.getElementById('share-modal-overlay');
  if (!overlay) { console.error('share-modal-container chưa được khởi tạo'); return; }

  const get = id => document.getElementById(id);
  get('sm-link-box').classList.remove('visible');
  overlay.classList.add('open');

  let busy = false;

  /* ── Đóng modal ── */
  const closeModal = () => { if (!busy) overlay.classList.remove('open'); };
  get('sm-close-btn').onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };

  /* ── Set loading state ── */
  function setLoading(btnId, loading) {
    busy = loading;
    ['sm-btn-private','sm-btn-unlisted','sm-btn-public'].forEach(id => {
      const b = get(id);
      b.disabled = loading;
      b.classList.toggle('loading', loading && id === btnId);
    });
    get('sm-close-btn').disabled = loading;
  }

  /* ── Gọi API share ── */
  async function handleShare(visibility, btnId) {
    if (busy) return;
    setLoading(btnId, true);
    try {
      const token = await window.TopGoAuth?.getIdToken();
      if (!token) throw new Error('Bạn cần đăng nhập.');

      const res = await fetch(`${API_BASE}/api/itineraries/share`, {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${token}` },
        body: JSON.stringify({
          ...trip,
          itinerary: typeof trip.itinerary === 'string' ? trip.itinerary : JSON.stringify(trip.itinerary || {}),
          visibility,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Lỗi API');

      /* ── Xử lý kết quả theo từng loại ── */
      if (visibility === 'private') {
        showToast('Lịch trình đã chuyển về Private.', 'success');
        closeModal();
      }
      else if (visibility === 'unlisted') {
        const link = `${window.location.origin}/planner.html?shareId=${data.id}`;
        get('sm-link-input').value = link;
        get('sm-link-box').classList.add('visible');
        showToast('Link ẩn đã được tạo!', 'success');
      }
      else if (visibility === 'public') {
        showToast('Đã chuyển Public! Hãy thêm caption và đăng bài.', 'success');
        closeModal();
        setTimeout(() => {
          if (window.openPostModal) window.openPostModal(null); // Không đính kèm thẻ lịch trình theo yêu cầu
        }, 300); // nhỏ delay để share modal close trước
      }

    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(btnId, false);
    }
  }

  /* ── Gán sự kiện ── */
  get('sm-btn-private').onclick  = () => handleShare('private',  'sm-btn-private');
  get('sm-btn-unlisted').onclick = () => handleShare('unlisted', 'sm-btn-unlisted');
  get('sm-btn-public').onclick   = () => handleShare('public',   'sm-btn-public');

  /* ── Copy link ── */
  get('sm-copy-btn').onclick = () => {
    const val = get('sm-link-input').value;
    navigator.clipboard.writeText(val).then(() => {
      const btn = get('sm-copy-btn');
      btn.textContent = '✓ Đã copy!';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  };
}

window.initShareModal = initShareModal;
window.openShareModal = openShareModal;
