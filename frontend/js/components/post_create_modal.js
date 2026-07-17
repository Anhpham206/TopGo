/* =====================================================================
   post_create_modal.js  —  Modal Tạo & Đăng bài viết (Bích Diệp)
   Cải tiến:
   - Thay thế toàn bộ emoji thành icon SVG đồng màu sắc với logo/web (--p1, --text)
   - Cho phép upload nhiều ảnh và video cùng một lúc (hủy bỏ tính năng khóa loại file)
   - Tự động gợi ý các địa điểm từ lịch trình hiện tại của chuyến đi dưới dạng tags đề xuất
   - Upload file song song thay vì tuần tự giúp tăng tốc độ tải lên
   - Đồng bộ hóa giao diện Light Mode Glassmorphism cao cấp
   ===================================================================== */

import { uploadMedia } from './media_upload.js';

const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const BASE_API_URL = _isLocal
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
/* ── Toast thông báo nội bộ ── */
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
  const colors = { success: '#2e7d64', error: '#d62929', warning: '#ffb347', info: '#00a9ff' };
  t.style.background = colors[type] || colors.info;
  t.style.color = '#fff';
  t.textContent = msg;
  t.style.opacity = '1';
  t.style.transform = 'translateX(-50%) translateY(0)';
  clearTimeout(t._timer);
  t._timer = setTimeout(() => {
    t.style.opacity = '0';
    t.style.transform = 'translateX(-50%) translateY(20px)';
  }, 3500);
}

/* ── Khởi tạo cấu trúc HTML & CSS cho Modal ── */
export function initPostModal() {
  const container = document.getElementById('post-modal-container');
  if (!container) return;

  container.innerHTML = `
  <style>
    /* ── Overlay & Card (Light Mode Glassmorphism) ── */
    #post-modal-overlay {
      position:fixed; inset:0; background:rgba(38, 78, 107, 0.2); backdrop-filter:blur(10px);
      display:flex; align-items:center; justify-content:center;
      z-index:1005; opacity:0; transition:opacity .25s; pointer-events:none;
    }
    #post-modal-overlay.open { opacity:1; pointer-events:all; }
    #post-modal-card {
      background: rgba(255, 255, 255, 0.96); border:1px solid var(--border, #cde9f5);
      border-radius:24px; width:90%; max-width:560px; max-height:92vh;
      display:flex; flex-direction:column; overflow:hidden;
      transform:translateY(30px) scale(.97); transition:transform .3s;
      box-shadow: 0 20px 50px rgba(0, 169, 255, 0.15);
      font-family: var(--font), sans-serif;
    }
    #post-modal-overlay.open #post-modal-card { transform:translateY(0) scale(1); }

    /* ── Header ── */
    .pm-header {
      display:flex; align-items:center; justify-content:space-between;
      padding:20px 24px 16px; border-bottom:1px solid var(--border-light, #e5f3fa);
      flex-shrink:0;
    }
    .pm-header-title { display:flex; align-items:center; gap:10px; }
    .pm-header-title svg { color: var(--p1, #00a9ff); }
    .pm-header h2 { font-size:18px; font-weight:700; color: var(--text, #264e6b); margin:0; letter-spacing:.3px; }
    .pm-close {
      width:32px; height:32px; border-radius:50%; border:none; cursor:pointer;
      background: var(--border-light, #e5f3fa); color: var(--text, #264e6b);
      font-size:18px; display:flex; align-items:center; justify-content:center;
      transition: all var(--t); padding:0;
    }
    .pm-close:hover { background: var(--border, #cde9f5); transform: rotate(90deg); }

    /* ── Body ── */
    .pm-body { padding:20px 24px; overflow-y:auto; flex:1; display:flex; flex-direction:column; gap:16px; }

    /* ── Itinerary Card (Premium Square Card) ── */
    .pm-itinerary-tag {
      display: flex; flex-direction: column;
      background: linear-gradient(145deg, #ffffff 0%, #f5fbff 100%);
      border: 1.5px solid rgba(0, 169, 255, 0.15); border-radius: 20px;
      position: relative; overflow: hidden; transition: all var(--t);
      box-shadow: 0 8px 24px rgba(0, 169, 255, 0.12), 0 2px 8px rgba(38, 78, 107, 0.06);
      box-sizing: border-box; min-height: 158px;
    }

    /* Gradient top bar */
    .pm-itin-top-bar {
      background: linear-gradient(90deg, var(--p1, #00a9ff) 0%, var(--p2, #4dd0e1) 60%, var(--a1, #7c3aed) 100%);
      padding: 14px 20px 12px;
      position: relative;
    }
    .pm-itin-badge-row { display: flex; justify-content: space-between; align-items: center; }
    .pm-itin-label-top {
      font-size: 9px; font-weight: 800; letter-spacing: 2px;
      text-transform: uppercase; color: rgba(255,255,255,0.75);
    }
    .pm-itin-dest-title {
      font-size: 20px; font-weight: 800; letter-spacing: -0.3px; margin-top: 4px;
      background: linear-gradient(90deg, #ffffff, rgba(255,255,255,0.85));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    /* Price badge inside top bar */
    .pm-itin-price-badge {
      padding: 4px 12px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.35);
      border-radius: 100px; font-size: 12px; font-weight: 700; color: #ffffff;
      display: flex; align-items: center; gap: 5px; backdrop-filter: blur(4px);
    }

    /* Bottom content area */
    .pm-itin-bottom {
      padding: 12px 20px 14px;
      display: flex; flex-direction: column; gap: 8px; flex: 1;
    }
    .pm-itin-meta-chips { display: flex; gap: 7px; flex-wrap: wrap; }
    .pm-itin-chip {
      font-size: 11px; font-weight: 700;
      background: linear-gradient(135deg, rgba(0, 169, 255, 0.08), rgba(77, 208, 225, 0.06));
      border: 1px solid rgba(0, 169, 255, 0.15);
      padding: 4px 10px; border-radius: 8px; display: flex; align-items: center; gap: 5px;
      background-clip: text;
    }
    .pm-itin-chip span {
      background: linear-gradient(135deg, var(--p1, #00a9ff), var(--p2, #4dd0e1));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      font-weight: 800;
    }
    .pm-itin-chip svg { color: var(--p1, #00a9ff); flex-shrink: 0; }
    .pm-itin-date-row {
      font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px;
      color: var(--muted, #6b8ca0);
    }
    .pm-itin-date-row svg { color: var(--p1, #00a9ff); }

    /* Aesthetic Barcode bottom */
    .pm-itin-barcode { display: flex; align-items: center; gap: 1.5px; opacity: 0.12; margin-top: 2px; height: 8px; }
    .pm-itin-barcode span { background: var(--text, #264e6b); height: 100%; display: block; }

    .pm-itin-remove {
      position: absolute; top: 10px; right: 10px; width: 22px; height: 22px;
      border-radius: 50%; border: none; background: rgba(255,255,255,0.25);
      color: rgba(255,255,255,0.85); font-size: 14px;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; transition: all var(--t); z-index: 10; padding: 0;
    }
    /* ── Undo banner ── */
    .pm-itin-undo-bar {
      display: none; align-items: center; justify-content: space-between;
      padding: 10px 16px; border-radius: 14px;
      background: var(--border-light, #e5f3fa);
      border: 1.5px solid var(--border, #cde9f5);
      font-size: 13px; color: var(--text, #264e6b);
      animation: pm-fade-in .2s ease;
    }
    @keyframes pm-fade-in { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }
    .pm-itin-undo-bar.show { display: flex; }
    .pm-itin-undo-label { display: flex; align-items: center; gap: 8px; color: var(--muted, #6b8ca0); font-size: 12.5px; }
    .pm-itin-undo-btn {
      padding: 5px 14px; border-radius: 100px; border: none; cursor: pointer;
      background: linear-gradient(90deg, var(--p1, #00a9ff), var(--p2, #4dd0e1));
      color: #fff; font-size: 12px; font-weight: 700; transition: all var(--t);
      white-space: nowrap;
    }
    .pm-itin-undo-btn:hover { opacity: 0.88; transform: scale(1.04); }

    /* ── Textarea ── */
    .pm-textarea {
      width:100%; min-height:110px; resize:vertical;
      background: var(--white, #ffffff);
      border:1.5px solid var(--border, #cde9f5);
      border-radius:16px; padding:14px; font-size:14.5px; line-height:1.6;
      color:var(--text,#264e6b); font-family:inherit; transition: all var(--t);
      box-sizing:border-box;
    }
    .pm-textarea:focus { outline:none; border-color:var(--p1,#00a9ff); box-shadow: var(--glow); }
    .pm-textarea::placeholder { color:var(--muted,#6b8ca0); opacity: 0.7; }
    .pm-char-count { text-align:right; font-size:12px; color:var(--muted,#6b8ca0); margin-top:-10px; }

    /* ── Toolbar ── */
    .pm-toolbar { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
    .pm-tool-btn {
      display:flex; align-items:center; gap:8px; padding:8px 16px;
      border:1.5px solid var(--border, #cde9f5); border-radius:999px;
      background: var(--white, #ffffff); color:var(--text,#264e6b); font-size:13.5px; cursor:pointer;
      font-weight: 600;
      transition: all var(--t); white-space:nowrap;
    }
    .pm-tool-btn:hover { background: var(--border-light, #e5f3fa); border-color:var(--p2,#89cff3); }
    .pm-tool-btn svg { flex-shrink:0; color: var(--p1); }
    .pm-media-count { font-size:12px; color:var(--muted,#6b8ca0); margin-left:auto; font-weight: 600; }

    /* ── Progress bar ── */
    .pm-progress-wrap {
      height:6px; background:var(--border-light, #e5f3fa); border-radius:3px; overflow:hidden;
      transition:opacity .3s;
    }
    .pm-progress-bar {
      height:100%; background:linear-gradient(90deg, var(--p1), var(--p2));
      border-radius:3px; transition:width .2s; width:0%;
    }
    .pm-progress-label { font-size:12px; color:var(--muted,#6b8ca0); text-align:center; }

    /* ── Media Preview Grid ── */
    .pm-preview-grid {
      display:grid; grid-template-columns:repeat(auto-fill,minmax(100px,1fr));
      gap:10px;
    }
    .pm-thumb {
      position:relative; aspect-ratio:1; border-radius:12px; overflow:hidden;
      background: var(--stub, #f5fbfe); border:1px solid var(--border, #cde9f5);
    }
    .pm-thumb img, .pm-thumb video {
      width:100%; height:100%; object-fit:cover; display:block;
    }
    .pm-thumb .pm-remove {
      position:absolute; top:6px; right:6px; width:24px; height:24px;
      background:rgba(38, 78, 107, 0.8); border:none; border-radius:50%; color:#fff;
      font-size:14px; cursor:pointer; display:flex; align-items:center; justify-content:center;
      transition:background .2s; line-height:1; padding:0;
    }
    .pm-thumb .pm-remove:hover { background: var(--error, #d62929); }
    .pm-thumb .pm-video-badge {
      position:absolute; bottom:6px; left:6px; background:rgba(38, 78, 107, 0.85);
      color:#fff; font-size:11px; padding:3px 8px; border-radius:6px; font-weight: 600;
    }
    .pm-thumb .pm-upload-overlay {
      position:absolute; inset:0; background:rgba(255, 255, 255, 0.85);
      display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px;
    }
    .pm-thumb .pm-mini-bar { width:70%; height:4px; background: var(--border-light, #e5f3fa); border-radius:2px; }
    .pm-thumb .pm-mini-fill { height:100%; background: var(--p1, #00a9ff); border-radius:2px; transition:width .2s; }
    .pm-thumb .pm-pct { color: var(--text, #264e6b); font-size:11px; font-weight: 700; }

    /* ── Tag địa điểm ── */
    .pm-tag-input-wrap { position:relative; display:flex; align-items:center; }
    .pm-tag-icon { position:absolute; left:14px; color: var(--p1, #00a9ff); pointer-events:none; }
    .pm-tag-input {
      width:100%; padding:10px 14px 10px 38px; border-radius:14px; font-size:13.5px;
      background: var(--white, #ffffff);
      border:1.5px solid var(--border, #cde9f5); color:var(--text,#264e6b);
      transition: all var(--t); box-sizing:border-box;
    }
    .pm-tag-input:focus { outline:none; border-color:var(--p1,#00a9ff); box-shadow: var(--glow); }
    .pm-tag-input::placeholder { color: var(--muted); opacity: 0.6; }
    .pm-tag-chips { display:flex; flex-wrap:wrap; gap:8px; min-height:0; }
    .pm-chip {
      display:inline-flex; align-items:center; gap:6px; padding:6px 12px;
      background:rgba(0, 169, 255, 0.08); border:1px solid rgba(0, 169, 255, 0.2);
      border-radius:999px; font-size:12.5px; color: var(--text, #264e6b);
      font-weight: 600;
    }
    .pm-chip button { background:none; border:none; color: var(--muted); cursor:pointer; font-size:15px; line-height:1; padding:0; margin-left: 2px; }
    .pm-chip button:hover { color: var(--error); }

    /* ── Tag gợi ý từ lịch trình ── */
    .pm-suggested-wrap {
      display: flex; flex-direction: column; gap: 6px;
      background: rgba(0, 169, 255, 0.02); border: 1px dashed var(--border);
      padding: 12px; border-radius: 16px;
    }
    .pm-suggested-title { font-size:12px; font-weight:700; color: var(--muted); display:flex; align-items:center; gap:6px; }
    .pm-suggested-chips { display:flex; flex-wrap:wrap; gap:6px; }
    .pm-suggested-chip {
      padding: 5px 10px; border-radius: 999px; font-size:11.5px; font-weight:600;
      background: var(--white); border: 1px solid var(--border); color: var(--text);
      cursor: pointer; transition: all var(--t);
    }
    .pm-suggested-chip:hover { background: rgba(0, 169, 255, 0.08); border-color: var(--p1); }
    .pm-suggested-chip.disabled { opacity: 0.4; cursor: not-allowed; text-decoration: line-through; }

    /* ── Footer ── */
    .pm-footer {
      padding:16px 24px; border-top:1px solid var(--border-light,#e5f3fa);
      display:flex; align-items:center; gap:16px; flex-shrink:0;
      background: var(--stub, #f5fbfe);
    }
    .pm-status { font-size:13px; flex:1; line-height:1.4; font-weight: 600; }
    .pm-status.error   { color: var(--error, #d62929); }
    .pm-status.success { color: var(--success, #2e7d64); }
    .pm-status.info    { color: var(--p1, #00a9ff); }
    .pm-submit {
      display:inline-flex; align-items:center; gap:8px;
      padding:12px 32px; border-radius:999px; border:none; cursor:pointer;
      background: linear-gradient(135deg, var(--p1) 0%, var(--p2) 100%); color:#fff;
      font-size:14.5px; font-weight:700; transition: all var(--t);
      box-shadow: 0 4px 15px rgba(0, 169, 255, 0.2);
      white-space:nowrap; min-width:120px; text-align:center;
    }
    .pm-submit:hover:not(:disabled) { opacity:.9; transform:scale(1.02); }
    .pm-submit:disabled { opacity:.5; cursor:not-allowed; box-shadow: none; }
    
    @keyframes rotate {
      100% { transform: rotate(360deg); }
    }
    @keyframes dash {
      0% { stroke-dasharray: 1, 150; stroke-dashoffset: 0; }
      50% { stroke-dasharray: 90, 150; stroke-dashoffset: -35; }
      100% { stroke-dasharray: 90, 150; stroke-dashoffset: -124; }
    }
  </style>

  <div id="post-modal-overlay">
    <div id="post-modal-card" role="dialog" aria-modal="true" aria-labelledby="pm-title">

      <!-- Header -->
      <div class="pm-header">
        <div class="pm-header-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
          </svg>
          <h2 id="pm-title">Tạo bài viết</h2>
        </div>
        <button class="pm-close" id="pm-close-btn" aria-label="Đóng">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="pm-body" id="pm-body">

        <!-- Itinerary Card (Premium Square Card) -->
        <div class="pm-itinerary-tag" id="pm-itinerary-tag" style="display:none">
          <!-- Gradient top bar -->
          <div class="pm-itin-top-bar">
            <button class="pm-itin-remove" id="pm-itin-remove-btn" title="Gỡ lịch trình đính kèm">&times;</button>
            <div class="pm-itin-badge-row">
              <span class="pm-itin-label-top">Lịch trình đính kèm</span>
              <div class="pm-itin-price-badge">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"/>
                  <line x1="12" y1="4" x2="12" y2="20"/>
                </svg>
                <span id="pm-itin-budget">—</span>
              </div>
            </div>
            <div class="pm-itin-dest-title" id="pm-itin-dest">—</div>
          </div>

          <!-- Bottom info area -->
          <div class="pm-itin-bottom">
            <div class="pm-itin-meta-chips" id="pm-itin-chips-container"></div>
            <div class="pm-itin-date-row">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                <line x1="16" y1="2" x2="16" y2="6"/>
                <line x1="8" y1="2" x2="8" y2="6"/>
                <line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              <span id="pm-itin-dates">—</span>
            </div>
            <div class="pm-itin-barcode">
              <span style="width:2px"></span><span style="width:1px"></span><span style="width:3px"></span>
              <span style="width:1px"></span><span style="width:2px"></span><span style="width:4px"></span>
              <span style="width:1px"></span><span style="width:3px"></span><span style="width:2px"></span>
              <span style="width:1px"></span><span style="width:3px"></span>
            </div>
          </div>
        </div>
        <!-- Undo banner (xuất hiện khi người dùng gỡ lịch trình) -->
        <div class="pm-itin-undo-bar" id="pm-itin-undo-bar">
          <span class="pm-itin-undo-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            Đã gỡ lịch trình đính kèm
          </span>
          <button class="pm-itin-undo-btn" id="pm-itin-undo-btn">Hoàn tác</button>
        </div>

        <!-- Picker chọn lịch trình -->
        <div id="pm-itin-picker-wrap" style="display:none; border:1.5px solid var(--border, #cde9f5); border-radius:16px; padding:14px; background:rgba(255,255,255,0.95); flex-direction:column; gap:10px; margin-bottom: 12px; box-shadow: inset 0 2px 8px rgba(0, 169, 255, 0.04);">
          <div style="font-size:11.5px; font-weight:800; color:var(--muted, #6b8ca0); display:flex; justify-content:space-between; align-items:center; letter-spacing:0.5px;">
            <span>CHỌN LỊCH TRÌNH ĐỂ ĐÍNH KÈM:</span>
            <button id="pm-btn-close-picker" style="background:none; border:none; cursor:pointer; font-size:16px; font-weight:700; color:var(--muted); padding:0 4px;">&times;</button>
          </div>
          <div id="pm-itin-picker-list" style="display:flex; flex-direction:column; gap:8px; max-height:180px; overflow-y:auto; padding-right:4px;">
            <!-- Danh sách lịch trình được render động ở đây -->
          </div>
        </div>

        <!-- Caption -->
        <textarea class="pm-textarea" id="pm-content" placeholder="Chia sẻ kinh nghiệm chuyến đi của bạn..." maxlength="1000"></textarea>
        <div class="pm-char-count"><span id="pm-char-num">0</span>/1000</div>

        <!-- Toolbar -->
        <div class="pm-toolbar">
          <button class="pm-tool-btn" id="pm-btn-photo" title="Thêm ảnh (tối đa 10)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            Thêm ảnh
          </button>
          <button class="pm-tool-btn" id="pm-btn-video" title="Thêm video (tối đa 2, dưới 50MB)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="23 7 16 12 23 17 23 7"/>
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
            </svg>
            Thêm video
          </button>
          <button class="pm-tool-btn" id="pm-btn-attach-itin" title="Đính kèm lịch trình của bạn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
              <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
            </svg>
            Đính kèm lịch trình
          </button>
          <span class="pm-media-count" id="pm-media-count"></span>
        </div>

        <!-- Hidden file inputs -->
        <input type="file" id="pm-input-photo" accept="image/*" multiple style="display:none">
        <input type="file" id="pm-input-video" accept="video/mp4,video/mov,video/webm" multiple style="display:none">

        <!-- Upload progress -->
        <div id="pm-progress-section" style="display:none">
          <div class="pm-progress-wrap">
            <div class="pm-progress-bar" id="pm-progress-bar"></div>
          </div>
          <div class="pm-progress-label" id="pm-progress-label">Đang tải lên...</div>
        </div>

        <!-- Media Preview -->
        <div class="pm-preview-grid" id="pm-preview-grid"></div>

        <!-- Tag gợi ý từ lịch trình -->
        <div class="pm-suggested-wrap" id="pm-suggested-wrap" style="display:none">
          <div class="pm-suggested-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Địa điểm gợi ý từ lịch trình:
          </div>
          <div class="pm-suggested-chips" id="pm-suggested-chips"></div>
        </div>

        <!-- Tag địa điểm -->
        <div>
          <div class="pm-tag-chips" id="pm-tag-chips"></div>
          <div class="pm-tag-input-wrap" style="margin-top:8px">
            <svg class="pm-tag-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <input class="pm-tag-input" id="pm-tag-input" placeholder="Nhập địa điểm khác rồi nhấn Enter...">
          </div>
        </div>

      </div><!-- /pm-body -->

      <!-- Footer -->
      <div class="pm-footer">
        <div class="pm-status" id="pm-status-msg"></div>
        <button class="pm-submit" id="pm-submit-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
          <span>Đăng bài</span>
        </button>
      </div>
    </div>
  </div>
  `;
}

/* ═══════════════════════════════════════════════════════════════════
   openPostModal(trip) — mở modal với dữ liệu lịch trình đính kèm
   ═══════════════════════════════════════════════════════════════════ */
export function openPostModal(trip = null) {
  const overlay = document.getElementById('post-modal-overlay');
  if (!overlay) { console.error('post-modal-container chưa được khởi tạo'); return; }

  /* ── Reset state ── */
  let mediaItems = [];   // [{url, type:'image'|'video', thumbEl}]
  let tagList = [];
  let isSubmitting = false;
  let tripLocations = []; // danh sách địa điểm trong lịch trình
  let isItineraryAttached = true; // Trạng thái đính kèm lịch trình
  let currentTrip = trip; // Lưu trữ lịch trình hiện tại (có thể thay đổi)

  const get = id => document.getElementById(id);
  get('pm-content').value = '';
  get('pm-tag-input').value = '';
  get('pm-tag-chips').innerHTML = '';
  get('pm-preview-grid').innerHTML = '';
  get('pm-status-msg').textContent = '';
  get('pm-status-msg').className = 'pm-status';
  get('pm-progress-section').style.display = 'none';
  get('pm-progress-bar').style.width = '0%';
  get('pm-itin-undo-bar').classList.remove('show'); // reset undo bar
  get('pm-itin-picker-wrap').style.display = 'none'; // reset picker wrap

  // Reset nút đăng bài
  const submitBtn = get('pm-submit-btn');
  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="22" y1="2" x2="11" y2="13"></line>
        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
      </svg>
      <span>Đăng bài</span>
    `;
  }

  // Ẩn/hiện nút chọn lịch trình tùy ngữ cảnh (Từ Public Share -> Ẩn, Từ Đầu trang -> Hiện)
  const btnAttach = get('pm-btn-attach-itin');
  if (btnAttach) {
    btnAttach.style.display = trip ? 'none' : 'flex';
  }

  updateMediaCount();

  /* ── Hàm load gợi ý địa điểm từ lịch trình ── */
  function loadSuggestedLocations(tripData) {
    const suggestedWrap = get('pm-suggested-wrap');
    const suggestedChips = get('pm-suggested-chips');
    suggestedChips.innerHTML = '';

    if (tripData && tripData.itinerary) {
      try {
        let itin = tripData.itinerary;
        if (typeof itin === 'string') {
          itin = JSON.parse(itin);
        }
        const aiOut = itin.output || itin;
        const lichTrinh = aiOut.Lich_trinh || [];
        const placesSet = new Set();

        lichTrinh.forEach(day => {
          if (Array.isArray(day)) {
            day.forEach(stop => {
              if (stop.Dia_diem) placesSet.add(stop.Dia_diem);
            });
          }
        });

        tripLocations = Array.from(placesSet);

        if (tripLocations.length > 0) {
          suggestedWrap.style.display = 'flex';
          tripLocations.forEach(loc => {
            const chip = document.createElement('div');
            chip.className = 'pm-suggested-chip';
            chip.textContent = loc;
            chip.onclick = () => {
              if (!tagList.includes(loc) && tagList.length < 5) {
                tagList.push(loc);
                renderChips();
                chip.classList.add('disabled');
              }
            };
            suggestedChips.appendChild(chip);
          });
        } else {
          suggestedWrap.style.display = 'none';
        }
      } catch (e) {
        console.error('Lỗi khi phân tích địa điểm gợi ý:', e);
        suggestedWrap.style.display = 'none';
      }
    } else {
      suggestedWrap.style.display = 'none';
    }
  }

  /* ── Hàm hiển thị lịch trình được đính kèm ── */
  function renderAttachedItinerary(tripData) {
    currentTrip = tripData;
    const itinTag = get('pm-itinerary-tag');
    if (tripData?.destination) {
      get('pm-itin-dest').textContent = `${tripData.destination}`;
      get('pm-itin-budget').textContent = tripData.budget ? `${Number(tripData.budget).toLocaleString('vi-VN')}₫` : 'TỰ TÚC';

      const chipsContainer = get('pm-itin-chips-container');
      chipsContainer.innerHTML = '';

      const addChip = (txt, svgPath) => {
        const div = document.createElement('div');
        div.className = 'pm-itin-chip';
        div.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            ${svgPath}
          </svg>
          <span>${txt}</span>
        `;
        chipsContainer.appendChild(div);
      };

      // Icon ngày (clock)
      addChip(`${tripData.days || '?'} NGÀY`, `<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>`);
      // Icon người (user)
      addChip(`${tripData.pax || '?'} NGƯỜI`, `<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>`);

      if (tripData.dateStart && tripData.dateEnd) {
        const formatD = (d) => d.split('-').reverse().join('/');
        get('pm-itin-dates').textContent = `${formatD(tripData.dateStart)} → ${formatD(tripData.dateEnd)}`;
      } else {
        get('pm-itin-dates').textContent = 'Chưa định ngày';
      }

      // Thiết lập nút gỡ đính kèm + undo
      const undoBar = get('pm-itin-undo-bar');
      get('pm-itin-remove-btn').onclick = () => {
        isItineraryAttached = false;
        itinTag.style.display = 'none';
        undoBar.classList.add('show');
        get('pm-suggested-wrap').style.display = 'none';
      };
      get('pm-itin-undo-btn').onclick = () => {
        isItineraryAttached = true;
        itinTag.style.display = 'flex';
        undoBar.classList.remove('show');
        if (tripLocations && tripLocations.length > 0) {
          get('pm-suggested-wrap').style.display = 'block';
        }
      };

      itinTag.style.display = 'flex';
      undoBar.classList.remove('show');

      // Load gợi ý địa điểm
      loadSuggestedLocations(tripData);
    } else {
      itinTag.style.display = 'none';
      get('pm-suggested-wrap').style.display = 'none';
    }
  }

  /* ── Render lịch trình ban đầu nếu có ── */
  if (currentTrip) {
    renderAttachedItinerary(currentTrip);
  } else {
    renderAttachedItinerary(null);
  }

  /* ── Sự kiện Picker chọn lịch trình đã lưu ── */
  const pickerWrap = get('pm-itin-picker-wrap');
  const pickerList = get('pm-itin-picker-list');
  const attachBtn = get('pm-btn-attach-itin');
  const closePickerBtn = get('pm-btn-close-picker');

  closePickerBtn.onclick = () => {
    pickerWrap.style.display = 'none';
  };

  attachBtn.onclick = async () => {
    if (pickerWrap.style.display === 'flex') {
      pickerWrap.style.display = 'none';
      return;
    }

    pickerList.innerHTML = `<div style="font-size:12px;color:var(--muted);text-align:center;padding:12px;">⏳ Đang tải lịch trình đã lưu...</div>`;
    pickerWrap.style.display = 'flex';

    try {
      let trips = [];
      if (window.TopGoAuth && typeof window.TopGoAuth.getTrips === 'function') {
        trips = await window.TopGoAuth.getTrips();
      } else {
        // Fallback test cục bộ nếu không có auth sdk
        const localData = localStorage.getItem('mock_trips');
        if (localData) {
          trips = JSON.parse(localData);
        } else {
          trips = [
            { id: 'trip-preview-1', destination: 'Phú Quốc Hè 2026', days: 4, pax: 2, budget: 8500000, dateStart: '2026-07-20', dateEnd: '2026-07-24', itinerary: '{"output":{"Lich_trinh":[[{"Dia_diem":"Bãi Sao"},{"Dia_diem":"Chợ Đêm"}]]}}' },
            { id: 'trip-preview-2', destination: 'Sapa Sương Mù', days: 3, pax: 4, budget: 4500000, dateStart: '2026-11-15', dateEnd: '2026-11-18', itinerary: '{"output":{"Lich_trinh":[[{"Dia_diem":"Bản Cát Cát"},{"Dia_diem":"Fansipan"}]]}}' }
          ];
        }
      }

      if (trips.length === 0) {
        pickerList.innerHTML = `<div style="font-size:12.5px;color:var(--muted);text-align:center;padding:12px;">📭 Bạn chưa có lịch trình nào được lưu.</div>`;
        return;
      }

      pickerList.innerHTML = '';
      trips.forEach(t => {
        const item = document.createElement('div');
        item.style.cssText = `
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px; background: #fff; border: 1.5px solid var(--border-light, #e5f3fa);
          border-radius: 12px; cursor: pointer; transition: all var(--t);
          font-size: 13.5px; color: var(--text, #264e6b); margin-bottom: 4px;
        `;
        item.innerHTML = `
          <div style="display:flex; flex-direction:column; gap:2px; text-align:left;">
            <strong style="color:var(--text); font-size:13.5px;">${t.destination}</strong>
            <span style="font-size:11.5px; color:var(--muted); font-weight:600;">${t.days} Ngày · ${t.pax} Người · ${t.budget ? Number(t.budget).toLocaleString('vi-VN') + '₫' : 'Tự túc'}</span>
          </div>
          <button style="padding: 5px 12px; background: rgba(0, 169, 255, 0.08); color: var(--p1); border: none; border-radius: 8px; font-size: 12px; font-weight: 700; cursor:pointer;">Chọn</button>
        `;

        item.onmouseover = () => { item.style.borderColor = 'var(--p1)'; item.style.background = 'rgba(0, 169, 255, 0.04)'; };
        item.onmouseout = () => { item.style.borderColor = 'var(--border-light)'; item.style.background = '#fff'; };

        item.onclick = () => {
          renderAttachedItinerary(t);
          isItineraryAttached = true;
          pickerWrap.style.display = 'none';
        };
        pickerList.appendChild(item);
      });
    } catch (err) {
      pickerList.innerHTML = `<div style="font-size:12px;color:var(--error);text-align:center;padding:12px;">❌ Lỗi: ${err.message}</div>`;
    }
  };

  /* ── Char count ── */
  get('pm-char-num').textContent = '0';
  get('pm-content').oninput = () =>
    get('pm-char-num').textContent = get('pm-content').value.length;


  /* ── Mở overlay ── */
  overlay.classList.add('open');

  /* ── Close ── */
  const closeModal = () => overlay.classList.remove('open');
  get('pm-close-btn').onclick = closeModal;
  overlay.onclick = e => { if (e.target === overlay) closeModal(); };

  /* ── Helper: cập nhật badge số lượng media ── */
  function updateMediaCount() {
    const imgs = mediaItems.filter(m => m.type === 'image').length;
    const vids = mediaItems.filter(m => m.type === 'video').length;
    const parts = [];
    if (imgs) parts.push(`${imgs}/10 ảnh`);
    if (vids) parts.push(`${vids}/2 video`);
    get('pm-media-count').textContent = parts.join(' · ');
  }

  /* ── Helper: tạo thumbnail wrapper ── */
  function createThumbEl() {
    const thumb = document.createElement('div');
    thumb.className = 'pm-thumb';

    // Overlay tiến trình upload
    const ov = document.createElement('div');
    ov.className = 'pm-upload-overlay';
    ov.innerHTML = `
      <div class="pm-mini-bar"><div class="pm-mini-fill" style="width:0%"></div></div>
      <span class="pm-pct">0%</span>`;
    thumb.appendChild(ov);
    thumb._overlay = ov;
    thumb._miniFill = ov.querySelector('.pm-mini-fill');
    thumb._pct = ov.querySelector('.pm-pct');
    return thumb;
  }

  /* ── Helper: hoàn tất thumb sau upload ── */
  function finalizeThumb(thumb, url, type) {
    if (thumb._overlay) thumb._overlay.remove();

    const removeBtn = document.createElement('button');
    removeBtn.className = 'pm-remove';
    removeBtn.textContent = '×';
    removeBtn.title = 'Xóa';
    removeBtn.onclick = () => {
      mediaItems.splice(mediaItems.findIndex(m => m.thumbEl === thumb), 1);
      thumb.remove();
      updateMediaCount();
    };

    if (type === 'image') {
      const img = document.createElement('img');
      img.src = url; img.alt = 'Preview';
      thumb.appendChild(img);
    } else {
      const vid = document.createElement('video');
      vid.src = url; vid.muted = true; vid.loop = true; vid.autoplay = true;
      thumb.appendChild(vid);
      const badge = document.createElement('div');
      badge.className = 'pm-video-badge'; badge.textContent = '▶ Video';
      thumb.appendChild(badge);
    }
    thumb.appendChild(removeBtn);
  }

  /* ── Upload 1 file ── */
  async function uploadOneFile(file, type) {
    const thumb = createThumbEl();
    get('pm-preview-grid').appendChild(thumb);

    const item = { url: null, type, thumbEl: thumb };
    mediaItems.push(item);
    updateMediaCount();

    try {
      const url = await window.uploadMedia(file, type, (pct) => {
        if (thumb._miniFill) thumb._miniFill.style.width = pct + '%';
        if (thumb._pct) thumb._pct.textContent = pct + '%';
      });
      item.url = url;
      item._uploadPct = 100;
      finalizeThumb(thumb, url, type);
    } catch (err) {
      thumb.remove();
      mediaItems = mediaItems.filter(m => m !== item);
      updateMediaCount();
      setStatus(`Lỗi tải lên: ${err.message}`, 'error');
    }
  }

  /* ── Photo input (Tải ảnh lên song song) ── */
  get('pm-btn-photo').onclick = () => get('pm-input-photo').click();
  get('pm-input-photo').onchange = (e) => {
    const files = Array.from(e.target.files || []);
    const currentImgs = mediaItems.filter(m => m.type === 'image').length;
    const canAdd = 10 - currentImgs;
    if (canAdd <= 0) { setStatus('Tối đa 10 ảnh.', 'error'); return; }

    const toUpload = files.slice(0, canAdd);
    if (files.length > canAdd) setStatus(`Chỉ thêm được ${canAdd} ảnh, phần thừa bị bỏ qua.`, 'info');
    get('pm-input-photo').value = '';

    // Tải lên song song để tối ưu tốc độ
    toUpload.forEach(f => uploadOneFile(f, 'image'));
  };

  /* ── Video input (Tải video lên) ── */
  get('pm-btn-video').onclick = () => {
    const currentVids = mediaItems.filter(m => m.type === 'video').length;
    if (currentVids >= 2) { setStatus('Chỉ được thêm tối đa 2 video.', 'error'); return; }
    get('pm-input-video').click();
  };
  get('pm-input-video').onchange = (e) => {
    const files = Array.from(e.target.files || []);
    const currentVids = mediaItems.filter(m => m.type === 'video').length;
    const canAdd = 2 - currentVids;
    if (canAdd <= 0) { setStatus('Tối đa 2 video.', 'error'); return; }

    const toUpload = files.slice(0, canAdd);
    if (files.length > canAdd) setStatus(`Chỉ thêm được ${canAdd} video, phần thừa bị bỏ qua.`, 'info');
    get('pm-input-video').value = '';

    // Tải lên song song
    toUpload.forEach(f => uploadOneFile(f, 'video'));
  };

  /* ── Tag địa điểm tự nhập ── */
  get('pm-tag-input').onkeydown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && e.target.value.trim()) {
      e.preventDefault();
      const tag = e.target.value.trim().replace(/,$/, '');
      if (tag && !tagList.includes(tag) && tagList.length < 5) {
        tagList.push(tag);
        renderChips();

        // Disable gợi ý tương ứng nếu người dùng tự nhập trùng
        const suggestedChips = get('pm-suggested-chips');
        if (suggestedChips) {
          const suggestedEl = Array.from(suggestedChips.children).find(c => c.textContent === tag);
          if (suggestedEl) suggestedEl.classList.add('disabled');
        }
      }
      e.target.value = '';
    }
  };

  function renderChips() {
    const chips = get('pm-tag-chips');
    chips.innerHTML = '';
    tagList.forEach((t, i) => {
      const chip = document.createElement('span');
      chip.className = 'pm-chip';
      chip.innerHTML = `${t}<button title="Xóa tag">×</button>`;
      chip.querySelector('button').onclick = () => {
        tagList.splice(i, 1);
        renderChips();

        // Active lại gợi ý nếu bị xóa
        const suggestedChips = get('pm-suggested-chips');
        if (suggestedChips) {
          const suggestedEl = Array.from(suggestedChips.children).find(c => c.textContent === t);
          if (suggestedEl) suggestedEl.classList.remove('disabled');
        }
      };
      chips.appendChild(chip);
    });
  }

  /* ── Status helper ── */
  function setStatus(msg, type = 'info') {
    const el = get('pm-status-msg');
    if (el) {
      el.textContent = msg;
      el.className = `pm-status ${type}`;
    }
  }

  /* ── Submit đăng bài ── */
  get('pm-submit-btn').onclick = async () => {
    if (isSubmitting) return;
    const content = get('pm-content').value.trim();
    if (!content && mediaItems.length === 0) {
      setStatus('Vui lòng nhập nội dung hoặc thêm ảnh/video.', 'error'); return;
    }
    const pending = mediaItems.filter(m => !m.url);
    if (pending.length > 0) {
      setStatus('Vui lòng chờ ảnh hoặc video tải lên xong.', 'info'); return;
    }

    isSubmitting = true;
    const btn = get('pm-submit-btn');
    btn.disabled = true;
    btn.innerHTML = `
      <svg class="spinner" width="14" height="14" viewBox="0 0 50 50" style="animation: rotate 2s linear infinite; margin-right:8px;">
        <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5" stroke="var(--white)" stroke-dasharray="1,150" stroke-dashoffset="0" stroke-linecap="round" style="stroke: #fff; animation: dash 1.5s ease-in-out infinite;"></circle>
      </svg> Đang đăng...
    `;
    setStatus('Đang kiểm duyệt nội dung bằng AI...', 'info');

    try {
      const token = await window.TopGoAuth?.getIdToken();
      if (!token) throw new Error('Bạn cần đăng nhập để thực hiện tính năng này.');

      const payload = {
        itineraryId: (isItineraryAttached && currentTrip) ? currentTrip.id : null,
        content,
        mediaUrls: mediaItems.map(m => m.url),
        taggedLocations: tagList,
      };

      const res = await fetch(`${BASE_API_URL}/api/posts/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Đăng bài thất bại');

      // Thành công
      setStatus('Đã đăng bài thành công!', 'success');
      showToast('Bài viết của bạn đã được đăng tải', 'success');
      btn.innerHTML = 'Đã đăng!';
      setTimeout(() => closeModal(), 1800);

    } catch (err) {
      setStatus(err.message, 'error');
      btn.disabled = false;
      btn.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:8px;">
          <line x1="22" y1="2" x2="11" y2="13"></line>
          <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
        </svg> Đăng bài
      `;
      isSubmitting = false;
    }
  };
}

window.initPostModal = initPostModal;
window.openPostModal = openPostModal;
