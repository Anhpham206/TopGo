/* 
  ========================================================================
  FILE: newsfeed.js
  CHỨC NĂNG: 
  - Quản lý bảng tin mạng xã hội (News Feed) cho TopGo.
  - Render PostCard linh hoạt: text-only, kèm ảnh, đính kèm Itinerary Card.
  - Infinite scroll qua Intersection Observer.
  - Hot Search widget fetch & render.
  - Mock data fallback cho offline development.
  ========================================================================
*/
import { loadSharedComponents, showToast } from './shared.js';
import { SuggestedFollowWidget, DestinationsWidget } from './sidebarUtils.js';
import { renderPostCard } from './post.js';

import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from './firebaseConfig.js';

// ── Config ───────────────────────────────────────────────────
const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

// Khởi tạo Firebase (dùng app đã có nếu tồn tại)
const _fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const _fbAuth = getAuth(_fbApp);

// Lấy fresh ID Token từ Firebase (tự động refresh nếu hết hạn)
async function _getAuthHeaders() {
    try {
        let user = _fbAuth.currentUser;
        // Nếu currentUser chưa sẵn sàng, chờ Firebase Auth khởi tạo
        if (!user) {
            user = await _waitForFirebaseAuth();
        }
        if (user) {
            const token = await user.getIdToken(); // tự động refresh nếu hết hạn
            return { 'Authorization': `Bearer ${token}` };
        }
    } catch (e) {
        console.warn('[TopGo] Không thể lấy Firebase token:', e);
    }
    return {};
}

// ── State ────────────────────────────────────────────────────
let _currentTab = 'explore';   // 'explore' | 'following'
let _feedCursor = null;
let _isLoading = false;
let _hasMore = true;
let _observer = null;

// ── DOM References ───────────────────────────────────────────
const feedContent = () => document.getElementById('feed-content');
const feedSkeleton = () => document.getElementById('feed-skeleton');
const feedEmpty = () => document.getElementById('feed-empty');
const feedSentinel = () => document.getElementById('feed-sentinel');
const feedLoadingMore = () => document.getElementById('feed-loading-more');
const hotSearchList = () => document.getElementById('hot-search-list');

// =========================================================================

// =========================================================================
// HOT SEARCH WIDGET
// =========================================================================

const HotSearchWidget = {
    async load() {
        try {
            const res = await fetch(`${API_BASE}/api/hot-search?limit=10`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (data.topics && data.topics.length > 0) {
                this.render(data.topics);
            } else {
                this.hide();
            }
        } catch (err) {
            console.warn('[TopGo] Hot search API failed:', err.message);
            this.hide();
        }
    },

    hide() {
        const list = hotSearchList();
        if (list) {
            list.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">Đang cập nhật xu hướng mới nhất...</div>';
        }
        // Update header too
        const header = document.querySelector('#sidebar-hot-search .hot-search-header h3');
        if (header) header.textContent = 'Xu hướng du lịch';
    },

    render(topics) {
        const list = hotSearchList();
        if (!list || !topics.length) {
            this.hide();
            return;
        }

        // Update header to include icon
        const headerEl = document.querySelector('#sidebar-hot-search .hot-search-header');
        if (headerEl) {
            headerEl.innerHTML = `
                <h3 class="gradient-title">Xu hướng</h3>
                <a href="./trending.html" class="hot-search-header-link">Xem tất cả →</a>
            `;
        }

        const topTopics = topics.slice(0, 3);
        const maxCount = Math.max(...topTopics.map(t => t.postCount || 0), 1);

        const html = topTopics.map((topic, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
            
            const trendIcon = topic.trend === 'up' 
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="19" x2="12" y2="5"></line><polyline points="5 12 12 5 19 12"></polyline></svg>'
                    : topic.trend === 'down' 
                    ? '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><polyline points="19 12 12 19 5 12"></polyline></svg>'
                    : '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line></svg>';
            
            const trendClass = topic.trend === 'up' ? 'trend-up'
                             : topic.trend === 'down' ? 'trend-down' : 'trend-stable';
            const heatPct = Math.round((topic.postCount || 0) / maxCount * 100);

            return `
            <li class="hot-search-item" data-topic="${_escapeHtml(topic.name || '')}" onclick="window.location.href='./location.html?name=${encodeURIComponent(topic.name || '')}'">
                <div class="hot-rank ${rankClass}">${rank}</div>
                <div class="hot-topic-info">
                    <div class="hot-topic-name">${_escapeHtml(topic.name || '')}</div>
                    <div class="hot-topic-posts">${topic.postCount || 0} bài viết</div>
                    <div class="hot-topic-heat-bar">
                        <div class="hot-topic-heat-fill" style="width: ${heatPct}%;"></div>
                    </div>
                </div>
                <span class="hot-trend-icon ${trendClass}">${trendIcon}</span>
            </li>`;
        }).join('');

        list.innerHTML = html + `
            <a class="hot-search-view-all" href="./trending.html">
                <span class="hot-search-view-all-text">Xem tất cả xu hướng</span>
                <span class="hot-search-view-all-arrow">→</span>
            </a>
        `;
    }
};


// =========================================================================



// =========================================================================
// POST COMPOSER — QUẢN LÝ VIẾT BÀI MỚI
// =========================================================================

const PostComposer = {
    _selectedFiles: [],      // File objects
    _previewUrls: [],        // Object URLs for preview
    _taggedLocations: [],
    _selectedItinerary: null,
    _itinerariesCache: null,

    init() {
        this._textarea = document.getElementById('composer-textarea');
        this._submitBtn = document.getElementById('composer-submit');
        this._fileInput = document.getElementById('composer-file-input');
        this._mediaPreview = document.getElementById('composer-media-preview');
        this._locationsEl = document.getElementById('composer-locations');
        this._locationInputWrapper = document.getElementById('composer-location-input-wrapper');
        this._locationInput = document.getElementById('composer-location-input');
        this._itinPreview = document.getElementById('composer-itinerary-preview');
        this._itinDropdown = document.getElementById('composer-itinerary-dropdown');
        this._itinList = document.getElementById('composer-itinerary-list');
        this._itinDropdownLoading = document.getElementById('composer-dropdown-loading');

        if (!this._textarea) return;

        this._initAutoGrow();
        this._initImagePicker();
        this._initLocationTagger();
        this._initItinerarySelector();
        this._initSubmit();
        this._updateAvatar();
    },

    // ── Avatar từ user info ──
    _updateAvatar() {
        try {
            const userStr = localStorage.getItem('topgo_user');
            let name = '';
            let photo = '';
            if (userStr) {
                const user = JSON.parse(userStr);
                name = user.firstname || user.email || 'Tài khoản';
                photo = user.photoURL || '';
            }
            
            const avatarEl = document.getElementById('composer-avatar');
            if (!avatarEl) return;
            if (photo && photo !== 'undefined' && photo !== 'null') {
                avatarEl.innerHTML = `<img src="${_escapeHtml(photo)}" alt="Avatar">`;
            } else if (name) {
                avatarEl.textContent = name.charAt(0).toUpperCase();
            }
        } catch (e) { /* silent */ }
    },

    // ── Auto-grow textarea ──
    _initAutoGrow() {
        this._textarea.addEventListener('input', () => {
            this._textarea.style.height = 'auto';
            this._textarea.style.height = Math.min(this._textarea.scrollHeight, 200) + 'px';
            this._updateSubmitState();
        });
    },

    // ── Image Picker ──
    _initImagePicker() {
        const btnImage = document.getElementById('composer-btn-image');
        btnImage.addEventListener('click', () => {
            this._fileInput.click();
        });

        this._fileInput.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length === 0) return;

            // Max 4 images total
            const remaining = 4 - this._selectedFiles.length;
            if (remaining <= 0) {
                showToast('Tối đa 4 ảnh mỗi bài viết', 'warning');
                return;
            }

            const toAdd = files.slice(0, remaining);
            toAdd.forEach(file => {
                this._selectedFiles.push(file);
                this._previewUrls.push(URL.createObjectURL(file));
            });

            if (files.length > remaining) {
                showToast(`Chỉ thêm được ${remaining} ảnh nữa (tối đa 4)`, 'warning');
            }

            this._renderMediaPreview();
            this._updateSubmitState();
            this._fileInput.value = ''; // Reset input
        });
    },

    _renderMediaPreview() {
        if (this._previewUrls.length === 0) {
            this._mediaPreview.style.display = 'none';
            this._mediaPreview.innerHTML = '';
            return;
        }

        this._mediaPreview.style.display = 'grid';
        // Remove old grid classes
        this._mediaPreview.className = 'composer-media-preview';
        const count = Math.min(this._previewUrls.length, 4);
        this._mediaPreview.classList.add(`grid-${count}`);

        this._mediaPreview.innerHTML = this._previewUrls.map((url, idx) => `
            <div class="composer-media-item" data-idx="${idx}">
                <img src="${url}" alt="Ảnh ${idx + 1}">
                <button class="composer-media-remove" data-remove-idx="${idx}" title="Xóa ảnh">✕</button>
            </div>
        `).join('');

        // Bind remove buttons
        this._mediaPreview.querySelectorAll('.composer-media-remove').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(btn.dataset.removeIdx);
                URL.revokeObjectURL(this._previewUrls[idx]);
                this._selectedFiles.splice(idx, 1);
                this._previewUrls.splice(idx, 1);
                this._renderMediaPreview();
                this._updateSubmitState();
            });
        });
    },

    // ── Location Tagger ──
    _initLocationTagger() {
        const btnLocation = document.getElementById('composer-btn-location');

        btnLocation.addEventListener('click', () => {
            const isVisible = this._locationInputWrapper.style.display !== 'none';
            this._locationInputWrapper.style.display = isVisible ? 'none' : '';
            btnLocation.classList.toggle('active', !isVisible);

            // Hide itinerary dropdown if open
            this._itinDropdown.style.display = 'none';
            document.getElementById('composer-btn-itinerary').classList.remove('active');

            if (!isVisible) {
                this._locationInput.focus();
            }
        });

        this._locationInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const value = this._locationInput.value.trim();
                if (!value) return;
                if (this._taggedLocations.length >= 5) {
                    showToast('Tối đa 5 địa điểm', 'warning');
                    return;
                }
                if (this._taggedLocations.includes(value)) {
                    showToast('Địa điểm này đã được thêm', 'warning');
                    return;
                }
                this._taggedLocations.push(value);
                this._locationInput.value = '';
                this._renderLocationTags();
                this._updateSubmitState();
            }
        });
    },

    _renderLocationTags() {
        if (this._taggedLocations.length === 0) {
            this._locationsEl.style.display = 'none';
            this._locationsEl.innerHTML = '';
            return;
        }

        this._locationsEl.style.display = 'flex';
        this._locationsEl.innerHTML = this._taggedLocations.map((loc, idx) => `
            <span class="composer-location-pill">
                ${_escapeHtml(loc)}
                <button class="pill-remove" data-loc-idx="${idx}" title="Xóa">✕</button>
            </span>
        `).join('');

        this._locationsEl.querySelectorAll('.pill-remove').forEach(btn => {
            btn.addEventListener('click', () => {
                const idx = parseInt(btn.dataset.locIdx);
                this._taggedLocations.splice(idx, 1);
                this._renderLocationTags();
                this._updateSubmitState();
            });
        });
    },

    // ── Itinerary Selector ──
    _initItinerarySelector() {
        const btnItin = document.getElementById('composer-btn-itinerary');

        btnItin.addEventListener('click', async () => {
            const isVisible = this._itinDropdown.style.display !== 'none';
            this._itinDropdown.style.display = isVisible ? 'none' : '';
            btnItin.classList.toggle('active', !isVisible);

            // Hide location input if open
            this._locationInputWrapper.style.display = 'none';
            document.getElementById('composer-btn-location').classList.remove('active');

            if (!isVisible) {
                await this._loadItineraries();
            }
        });
    },

    async _loadItineraries() {
        this._itinDropdownLoading.style.display = '';
        this._itinList.innerHTML = '';

        try {
            if (!this._itinerariesCache) {
                const res = await fetch(`${API_BASE}/api/plans/list`, {
                    headers: await _getAuthHeaders()
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                this._itinerariesCache = data.plans || data || [];
            }

            this._itinDropdownLoading.style.display = 'none';
            const plans = Array.isArray(this._itinerariesCache) ? this._itinerariesCache : [];

            if (plans.length === 0) {
                this._itinList.innerHTML = '<li class="itin-empty">Bạn chưa có lịch trình nào được lưu</li>';
                return;
            }

            this._itinList.innerHTML = plans.map((plan, idx) => {
                const dest = plan.destination || plan.title || 'Lịch trình';
                const days = plan.days || plan.numDays || 0;
                const budget = plan.budget || 0;
                const budgetStr = budget > 0
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(budget)
                    : '';
                return `
                    <li data-plan-idx="${idx}">
                        <div>${_escapeHtml(dest)}</div>
                        <div class="itin-item-meta">
                            ${days > 0 ? `${days} ngày` : ''}
                            ${budgetStr ? ` · ${budgetStr}` : ''}
                        </div>
                    </li>
                `;
            }).join('');

            // Bind click
            this._itinList.querySelectorAll('li[data-plan-idx]').forEach(li => {
                li.addEventListener('click', () => {
                    const idx = parseInt(li.dataset.planIdx);
                    this._selectItinerary(plans[idx]);
                });
            });

        } catch (err) {
            console.warn('[TopGo] Load itineraries failed:', err.message);
            this._itinDropdownLoading.style.display = 'none';
            this._itinList.innerHTML = '<li class="itin-empty">Không thể tải lịch trình. Hãy đăng nhập trước.</li>';
        }
    },

    _selectItinerary(plan) {
        this._selectedItinerary = plan;
        this._itinDropdown.style.display = 'none';
        document.getElementById('composer-btn-itinerary').classList.remove('active');

        const dest = plan.destination || plan.title || 'Lịch trình';
        const days = plan.days || plan.numDays || 0;
        const budget = plan.budget || 0;
        const budgetStr = budget > 0
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(budget)
            : '';

        this._itinPreview.style.display = '';
        this._itinPreview.innerHTML = `
            <div class="composer-itin-card">
                <div class="itin-info">
                    <div class="itin-title">${_escapeHtml(dest)}</div>
                    <div class="itin-meta">
                        ${days > 0 ? `<span>${days} ngày</span>` : ''}
                        ${budgetStr ? `<span>${budgetStr}</span>` : ''}
                    </div>
                </div>
                <button class="composer-itin-remove" title="Bỏ lịch trình">✕</button>
            </div>
        `;

        this._itinPreview.querySelector('.composer-itin-remove').addEventListener('click', () => {
            this._selectedItinerary = null;
            this._itinPreview.style.display = 'none';
            this._itinPreview.innerHTML = '';
            this._updateSubmitState();
        });

        this._updateSubmitState();
    },

    // ── Submit ──
    _initSubmit() {
        this._submitBtn.addEventListener('click', () => this._handleSubmit());
    },

    _updateSubmitState() {
        const hasContent = this._textarea.value.trim().length > 0;
        const hasMedia = this._selectedFiles.length > 0;
        this._submitBtn.disabled = !(hasContent || hasMedia);
    },

    async _handleSubmit() {
        if (this._submitBtn.disabled) return;
        this._submitBtn.disabled = true;
        this._submitBtn.textContent = 'Đang đăng...';

        const content = this._textarea.value.trim();
        const locations = [...this._taggedLocations];
        const itineraryId = this._selectedItinerary?.id || this._selectedItinerary?.planId || null;

        // Build media URLs using FileReader for Base64 (simulate upload)
        const mediaUrls = [];
        for (const file of this._selectedFiles) {
            const dataUrl = await new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsDataURL(file);
            });
            mediaUrls.push(dataUrl);
        }

        try {
            const body = {
                content,
                mediaUrls: mediaUrls,
                taggedLocations: locations,
                itineraryId
            };

            const res = await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(await _getAuthHeaders())
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const newPost = await res.json();

            // Prepend new post to feed
            this._prependPost(newPost);
            showToast('Đăng bài thành công!', 'success');
            
            // Reload hot search sau 1s để đảm bảo backend đã update điểm
            setTimeout(() => {
                HotSearchWidget.load();
            }, 1000);

        } catch (err) {
            console.warn('[TopGo] Post submit failed:', err.message);
            showToast('Lỗi: Không thể kết nối đến máy chủ. Vui lòng thử lại sau!', 'error');
        }

        this._resetComposer();
    },

    _prependPost(postData) {
        const content = feedContent();
        if (!content) return;

        // Hide empty state if visible
        const empty = feedEmpty();
        if (empty) empty.style.display = 'none';

        const postPlaceholder = document.createElement('div');
        postPlaceholder.className = "post-container-placeholder";
        postPlaceholder.style.animation = 'composerPostIn 0.4s ease';
        content.insertBefore(postPlaceholder, content.firstChild);

        renderPostCard(postData.id, postPlaceholder, { mockData: postData });
    },

    _resetComposer() {
        // Text
        this._textarea.value = '';
        this._textarea.style.height = 'auto';

        // Media
        // Don't revoke URLs for mock posts that are using them
        this._selectedFiles = [];
        this._previewUrls = [];
        this._mediaPreview.style.display = 'none';
        this._mediaPreview.innerHTML = '';

        // Locations
        this._taggedLocations = [];
        this._locationsEl.style.display = 'none';
        this._locationsEl.innerHTML = '';

        // Itinerary
        this._selectedItinerary = null;
        this._itinPreview.style.display = 'none';
        this._itinPreview.innerHTML = '';

        // Hide panels
        this._locationInputWrapper.style.display = 'none';
        this._itinDropdown.style.display = 'none';
        document.getElementById('composer-btn-location')?.classList.remove('active');
        document.getElementById('composer-btn-itinerary')?.classList.remove('active');

        // Submit button
        this._submitBtn.disabled = true;
        this._submitBtn.textContent = 'Đăng bài';

        this._fileInput.value = '';
    }
};

// =========================================================================
// FEED MANAGER — QUẢN LÝ BẢNG TIN
// =========================================================================

const NewsFeedManager = {
    _postCountSinceLastAd: 0,
    _nextAdTarget: 0,

    async init() {
        this._initTabs();
        this._initInfiniteScroll();
        this._initEventDelegation();

        // Init post composer
        PostComposer.init();

        // Populate sidebar user card + greeting
        this._populateSidebar();

        // Load feed & hot search concurrently
        await Promise.all([
            this.loadFeed(),
            HotSearchWidget.load()
        ]);
    },

    _populateSidebar() {
        try {
            // Get user from AuthService (via localStorage cache)
            const raw = localStorage.getItem('topgo_user');
            if (!raw) return;
            const user = JSON.parse(raw);
            
            const fullname = `${user.lastname || ''} ${user.firstname || ''}`.trim() || 'Người dùng';
            
            // Greeting
            const greetEl = document.getElementById('feed-greeting');
            if (greetEl) {
                const greetings = [
                    "Sẵn sàng khám phá nhé",
                    "Hôm nay đi đâu thế",
                    "Khám phá thế giới nào",
                    "Có kế hoạch gì mới không",
                    "Lên lịch trình thôi",
                    "Tìm nguồn cảm hứng mới nhé",
                    "Cùng TopGo vi vu nào"
                ];
                const randomGreet = greetings[Math.floor(Math.random() * greetings.length)];
                greetEl.textContent = `${randomGreet}, ${user.firstname || fullname}!`;
            }
            
            // Sidebar Profile Card
            const spName = document.getElementById('sp-name');
            if (spName) spName.textContent = fullname;
            
            const spHandle = document.getElementById('sp-handle');
            if (spHandle) {
                const handle = user.username || (user.email ? user.email.split('@')[0] : String(user.id || user.uid || 'topgo').substring(0, 8));
                spHandle.textContent = `@${handle}`;
            }
            
            const spAvatar = document.getElementById('sp-avatar');
            if (spAvatar) {
                if (user.photoURL && user.photoURL !== 'undefined' && user.photoURL !== 'null') {
                    spAvatar.innerHTML = `<img src="${user.photoURL}" alt="">`;
                } else {
                    const initial = fullname.charAt(0).toUpperCase();
                    spAvatar.innerHTML = `<span>${initial}</span>`;
                }
            }
        } catch (e) {
            console.warn('[TopGo] Sidebar populate error:', e);
        }
    },

    _initTabs() {
        document.querySelectorAll('.feed-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const btn = e.currentTarget;
                const newTab = btn.dataset.tab;
                if (newTab === _currentTab) return;

                // Update active tab UI
                document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
                btn.classList.add('active');

                _currentTab = newTab;
                _feedCursor = null;
                _hasMore = true;
                this._postCountSinceLastAd = 0;
                this._nextAdTarget = 0;
                feedContent().innerHTML = '';
                this.loadFeed();
            });
        });
    },

    _initInfiniteScroll() {
        const sentinel = feedSentinel();
        if (!sentinel) return;

        _observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !_isLoading && _hasMore) {
                this.loadMore();
            }
        }, { rootMargin: '200px' });

        _observer.observe(sentinel);
    },

    _initEventDelegation() {
        // Event delegation cũ của feed (like, comment tĩnh) đã được gỡ bỏ.
        // Component post.js sẽ tự động quản lý các event của nó.
    },

    _handleLike(btn) {
        // Hàm này không còn dùng vì post.js tự xử lý.
    },

    async loadFeed() {
        _isLoading = true;
        const skeleton = feedSkeleton();
        const empty = feedEmpty();
        const content = feedContent();

        if (skeleton) skeleton.style.display = '';
        if (empty) empty.style.display = 'none';

        try {
            let data;

            if (_currentTab === 'following') {
                data = await this._fetchPersonalFeed();
            } else {
                data = await this._fetchExploreFeed();
            }

            if (skeleton) skeleton.style.display = 'none';

            const posts = data.posts || [];

            if (posts.length === 0 && !_feedCursor) {
                // No posts — show empty state
                if (empty) empty.style.display = '';
                _hasMore = false;
            } else {
                this._renderPosts(posts);
                _feedCursor = data.nextCursor;
                _hasMore = !!data.nextCursor;
            }

        } catch (err) {
            console.warn('[TopGo] Feed load error:', err.message);
            if (skeleton) skeleton.style.display = 'none';
            if (empty) empty.style.display = '';
            _hasMore = false;
        }

        _isLoading = false;
    },

    async loadMore() {
        if (_isLoading || !_hasMore) return;
        _isLoading = true;

        const loadingMore = feedLoadingMore();
        if (loadingMore) loadingMore.style.display = '';

        try {
            let data;
            if (_currentTab === 'following') {
                data = await this._fetchPersonalFeed(_feedCursor);
            } else {
                data = await this._fetchExploreFeed(_feedCursor);
            }

            const posts = data.posts || [];
            if (posts.length > 0) {
                this._renderPosts(posts);
                _feedCursor = data.nextCursor;
                _hasMore = !!data.nextCursor;
            } else {
                _hasMore = false;
            }
        } catch (err) {
            console.warn('[TopGo] Load more error:', err.message);
            _hasMore = false;
        }

        if (loadingMore) loadingMore.style.display = 'none';
        _isLoading = false;
    },

    async _renderPosts(posts) {
        const content = feedContent();
        if (!content) return;

        // Chạy song song renderPostCard vào các container để giữ thứ tự DOM
        const renderTasks = [];

        posts.forEach(post => {
            if (this._postCountSinceLastAd >= this._nextAdTarget) {
                const adDiv = document.createElement('div');
                adDiv.innerHTML = this._renderAdPost();
                content.appendChild(adDiv.firstElementChild);
                this._postCountSinceLastAd = 0;
                this._nextAdTarget = Math.floor(Math.random() * 7) + 4;
            }

            const postPlaceholder = document.createElement('div');
            postPlaceholder.className = "post-container-placeholder";
            content.appendChild(postPlaceholder);

            // Truyền mockData = post để dùng luôn data từ API newsfeed, tránh gọi lại API lẻ
            renderTasks.push(renderPostCard(post.id, postPlaceholder, { mockData: post }));

            this._postCountSinceLastAd++;
        });

        // Đợi tất cả bài post render xong (Leaflet map + Comments + UI hoàn tất)
        await Promise.all(renderTasks);
    },

    _renderAdPost() {
        return `
            <div class="post-card feed-ad-post">
                <div class="feed-ad-sponsor-badge">
                    <span>Được tài trợ</span>
                    <div class="feed-ad-menu">⋮</div>
                </div>
                
                <div class="post-header">
                    <img class="post-avatar" src="https://ui-avatars.com/api/?name=Ads&background=random&color=fff" alt="Ads">
                    <div class="post-author-info">
                        <a href="#" class="post-author-name" style="text-decoration:none; color:inherit;">TopGo Travel Ads</a>
                        <div class="post-timestamp">Tài trợ</div>
                    </div>
                </div>
                
                <div class="feed-ad-content">
                    <div class="feed-ad-text-placeholder"></div>
                    <div class="feed-ad-text-placeholder short"></div>
                    
                    <div class="feed-ad-location-placeholder">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                        <span>Vị trí quảng cáo...</span>
                    </div>

                    <div class="feed-ad-image-placeholder">
                        <span>Chưa có quảng cáo</span>
                    </div>

                    <div class="feed-ad-itin-placeholder">
                        <div class="feed-ad-itin-icon"></div>
                        <div class="feed-ad-itin-details">
                            <div class="feed-ad-text-placeholder tiny"></div>
                            <div class="feed-ad-text-placeholder tiny short"></div>
                        </div>
                    </div>
                </div>

                <div class="feed-ad-footer">
                    <button class="feed-ad-cta">Khám phá ngay</button>
                </div>
            </div>
        `;
    },

    async _fetchPersonalFeed(cursor = null) {
        const params = new URLSearchParams({ limit: '20' });
        if (cursor) params.set('cursor', cursor);

        try {
            const res = await fetch(`${API_BASE}/api/feed/following?${params}`, {
                headers: await _getAuthHeaders()
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            if (!data.posts || data.posts.length === 0) throw new Error('No personal posts');
            return data;
        } catch (err) {
            console.warn('[TopGo] Personal feed empty/failed, using mock fallback:', err.message);
            // Fallback: mượn tạm data của tab explore nhưng đổi tên để demo
            const fallbackData = await this._fetchExploreFeed(cursor);
            if (fallbackData && fallbackData.posts) {
                fallbackData.posts = fallbackData.posts.map(p => {
                    const mockedAuthorName = (p.authorName || p.author || 'Người dùng') + ' (Đang theo dõi)';
                    return { ...p, authorName: mockedAuthorName };
                });
            }
            return fallbackData;
        }
    },

    async _fetchExploreFeed(cursor = null) {
        const params = new URLSearchParams({ limit: '20' });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`${API_BASE}/api/feed/explore?${params}`, {
            headers: await _getAuthHeaders()
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
};

// =========================================================================
// KHỞI TẠO
// =========================================================================

// Chờ Firebase Auth xác minh trạng thái đăng nhập (tránh currentUser = null)
function _waitForFirebaseAuth() {
    return new Promise((resolve) => {
        const unsubscribe = _fbAuth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

function onDOMReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

function _updateSidebarProfile() {
    const userInfo = JSON.parse(localStorage.getItem('topgo_user') || '{}');
    const userStats = JSON.parse(localStorage.getItem('userStats') || '{"trips":0,"posts":0}');
    
    if (userInfo.uid) {
        const nameEl = document.getElementById('sp-name');
        const handleEl = document.getElementById('sp-handle');
        const avatarEl = document.getElementById('sp-avatar');
        
        const fullName = [userInfo.lastname, userInfo.firstname].filter(Boolean).join(' ').trim() || userInfo.email || 'Thành viên';

        if (nameEl) nameEl.textContent = fullName;
        if (handleEl) {
            const handle = userInfo.username || (userInfo.email ? userInfo.email.split('@')[0] : String(userInfo.uid || 'user').substring(0, 8));
            handleEl.textContent = '@' + handle;
        }
        if (avatarEl) {
            if (userInfo.photoURL && userInfo.photoURL !== 'undefined' && userInfo.photoURL !== 'null') {
                avatarEl.innerHTML = `<img src="${userInfo.photoURL}" alt="" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
            } else {
                avatarEl.innerHTML = `<span>${fullName.charAt(0).toUpperCase()}</span>`;
            }
        }
    }

    const tripsEl = document.getElementById('sp-trips');
    const postsEl = document.getElementById('sp-posts');
    if (tripsEl) tripsEl.textContent = userStats.trips || 0;
    if (postsEl) postsEl.textContent = userStats.posts || 0;

    // Fetch real stats using fresh Firebase token
    if (userInfo.uid) {
        _getAuthHeaders().then(headers => {
            if (!headers['Authorization']) return; // Chưa đăng nhập
            
            fetch(`${API_BASE}/api/users/profile`, { headers })
                .then(res => res.ok ? res.json() : null)
                .then(data => {
                    if (data) {
                        const tripCount = data.tripsCount ?? 0;
                        const postCount = data.postsCount ?? 0;
                        if (tripsEl) tripsEl.textContent = tripCount;
                        if (postsEl) postsEl.textContent = postCount;
                        localStorage.setItem('userStats', JSON.stringify({ trips: tripCount, posts: postCount }));
                    }
                })
                .catch(err => console.warn('Lỗi tải thống kê:', err));
        });
    }
}

onDOMReady(async () => {
    // Chờ Firebase Auth khởi tạo xong để currentUser không bị null
    await _waitForFirebaseAuth();
    
    // Đăng ký Bridge để nhận bài viết mới từ Modal của Diệp
    window.NewsFeedBridge = {
        onPostCreated(postData) {
            PostComposer._prependPost(postData);
            _updateSidebarProfile();
        }
    };

    _updateSidebarProfile();
    HotSearchWidget.load();
    SuggestedFollowWidget.load();
    DestinationsWidget.load();
    NewsFeedManager.init();
});

