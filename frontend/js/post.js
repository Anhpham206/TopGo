/**
 * ========================================================================
 * FILE: post.js
 * CHỨC NĂNG:
 * - Module component bài đăng độc lập, dùng chung toàn hệ thống TopGo.
 * - Export hàm chính: renderPostCard(postId, containerEl, options?)
 *   → Bất kỳ trang nào cũng có thể import và gọi hàm này.
 * - Hỗ trợ 3 biến thể tự động: text-only | image | itinerary
 * - Itinerary Card: sử dụng OpenStreetMap + Leaflet.js (KHÔNG Google Maps)
 * - Like: lưu vào collection `likes` riêng — {postId}_{userId}
 * - Repost: trích dẫn kiểu Twitter (quote post)
 * - Toàn bộ HTML được bọc trong .topgo-thu-post-wrapper (Scoped CSS)
 * ========================================================================
 */

// ─── API Base URL (tự phát hiện môi trường) ─────────────────────────────────
const _IS_LOCAL = ['localhost', '127.0.0.1'].includes(window.location.hostname);
const API_BASE = _IS_LOCAL
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

// ─── CSS injection (đảm bảo post.css luôn được load) ────────────────────────
(function _injectPostCSS() {
    const cssId = 'topgo-post-css';
    if (document.getElementById(cssId)) return;
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = new URL('../css/post.css', import.meta.url).href;
    document.head.appendChild(link);
})();

// ─── Leaflet CSS injection ───────────────────────────────────────────────────
(function _injectLeafletCSS() {
    const cssId = 'leaflet-css';
    if (document.getElementById(cssId)) return;
    const link = document.createElement('link');
    link.id = cssId;
    link.rel = 'stylesheet';
    link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
    document.head.appendChild(link);
})();

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Lấy Firebase ID Token của user hiện tại (nếu đã đăng nhập).
 * Ưu tiên dùng window.TopGoAuth nếu có, fallback sang localStorage.
 * @returns {Promise<string|null>}
 */
async function _getAuthToken() {
    try {
        if (window.TopGoAuth?.getIdToken) {
            return await window.TopGoAuth.getIdToken();
        }
        // Fallback: lấy từ localStorage (chỉ dùng cho dev/test hoặc khi auth.js chưa load xong)
        return localStorage.getItem('topgo_token') || null;
    } catch {
        return null;
    }
}

/**
 * Lấy thông tin user hiện tại từ localStorage.
 * @returns {{uid: string, displayName: string, photoURL: string}|null}
 */
function _getCurrentUser() {
    try {
        const user = JSON.parse(localStorage.getItem('topgo_user') || 'null');
        if (!user) return null;
        return {
            uid: user.uid,
            displayName: user.firstname || user.displayName || user.email || 'Bạn',
            photoURL: user.photoURL || '',
        };
    } catch {
        return null;
    }
}

/**
 * Gọi API backend có kèm auth token.
 */
async function _apiFetch(path, options = {}) {
    const token = await _getAuthToken();
    const headers = { 'Content-Type': 'application/json', ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}/api${path}`, { ...options, headers });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail || `HTTP ${res.status}`);
    }
    return res.json();
}

/**
 * Định dạng thời gian tương đối (ví dụ: "5 phút trước").
 */
function _relativeTime(isoString) {
    if (!isoString) return '';
    const diff = Date.now() - new Date(isoString).getTime();
    const s = Math.floor(diff / 1000);
    if (s < 60) return 'Vừa xong';
    const m = Math.floor(s / 60);
    if (m < 60) return `${m} phút trước`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} giờ trước`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d} ngày trước`;
    return new Date(isoString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Escape HTML để tránh XSS.
 */
function _esc(str) {
    return String(str ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

/**
 * Tạo initials avatar từ tên (ví dụ: "Nguyễn Văn A" → "N")
 */
function _initials(name) {
    const parts = String(name || '?').trim().split(/\s+/);
    return parts[parts.length - 1]?.[0]?.toUpperCase() || '?';
}

/**
 * Định dạng số lớn (ví dụ: 1200 → "1.2K")
 */
function _fmtCount(n) {
    const num = parseInt(n) || 0;
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(num);
}

// ─── HTML Builders ────────────────────────────────────────────────────────────

/**
 * Tạo HTML cho avatar (ảnh hoặc initials).
 */
function _buildAvatar(name, photoURL, size = 44) {
    const cls = size <= 32 ? 'comment-avatar' : (size <= 34 ? 'comment-input-avatar' : 'post-author-avatar');
    if (photoURL) {
        return `<div class="${cls}"><img src="${_esc(photoURL)}" alt="${_esc(name)}" loading="lazy"></div>`;
    }
    return `<div class="${cls}">${_esc(_initials(name))}</div>`;
}

/**
 * Tạo HTML cho phần header tác giả.
 */
function _buildPostHeader(post) {
    const avatarUrl = post.authorAvatar || post.authorPhotoUrl || post.authorPhoto || '';
    const avatar = _buildAvatar(post.authorName, avatarUrl, 44);
    const visIcon = post.visibility === 'private'
        ? `<span class="post-visibility-badge">
             <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
             Riêng tư
           </span>`
        : '';

    return `
    <div class="post-header" 
         data-user-id="${_esc(post.authorId || '')}" 
         data-user-name="${_esc(post.authorName || '')}" 
         data-user-avatar="${_esc(avatarUrl)}">
        ${avatar}
        <div class="post-author-meta">
            <div class="post-author-name">
                ${_esc(post.authorName)}${visIcon}
            </div>
            <div class="post-timestamp">${_relativeTime(post.createdAt)}</div>
        </div>
        <button class="post-more-btn" aria-label="Tùy chọn" title="Tùy chọn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
            </svg>
        </button>
    </div>`;
}

/**
 * Tạo HTML cho danh sách địa điểm được gắn thẻ (tagged locations).
 */
function _buildLocationsBlock(locations) {
    if (!locations || !Array.isArray(locations) || locations.length === 0) return '';
    const tags = locations.map(loc => {
        if (!loc) return '';
        return `
        <span class="post-location-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:2px; flex-shrink:0;">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
            </svg>
            ${_esc(loc)}
        </span>`;
    }).filter(Boolean).join('');

    if (!tags) return '';
    return `<div class="post-locations">${tags}</div>`;
}


/**
 * Tạo HTML cho ảnh đính kèm (variant: image).
 */
function _buildImageBlock(imageUrl) {
    if (!imageUrl) return '';
    return `
    <div class="post-image-wrap">
        <img src="${_esc(imageUrl)}" alt="Ảnh bài đăng" loading="lazy">
    </div>`;
}

/**
 * Tạo HTML cho thẻ lộ trình du lịch (variant: itinerary).
 * Leaflet map sẽ được khởi tạo sau khi DOM mount.
 * @param {string} itineraryId
 * @param {object|null} itineraryData — dữ liệu lịch trình (nếu đã fetch trước)
 * @param {string} postId — để tạo ID map container duy nhất
 */
function _buildItineraryCard(itineraryId, itineraryData, postId) {
    if (!itineraryId) return '';

    const mapId = `itinerary-map-${postId}`;
    const destination = itineraryData?.destination || 'Đang tải...';
    const days = itineraryData?.days;
    const pax = itineraryData?.pax;
    const budget = itineraryData?.budget;
    const dateStart = itineraryData?.dateStart;
    const dateEnd = itineraryData?.dateEnd;

    // Tạo chip cho từng ngày (tối đa 4, còn lại hiển thị "+N ngày")
    let dayStamps = '';
    if (days && days > 0) {
        const maxShow = 4;
        const showDays = Math.min(days, maxShow);
        for (let i = 1; i <= showDays; i++) {
            dayStamps += `<span class="day-stamp">Ngày ${i}</span>`;
        }
        if (days > maxShow) {
            dayStamps += `<span class="day-stamp day-stamp-more">+${days - maxShow} ngày</span>`;
        }
    }

    const budgetFmt = budget
        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(budget)
        : null;

    const dateRange = (dateStart && dateEnd)
        ? `${dateStart} → ${dateEnd}`
        : (days ? `${days} ngày` : null);

    const itineraryUrl = `./planner.html?shareId=${_esc(itineraryId)}`;

    return `
    <a class="itinerary-card" href="${itineraryUrl}" data-itinerary-id="${_esc(itineraryId)}" target="_blank" rel="noopener">
        <div class="itinerary-map-preview" id="${mapId}">
            <div class="itinerary-map-placeholder">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                </svg>
                <span>Đang tải bản đồ…</span>
            </div>
        </div>
        <div class="itinerary-card-info">
            <div class="itinerary-card-label">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <path d="M3 12h1m16 0h1M12 3v1m0 16v1M5.6 5.6l.7.7m11.4-.7-.7.7m0 11.4.7.7m-12.1-.7-.7.7"/>
                </svg>
                LỘ TRÌNH DU LỊCH
            </div>
            <div class="itinerary-card-destination" data-dest-el="${mapId}">${_esc(destination)}</div>
            <div class="itinerary-card-meta">
                ${days ? `
                <span class="itinerary-meta-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    ${_esc(dateRange || `${days} ngày`)}
                </span>` : ''}
                ${pax ? `
                <span class="itinerary-meta-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                    ${_esc(pax)} người
                </span>` : ''}
                ${budgetFmt ? `
                <span class="itinerary-meta-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    ${_esc(budgetFmt)}
                </span>` : ''}
            </div>
            ${dayStamps ? `<div class="itinerary-day-stamps">${dayStamps}</div>` : ''}
            <div class="itinerary-card-cta">
                Xem lịch trình chi tiết
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
            </div>
        </div>
    </a>`;
}

/**
 * Tạo HTML cho khối trích dẫn bài gốc (repost).
 */
function _buildQuoteBlock(original) {
    if (!original) return '';
    const quotePhoto = original.authorAvatar || original.authorPhotoUrl || original.authorPhoto;
    const smallAvatar = `<div class="quote-avatar">${quotePhoto
        ? `<img src="${_esc(quotePhoto)}" alt="${_esc(original.authorName)}">`
        : _esc(_initials(original.authorName))}</div>`;

    const preview = (original.content || '').substring(0, 160) + (original.content?.length > 160 ? '…' : '');
    
    let attachmentSummary = '';
    if (original.type === 'repost' && original.repostOriginal) {
        const orig = original.repostOriginal;
        let attachmentText = '';
        if (orig.type === 'itinerary') {
            const dest = orig.itinerary?.destination || orig.content?.substring(0, 30) || 'Lịch trình';
            const days = orig.itinerary?.days || 0;
            attachmentText = `Lịch trình: ${dest} ${days ? `(${days} ngày)` : ''}`;
        } else if (orig.type === 'image' || (orig.mediaUrls && orig.mediaUrls.length > 0)) {
            attachmentText = `[Hình ảnh]`;
        } else if (orig.type === 'video') {
            attachmentText = `[Video]`;
        } else {
            const cap = orig.content ? orig.content.substring(0, 50) + (orig.content.length > 50 ? '…' : '') : 'Bài đăng';
            attachmentText = `${cap}`;
        }
        
        attachmentSummary = `
        <div class="quote-attachment-summary" style="display:flex; align-items:center; gap:6px; margin-top:8px; padding:8px 12px; background:rgba(0,169,255,0.04); border:1px dashed var(--pc-border-light,#e5f3fa); border-radius:10px; font-family: Georgia, serif; font-style: italic; font-size:13px; color:var(--pc-muted);">
            <span>Chia sẻ lại từ @${_esc(orig.authorName || 'user')}: ${attachmentText}</span>
        </div>`;
    } else {
        let attachmentText = '';
        if (original.type === 'itinerary') {
            const dest = original.itinerary?.destination || original.content?.substring(0, 30) || 'Lịch trình';
            const days = original.itinerary?.days || 0;
            attachmentText = `Lịch trình: ${dest} ${days ? `(${days} ngày)` : ''}`;
        } else if (original.type === 'image' || (original.mediaUrls && original.mediaUrls.length > 0)) {
            attachmentText = `[Hình ảnh]`;
        } else if (original.type === 'video') {
            attachmentText = `[Video]`;
        }

        if (attachmentText) {
            attachmentSummary = `
            <div class="quote-attachment-summary" style="display:flex; align-items:center; gap:6px; margin-top:8px; padding:8px 12px; background:rgba(0,169,255,0.04); border:1px dashed var(--pc-border-light,#e5f3fa); border-radius:10px; font-family: Georgia, serif; font-style: italic; font-size:13px; color:var(--pc-muted);">
                <span>Đính kèm: ${attachmentText}</span>
            </div>`;
        }
    }

    return `
    <div class="post-quote-block" role="blockquote">
        <div class="quote-author-row"
             data-user-id="${_esc(original.authorId || '')}"
             data-user-name="${_esc(original.authorName || '')}"
             data-user-avatar="${_esc(quotePhoto || '')}">
            ${smallAvatar}
            <span class="quote-author-name">${_esc(original.authorName)}</span>
            <span class="post-timestamp" style="margin-left:4px;">${_relativeTime(original.createdAt)}</span>
        </div>
        <div class="quote-content">${_esc(preview)}</div>
        ${attachmentSummary}
    </div>`;
}

/**
 * Tạo HTML cho thanh tương tác (Like / Comment / Repost).
 */
function _buildInteractions(post, isLiked) {
    const likedClass = isLiked ? 'is-liked' : '';
    return `
    <div class="post-interactions">
        <button class="post-action-btn post-action-btn--like ${likedClass}"
                data-post-id="${_esc(post.id)}" aria-label="Thích" title="Thích">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}"
                 stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            <span class="post-action-count" data-like-count="${_esc(post.id)}">${_fmtCount(post.likeCount)}</span>
        </button>

        <button class="post-action-btn post-action-btn--comment"
                data-post-id="${_esc(post.id)}" aria-label="Bình luận" title="Bình luận">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span class="post-action-count">${_fmtCount(post.commentCount)}</span>
        </button>

        <button class="post-action-btn post-action-btn--repost"
                data-post-id="${_esc(post.id)}" aria-label="Chia sẻ lại" title="Chia sẻ lại">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                 stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
                <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
            </svg>
            <span class="post-action-count" style="display:none;"></span>
        </button>
    </div>`;
}

/**
 * Tạo HTML cho vùng bình luận.
 */
function _buildCommentsSection(post, currentUser) {
    const inputRow = currentUser
        ? `
        <div class="post-comment-input-row">
            ${_buildAvatar(currentUser.displayName, currentUser.photoURL, 32)}
            <div class="comment-input-wrap">
                <textarea class="post-comment-input"
                    placeholder="Viết bình luận…"
                    rows="1" maxlength="500"
                    data-comment-input="${_esc(post.id)}"></textarea>
                <div class="comment-submit-row" style="display:none;">
                    <button class="post-comment-submit-btn" data-post-id="${_esc(post.id)}" disabled>Gửi</button>
                </div>
            </div>
        </div>`
        : `
        <div class="comment-login-prompt">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
            </svg>
            <button class="comment-login-link" onclick="window.location.href='./auth.html'">Đăng nhập</button>
            để bình luận
        </div>`;

    return `
    <div class="post-comments-section" data-comments-section="${_esc(post.id)}" style="display:none;">
        ${inputRow}
        <div class="post-comments-list" data-comments-list="${_esc(post.id)}">
            <!-- Comments loaded dynamically -->
        </div>
        <div class="comments-load-more" style="display:none;" data-load-more="${_esc(post.id)}">
            <button class="comments-load-more-btn">Xem thêm bình luận</button>
        </div>
    </div>`;
}

// ─── Map Initialization (Leaflet + OpenStreetMap) ─────────────────────────────

/**
 * Khởi tạo Leaflet map trong container itinerary card.
 * Ưu tiên dùng tọa độ thực từ lịch trình (lat/lng);
 * chỉ fallback sang geocode Nominatim khi không có tọa độ.
 *
 * @param {string} mapContainerId — ID của div chứa map
 * @param {string} destination    — Tên địa điểm (dùng để geocode / hiển thị label)
 * @param {object|null} [coords]  — Tọa độ thực: { lat: number, lng: number } hoặc null
 * @param {Array}  [places]       — Mảng điểm lịch trình: [{ lat, lon, name }]
 */
async function _initLeafletMap(mapContainerId, destination, coords = null, places = []) {
    const container = document.getElementById(mapContainerId);
    if (!container) return;

    // Xóa placeholder
    container.innerHTML = '';

    // Đảm bảo Leaflet đã được load
    if (!window.L) {
        await _loadLeafletScript();
    }

    try {
        let lat, lng, zoom = 12;

        // ── Ưu tiên 1: tọa độ thực từ lịch trình ────────────────────────────
        if (coords && typeof coords.lat === 'number' && typeof coords.lng === 'number') {
            lat = coords.lat;
            lng = coords.lng;
        }
        // ── Ưu tiên 2: tọa độ trung bình của các điểm lịch trình ────────────
        else if (places && places.length > 0) {
            const validPlaces = places.filter(p => p.lat && p.lon && p.lat !== 0 && p.lon !== 0);
            if (validPlaces.length > 0) {
                lat = validPlaces.reduce((s, p) => s + p.lat, 0) / validPlaces.length;
                lng = validPlaces.reduce((s, p) => s + p.lon, 0) / validPlaces.length;
                zoom = validPlaces.length === 1 ? 14 : 11;
            }
        }
        // ── Ưu tiên 3: geocode qua Nominatim (fallback khi không có tọa độ) ─
        if (lat == null || lng == null) {
            const geoRes = await fetch(
                `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
                { headers: { 'Accept-Language': 'vi', 'User-Agent': 'TopGo-App/1.0' } }
            );
            const geoData = await geoRes.json();
            lat = 16.047079; lng = 108.206230; zoom = 10; // Default: Đà Nẵng
            if (geoData && geoData[0]) {
                lat = parseFloat(geoData[0].lat);
                lng = parseFloat(geoData[0].lon);
            }
        }

        // Tạo Leaflet map
        const map = window.L.map(mapContainerId, {
            center: [lat, lng],
            zoom: zoom,
            zoomControl: false,
            attributionControl: false,
            dragging: false,       // Disable drag trong preview card
            scrollWheelZoom: false,
            doubleClickZoom: false,
            touchZoom: false,
        });

        // OpenStreetMap tile layer
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 18,
        }).addTo(map);

        // Custom marker pin
        const pinIcon = window.L.divIcon({
            className: '',
            html: `<div style="
                width:28px;height:28px;
                background:linear-gradient(135deg,#00a9ff,#89cff3);
                border-radius:50% 50% 50% 0;
                transform:rotate(-45deg);
                border:2.5px solid #fff;
                box-shadow:0 2px 8px rgba(0,169,255,0.4);
            "></div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 28],
        });

        // ── Vẽ marker: ưu tiên nhiều điểm từ lịch trình ─────────────────────
        const validPlaces = (places || []).filter(p => p.lat && p.lon && p.lat !== 0 && p.lon !== 0);
        if (validPlaces.length > 1) {
            // Nhiều điểm: vẽ tất cả marker nhỏ
            const smallPin = window.L.divIcon({
                className: '',
                html: `<div style="
                    width:10px;height:10px;
                    background:#00a9ff;
                    border-radius:50%;
                    border:2px solid #fff;
                    box-shadow:0 1px 4px rgba(0,169,255,0.5);
                "></div>`,
                iconSize: [10, 10],
                iconAnchor: [5, 5],
            });
            validPlaces.forEach(p => {
                window.L.marker([p.lat, p.lon], { icon: smallPin }).addTo(map);
            });
            // Fit bounds để hiển thị tất cả điểm
            const bounds = window.L.latLngBounds(validPlaces.map(p => [p.lat, p.lon]));
            map.fitBounds(bounds, { padding: [20, 20], maxZoom: 13 });
        } else {
            // Một điểm: vẽ marker chính
            window.L.marker([lat, lng], { icon: pinIcon }).addTo(map);
        }

    } catch (err) {
        // Fallback nếu geocoding thất bại
        console.warn('[TopGo Post] Leaflet map init failed:', err);
        container.innerHTML = `
            <div class="itinerary-map-placeholder">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                </svg>
                <span>${_esc(destination)}</span>
            </div>`;
    }
}

/** Tải Leaflet JS script động nếu chưa có. */
function _loadLeafletScript() {
    return new Promise((resolve, reject) => {
        if (window.L) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ─── Comment Rendering ────────────────────────────────────────────────────────

/**
 * Tạo HTML cho một item bình luận.
 */
function _buildCommentHTML(comment) {
    return `
    <div class="comment-item">
        ${_buildAvatar(comment.authorName, comment.authorAvatar, 30)}
        <div class="comment-body">
            <div class="comment-bubble">
                <div class="comment-author">${_esc(comment.authorName)}</div>
                <div class="comment-text">${_esc(comment.content)}</div>
            </div>
            <div class="comment-time">${_relativeTime(comment.createdAt)}</div>
        </div>
    </div>`;
}

/**
 * Tải và hiển thị bình luận vào DOM.
 */
async function _loadComments(postId, listEl) {
    try {
        listEl.innerHTML = `
            <div class="comment-item" style="justify-content:center;padding:12px;">
                <div class="post-skeleton-line" style="width:60%;height:12px;"></div>
            </div>`;
        const comments = await _apiFetch(`/posts/${postId}/comments`);
        if (!comments.length) {
            listEl.innerHTML = `
                <div style="text-align:center;padding:14px;font-size:13px;color:var(--pc-muted,#6b8ca0);">
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                </div>`;
            return;
        }
        listEl.innerHTML = comments.map(_buildCommentHTML).join('');
    } catch {
        listEl.innerHTML = `
            <div style="text-align:center;padding:12px;font-size:13px;color:#d62929;">
                Không tải được bình luận.
            </div>`;
    }
}

// ─── Event Handlers ───────────────────────────────────────────────────────────

/**
 * Gắn tất cả event listeners vào wrapper element của một post card.
 */
function _attachPostEvents(wrapperEl, postId, isLiked, post) {
    // ── Like button ──────────────────────────────────────────────────────────
    const likeBtn = wrapperEl.querySelector(`.post-action-btn--like[data-post-id="${postId}"]`);
    const likeCountEl = wrapperEl.querySelector(`[data-like-count="${postId}"]`);
    let _liked = isLiked;
    let _liking = false;

    likeBtn?.addEventListener('click', async () => {
        if (_liking) return;
        const token = await _getAuthToken();
        if (!token) {
            // Gợi ý đăng nhập
            if (window.showPopup) window.showPopup('popup-login');
            else if (window.showToast) window.showToast('Vui lòng đăng nhập để thích bài viết.', 'warning');
            return;
        }
        _liking = true;
        _liked = !_liked;

        // Optimistic UI update
        likeBtn.classList.toggle('is-liked', _liked);
        const svgEl = likeBtn.querySelector('svg');
        if (svgEl) svgEl.setAttribute('fill', _liked ? 'currentColor' : 'none');
        if (likeCountEl) {
            const cur = parseInt(likeCountEl.textContent.replace('K', '000')) || 0;
            likeCountEl.textContent = _fmtCount(_liked ? cur + 1 : Math.max(0, cur - 1));
        }

        try {
            await _apiFetch(`/posts/${postId}/like`, { method: 'POST' });
        } catch (err) {
            // Rollback nếu API lỗi
            _liked = !_liked;
            likeBtn.classList.toggle('is-liked', _liked);
            if (svgEl) svgEl.setAttribute('fill', _liked ? 'currentColor' : 'none');
            console.error('[TopGo Post] Like failed:', err);
        } finally {
            _liking = false;
        }
    });

    // ── Comment button (toggle section) ─────────────────────────────────────
    const commentBtn = wrapperEl.querySelector(`.post-action-btn--comment[data-post-id="${postId}"]`);
    const commentsSection = wrapperEl.querySelector(`[data-comments-section="${postId}"]`);
    const commentsList = wrapperEl.querySelector(`[data-comments-list="${postId}"]`);

    commentBtn?.addEventListener('click', async () => {
        const isOpen = commentsSection.style.display !== 'none';
        if (isOpen) {
            commentsSection.style.display = 'none';
        } else {
            commentsSection.style.display = 'block';
            await _loadComments(postId, commentsList);
            // Focus input nếu đang đăng nhập
            wrapperEl.querySelector(`[data-comment-input="${postId}"]`)?.focus();
        }
    });

    // ── Comment input → submit button hiện/ẩn ───────────────────────────────
    const commentInput = wrapperEl.querySelector(`[data-comment-input="${postId}"]`);
    const submitRow = commentInput?.closest('.comment-input-wrap')?.querySelector('.comment-submit-row');
    const submitBtn = wrapperEl.querySelector(`.post-comment-submit-btn[data-post-id="${postId}"]`);

    commentInput?.addEventListener('input', () => {
        const hasContent = commentInput.value.trim().length > 0;
        if (submitRow) submitRow.style.display = hasContent ? 'flex' : 'none';
        if (submitBtn) submitBtn.disabled = !hasContent;
    });

    commentInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submitBtn?.click();
        }
    });

    // ── Submit comment ───────────────────────────────────────────────────────
    submitBtn?.addEventListener('click', async () => {
        const content = commentInput?.value.trim();
        if (!content) return;
        submitBtn.disabled = true;
        submitBtn.textContent = '…';

        try {
            const result = await _apiFetch(`/posts/${postId}/comments`, {
                method: 'POST',
                body: JSON.stringify({ content }),
            });
            // Thêm comment mới vào cuối danh sách
            if (commentsList && (commentsList.innerHTML.includes('Chưa có bình luận nào') || commentsList.children.length === 0)) {
                commentsList.innerHTML = '';
            }
            commentsList?.insertAdjacentHTML('beforeend', _buildCommentHTML(result.comment));
            commentsList?.lastElementChild?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            if (commentInput) commentInput.value = '';
            if (submitRow) submitRow.style.display = 'none';

            // Tăng comment count
            const countEl = commentBtn?.querySelector('.post-action-count');
            if (countEl) {
                const cur = parseInt(countEl.textContent.replace('K', '000')) || 0;
                countEl.textContent = _fmtCount(cur + 1);
            }
        } catch (err) {
            console.error('[TopGo Post] Comment failed:', err);
            if (window.showToast) window.showToast('Bình luận thất bại. Vui lòng thử lại.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Gửi';
        }
    });

    // ── Repost button (trigger modal) ─────────────────────────────────────────
    const repostBtn = wrapperEl.querySelector(`.post-action-btn--repost[data-post-id="${postId}"]`);

    repostBtn?.addEventListener('click', async () => {
        const token = await _getAuthToken();
        if (!token) {
            if (window.showPopup) window.showPopup('popup-login');
            else if (window.showToast) window.showToast('Vui lòng đăng nhập để chia sẻ lại.', 'warning');
            return;
        }
        _showRepostModal(postId, repostBtn, post);
    });
}

// ─── Itinerary Coordinate Helpers ────────────────────────────────────────────

/**
 * Trích xuất tọa độ trung tâm (optimal_coordinate) từ dữ liệu itinerary raw.
 * API trả về field `itinerary` là chuỗi JSON chứa cấu trúc đầy đủ.
 *
 * Thứ tự ưu tiên:
 *  1. routing.optimal_coordinate.lat/lon  (từ routing output của backend)
 *  2. Tọa độ trung bình của tất cả places trong routing.daily_routes
 *
 * @param {object} raw — Dữ liệu itinerary thô từ API
 * @returns {{ lat: number, lng: number }|null}
 */
function _extractItineraryCoords(raw) {
    try {
        // Thử parse field `itinerary` (JSON string) nếu có
        let parsed = null;
        if (raw.itinerary) {
            parsed = typeof raw.itinerary === 'string' ? JSON.parse(raw.itinerary) : raw.itinerary;
        }

        // Ưu tiên 1: optimal_coordinate trong routing
        const routing = parsed?.routing || raw.routing;
        if (routing?.optimal_coordinate) {
            const oc = routing.optimal_coordinate;
            const lat = parseFloat(oc.lat ?? oc.latitude ?? 0);
            const lon = parseFloat(oc.lon ?? oc.lng ?? oc.longitude ?? 0);
            if (lat !== 0 && lon !== 0) return { lat, lng: lon };
        }

        // Ưu tiên 2: trung bình tất cả places trong daily_routes
        const places = _extractItineraryPlaces(raw);
        const valid = places.filter(p => p.lat !== 0 && p.lon !== 0);
        if (valid.length > 0) {
            const lat = valid.reduce((s, p) => s + p.lat, 0) / valid.length;
            const lon = valid.reduce((s, p) => s + p.lon, 0) / valid.length;
            return { lat, lng: lon };
        }
    } catch { /* bỏ qua lỗi parse — sẽ fallback geocode */ }
    return null;
}

/**
 * Trích xuất mảng các điểm tham quan (có tọa độ) từ dữ liệu itinerary raw.
 * Dùng để vẽ nhiều marker trên bản đồ.
 *
 * @param {object} raw — Dữ liệu itinerary thô từ API
 * @returns {Array<{ lat: number, lon: number, name: string }>}
 */
function _extractItineraryPlaces(raw) {
    try {
        let parsed = null;
        if (raw.itinerary) {
            parsed = typeof raw.itinerary === 'string' ? JSON.parse(raw.itinerary) : raw.itinerary;
        }

        const routing = parsed?.routing || raw.routing;
        const dailyRoutes = routing?.daily_routes || [];
        const places = [];

        for (const day of dailyRoutes) {
            // daily_routes[].places[] — mảng điểm trong ngày
            for (const place of (day.places || day.route_places || [])) {
                const lat = parseFloat(place.lat ?? place.latitude ?? 0);
                const lon = parseFloat(place.lon ?? place.lng ?? place.longitude ?? 0);
                if (lat !== 0 && lon !== 0) {
                    places.push({ lat, lon, name: place.name || place.ten || '' });
                }
            }
            // daily_routes[].route_geometry — polyline points (tuỳ chọn)
        }
        return places;
    } catch { return []; }
}

// ─── SKELETON LOADER ─────────────────────────────────────────────────────────

function _buildSkeletonHTML() {
    return `
    <div class="topgo-thu-post-wrapper">
        <div class="post-card post-card--text post-card--loading">
            <div class="post-header">
                <div class="post-author-avatar" style="background:var(--pc-border-light,#e5f3fa);"></div>
                <div class="post-author-meta">
                    <div class="post-skeleton-line" style="width:120px;margin-bottom:6px;"></div>
                    <div class="post-skeleton-line" style="width:70px;height:10px;"></div>
                </div>
            </div>
            <div class="post-body">
                <div class="post-skeleton-line" style="width:100%;margin-bottom:8px;"></div>
                <div class="post-skeleton-line" style="width:85%;margin-bottom:8px;"></div>
                <div class="post-skeleton-line" style="width:60%;"></div>
            </div>
        </div>
    </div>`;
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

/**
 * Hàm factory chính — render một Post Card và nhúng vào containerEl.
 *
 * @param {string} postId — ID bài đăng cần render
 * @param {HTMLElement} containerEl — Phần tử DOM để nhúng card vào
 * @param {object} [options] — Tuỳ chọn bổ sung:
 *   @param {object} [options.mockData] — Dữ liệu mock (dùng khi không có backend)
 *   @param {boolean} [options.showComments] — Tự động mở vùng comment
 *
 * @example
 * // Import và sử dụng:
 * import { renderPostCard } from './js/post.js';
 *
 * // Render từ API:
 * await renderPostCard('post-123', document.getElementById('my-feed'));
 *
 * // Render với mock data (demo / không cần backend):
 * await renderPostCard('demo', container, { mockData: { ... } });
 */
export async function renderPostCard(postId, containerEl, options = {}) {
    if (!containerEl) {
        console.error('[TopGo Post] renderPostCard: containerEl is required');
        return;
    }

    // ── Bước 1: Hiện skeleton loading ────────────────────────────────────────
    const skeletonEl = document.createElement('div');
    skeletonEl.innerHTML = _buildSkeletonHTML();
    containerEl.appendChild(skeletonEl.firstElementChild);
    const wrapperEl = containerEl.lastElementChild;

    try {
        // ── Bước 2: Fetch dữ liệu bài post từ Firebase backend ───────────────
        let isLiked = false;

        // Nếu có mockData trong options thì dùng (chế độ demo/test)
        let post, itineraryData = null;

        if (options.mockData) {
            post = { id: postId, ...options.mockData };
        } else {
            // Gọi API thực — GET /api/posts/{postId}
            post = await _apiFetch(`/posts/${postId}`);
        }

        // Cache post data for edit/delete functions in postCard.js
        if (post && post.id) {
            if (!window._renderedPostsCache) {
                window._renderedPostsCache = new Map();
            }
            window._renderedPostsCache.set(post.id, post);
        }

        // ── Bước 3: Lấy like status (chỉ khi user đã đăng nhập) ──────────────
        const currentUser = _getCurrentUser();
        if (currentUser) {
            try {
                const likeStatus = await _apiFetch(`/posts/${postId}/like-status`);
                isLiked = likeStatus?.liked === true;
            } catch {
                // Không lấy được like status — bỏ qua, không block render
                isLiked = false;
            }
        }

        // ── Bước 4: Lấy dữ liệu lịch trình đính kèm (nếu có) ────────────────
        if (post.type === 'itinerary' && post.itineraryId) {
            try {
                const raw = await _apiFetch(`/itineraries/${post.itineraryId}`);
                // Chuẩn hoá: API trả về PlanSaveRequest schema
                itineraryData = {
                    destination: raw.destination || '',
                    days:        parseInt(raw.days)   || null,
                    pax:         parseInt(raw.pax)    || null,
                    budget:      parseFloat(raw.budget) || null,
                    dateStart:   raw.dateStart || null,
                    dateEnd:     raw.dateEnd   || null,
                    // Tọa độ: lấy từ routing nếu có
                    _coords: _extractItineraryCoords(raw),
                    _places: _extractItineraryPlaces(raw),
                };
            } catch (err) {
                // Lịch trình private hoặc không tồn tại — render card không có map
                console.warn(`[TopGo Post] Itinerary ${post.itineraryId} không lấy được:`, err.message);
                itineraryData = null;
            }
        }

        // ── Bước 5: Xác định variant CSS class ───────────────────────────────
        const variantClass = {
            image: 'post-card--image',
            itinerary: 'post-card--itinerary',
            repost: 'post-card--text',
        }[post.type] || 'post-card--text';

        // ── Bước 6: Dựng HTML hoàn chỉnh ─────────────────────────────────────
        const html = `
        <div class="topgo-thu-post-wrapper">
            <div class="post-card ${variantClass}" data-post-id="${_esc(postId)}">
                ${_buildPostHeader(post)}
                ${post.type === 'image' ? _buildImageBlock(post.mediaUrls?.[0] || post.imageUrl) : ''}
                <div class="post-body">
                    <div class="post-content-text">${_esc(post.content)}</div>
                </div>
                ${post.type === 'itinerary' ? _buildItineraryCard(post.itineraryId, itineraryData, postId) : ''}
                ${post.type === 'repost' && post.repostOriginal ? _buildQuoteBlock(post.repostOriginal) : ''}
                ${_buildLocationsBlock(post.taggedLocations)}
                ${_buildInteractions(post, isLiked)}
                ${_buildCommentsSection(post, currentUser)}
            </div>
        </div>`;

        // ── Bước 7: Thay skeleton bằng nội dung thật ─────────────────────────
        wrapperEl.outerHTML = html;
        const finalWrapper = containerEl.lastElementChild;

        // ── Bước 8: Gắn events ────────────────────────────────────────────────
        _attachPostEvents(finalWrapper, postId, isLiked, post);

        // ── Bước 9: Khởi tạo Leaflet map (nếu là variant itinerary) ──────────
        if (post.type === 'itinerary' && post.itineraryId) {
            const destination = itineraryData?.destination || post.content?.substring(0, 50) || 'Việt Nam';
            const coords  = itineraryData?._coords  || null;
            const places  = itineraryData?._places  || [];
            // Delay nhỏ để đảm bảo DOM đã render xong
            setTimeout(() => {
                _initLeafletMap(`itinerary-map-${postId}`, destination, coords, places);
            }, 100);
        }

        // ── Bước 10: Tự mở comments nếu có option ────────────────────────────
        if (options.showComments) {
            const commentsSection = finalWrapper.querySelector(`[data-comments-section="${postId}"]`);
            const commentsList = finalWrapper.querySelector(`[data-comments-list="${postId}"]`);
            if (commentsSection) {
                commentsSection.style.display = 'block';
                await _loadComments(postId, commentsList);
            }
        }

        return finalWrapper;

    } catch (err) {
        // ── Bước thay thế nếu lỗi: hiển thị error state ─────────────────────
        const errMsg = err.message.includes('403') || err.message.includes('Private')
            ? '🔒 Bài đăng này ở chế độ riêng tư.'
            : err.message.includes('404')
                ? 'Không tìm thấy bài đăng.'
                : 'Không thể tải bài đăng. Vui lòng thử lại.';

        wrapperEl.innerHTML = `
        <div class="topgo-thu-post-wrapper">
            <div class="post-card post-card--text">
                <div class="post-body" style="padding:20px 18px;text-align:center;">
                    <div style="font-size:24px;margin-bottom:8px;">😕</div>
                    <div style="font-size:14px;color:var(--pc-muted,#6b8ca0);">${_esc(errMsg)}</div>
                </div>
            </div>
        </div>`;
        console.warn(`[TopGo Post] renderPostCard("${postId}") failed:`, err);
        return null;
    }
}

/**
 * Render nhiều bài post vào một container (tiện lợi cho feed).
 *
 * @param {string[]} postIds — Mảng các ID bài đăng
 * @param {HTMLElement} containerEl — Phần tử DOM chứa danh sách posts
 * @param {object} [options] — Tuỳ chọn (giống renderPostCard)
 *
 * @example
 * import { renderPostFeed } from './js/post.js';
 * await renderPostFeed(['post-1', 'post-2', 'post-3'], document.getElementById('feed-container'));
 */
export async function renderPostFeed(postIds, containerEl, options = {}) {
    if (!postIds?.length || !containerEl) return;
    // Render tuần tự để giữ thứ tự
    for (const id of postIds) {
        await renderPostCard(id, containerEl, options);
    }
}

/**
 * Gửi yêu cầu lên Backend để nhân bản (Clone) một lịch trình 
 * từ bài đăng của người khác về tài khoản cá nhân của người dùng hiện tại.
 * 
 * @param {string} originalItineraryId - ID của lịch trình gốc cần sao chép
 * @returns {Promise<object>} - Thông tin lịch trình mới đã được clone
 */
export async function cloneItinerary(originalItineraryId) {
    if (!originalItineraryId) {
        throw new Error('Thiếu ID lịch trình để nhân bản.');
    }

    const token = await _getAuthToken();
    if (!token) {
        if (window.showPopup) window.showPopup('popup-login');
        else if (window.showToast) window.showToast('Vui lòng đăng nhập để lưu lịch trình này.', 'warning');
        throw new Error('Unauthorized');
    }

    try {
        // Gọi API Endpoint nhân bản do Backend xử lý
        const result = await _apiFetch(`/itineraries/${originalItineraryId}/clone`, {
            method: 'POST'
        });

        if (window.showToast) {
            window.showToast('Đã lưu thành công lịch trình vào tài khoản của bạn!', 'success');
        }

        return result;
    } catch (err) {
        console.error('[TopGo Post] Clone itinerary failed:', err);
        if (window.showToast) {
            window.showToast('Không thể lưu lịch trình. Có thể lịch trình này đang ở chế độ Riêng tư.', 'error');
        }
        throw err;
    }
}

// ─── Global Repost Modal ───────────────────────────────────────────────────

function _showRepostModal(postId, repostBtn, post) {
    let modal = document.getElementById('global-repost-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'global-repost-modal';
        modal.className = 'repost-modal-overlay topgo-thu-post-wrapper';
        modal.innerHTML = `
            <div class="repost-modal-content">
                <div class="repost-modal-header">
                    <h3>Chia sẻ lại bài viết</h3>
                    <button class="repost-modal-close" aria-label="Đóng">✕</button>
                </div>
                <div class="repost-modal-body">
                    <textarea class="repost-modal-textarea" placeholder="Thêm bình luận của bạn về bài đăng này…" rows="3" maxlength="500"></textarea>
                    <div class="repost-modal-quote-container" style="margin-top: 16px;"></div>
                </div>
                <div class="repost-modal-footer">
                    <button class="repost-modal-cancel">Hủy</button>
                    <button class="repost-modal-submit">Đăng lại</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.querySelector('.repost-modal-close').addEventListener('click', () => _closeRepostModal(modal));
        modal.querySelector('.repost-modal-cancel').addEventListener('click', () => _closeRepostModal(modal));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) _closeRepostModal(modal);
        });
    }

    const quoteContainer = modal.querySelector('.repost-modal-quote-container');
    const originalToQuote = post;
    if (quoteContainer) {
        quoteContainer.innerHTML = originalToQuote ? _buildQuoteBlock(originalToQuote) : '';
    }

    const textarea = modal.querySelector('.repost-modal-textarea');
    textarea.value = '';
    
    const submitBtn = modal.querySelector('.repost-modal-submit');
    // Remove old event listeners by replacing the button
    const newSubmitBtn = submitBtn.cloneNode(true);
    submitBtn.parentNode.replaceChild(newSubmitBtn, submitBtn);
    
    newSubmitBtn.addEventListener('click', async () => {
        newSubmitBtn.disabled = true;
        newSubmitBtn.textContent = 'Đang xử lý…';
        try {
            await _apiFetch(`/posts/${postId}/repost`, {
                method: 'POST',
                body: JSON.stringify({ content: textarea.value.trim() }),
            });
            _closeRepostModal(modal);
            repostBtn?.classList.add('is-reposting');
            if (window.showToast) window.showToast('Đã chia sẻ lại bài đăng!', 'success');
        } catch (err) {
            console.error('[TopGo Post] Repost failed:', err);
            if (window.showToast) window.showToast('Chia sẻ lại thất bại. Vui lòng thử lại.', 'error');
        } finally {
            newSubmitBtn.disabled = false;
            newSubmitBtn.textContent = 'Đăng lại';
        }
    });

    modal.classList.add('active');
    setTimeout(() => textarea.focus(), 50);
}

function _closeRepostModal(modal) {
    if (modal) {
        modal.classList.remove('active');
    }
}