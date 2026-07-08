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

// ── Config ───────────────────────────────────────────────────
const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

// ── State ────────────────────────────────────────────────────
let _currentTab = 'following';   // 'following' | 'explore'
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
            this.render(data.topics || []);
        } catch (err) {
            console.warn('[TopGo] Hot search API failed, using defaults:', err.message);
            this.render(this._getDefaults());
        }
    },

    render(topics) {
        const list = hotSearchList();
        if (!list || !topics.length) return;

        list.innerHTML = topics.map((topic, idx) => {
            const rank = idx + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : 'rank-default';
            const trendIcon = topic.trend === 'up' ? '↑'
                            : topic.trend === 'down' ? '↓' : '—';
            const trendClass = topic.trend === 'up' ? 'trend-up'
                             : topic.trend === 'down' ? 'trend-down' : 'trend-stable';

            return `
            <li class="hot-search-item" data-topic="${_escapeHtml(topic.name || '')}">
                <div class="hot-rank ${rankClass}">${rank}</div>
                <div class="hot-topic-info">
                    <div class="hot-topic-name">${_escapeHtml(topic.name || '')}</div>
                    <div class="hot-topic-posts">${topic.postCount || 0} bài viết</div>
                </div>
                <span class="hot-trend-icon ${trendClass}">${trendIcon}</span>
            </li>`;
        }).join('');
    },

    _getDefaults() {
        return [
            { name: "Đà Nẵng", postCount: 128, trend: "up" },
            { name: "Phú Quốc", postCount: 95, trend: "up" },
            { name: "Đà Lạt", postCount: 87, trend: "stable" },
            { name: "Hội An", postCount: 76, trend: "up" },
            { name: "Nha Trang", postCount: 64, trend: "stable" },
            { name: "Hà Nội", postCount: 58, trend: "down" },
            { name: "Sa Pa", postCount: 45, trend: "up" },
            { name: "TP. Hồ Chí Minh", postCount: 42, trend: "stable" },
            { name: "Ninh Bình", postCount: 38, trend: "up" },
            { name: "Hạ Long", postCount: 30, trend: "stable" },
        ];
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
            if (photo) {
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
                    headers: _getAuthHeaders()
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

        // Build media URLs (in production, these would be uploaded first)
        // For now, use object URLs or empty array
        const mediaUrls = this._previewUrls.map(u => u); // placeholder

        try {
            const body = {
                content,
                mediaUrls: [], // Real upload would go here
                taggedLocations: locations,
                itineraryId
            };

            const res = await fetch(`${API_BASE}/api/posts`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ..._getAuthHeaders()
                },
                body: JSON.stringify(body)
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const newPost = await res.json();

            // Prepend new post to feed
            this._prependPost(newPost);
            showToast('Đăng bài thành công!', 'success');

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

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = PostCardRenderer.render(postData);
        const newCard = tempDiv.firstElementChild;
        if (newCard) {
            newCard.style.animation = 'composerPostIn 0.4s ease';
            content.insertBefore(newCard, content.firstChild);
        }
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
                const hour = new Date().getHours();
                let greet = 'Xin chào';
                if (hour < 12) greet = 'Chào buổi sáng';
                else if (hour < 18) greet = 'Chào buổi chiều';
                else greet = 'Chào buổi tối';
                greetEl.textContent = `${greet}, ${user.firstname || fullname}! 👋`;
            }
            
            // Sidebar Profile Card
            const spName = document.getElementById('sp-name');
            if (spName) spName.textContent = fullname;
            
            const spHandle = document.getElementById('sp-handle');
            if (spHandle) spHandle.textContent = `@${user.id || 'topgo'}`;
            
            const spAvatar = document.getElementById('sp-avatar');
            if (spAvatar) {
                if (user.photoURL) {
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
                const newTab = e.target.dataset.tab;
                if (newTab === _currentTab) return;

                // Update active tab UI
                document.querySelectorAll('.feed-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');

                // Reset and reload
                _currentTab = newTab;
                _feedCursor = null;
                _hasMore = true;
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
        const content = feedContent();
        if (!content) return;

        content.addEventListener('click', (e) => {
            // Like button
            const likeBtn = e.target.closest('[data-action="like"]');
            if (likeBtn) {
                this._handleLike(likeBtn);
                return;
            }

            // Comment button
            const commentBtn = e.target.closest('[data-action="comment"]');
            if (commentBtn) {
                showToast('Tính năng bình luận đang được phát triển!', 'warning');
                return;
            }

            // Share button
            const shareBtn = e.target.closest('[data-action="share"]');
            if (shareBtn) {
                showToast('Tính năng chia sẻ đang được phát triển!', 'warning');
                return;
            }

            // Itinerary card click
            const itinCard = e.target.closest('.post-itinerary');
            if (itinCard) {
                const itinId = itinCard.dataset.itineraryId;
                if (itinId) {
                    showToast('Xem lịch trình chi tiết — đang phát triển!', 'warning');
                }
                return;
            }
        });
    },

    _handleLike(btn) {
        const isLiked = btn.classList.toggle('liked');
        const iconEl = btn.querySelector('.action-icon');
        const countEl = btn.querySelector('.action-count');
        
        if (iconEl) iconEl.textContent = isLiked ? '♥' : '♡';
        
        if (countEl) {
            let count = parseInt(countEl.textContent) || 0;
            count = isLiked ? count + 1 : Math.max(0, count - 1);
            countEl.textContent = _formatNumber(count);
        }

        // API call sẽ được tích hợp khi phần Like API (của Thư) sẵn sàng
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

    _renderPosts(posts) {
        const content = feedContent();
        if (!content) return;

        const fragment = document.createDocumentFragment();
        const tempDiv = document.createElement('div');

        posts.forEach(post => {
            tempDiv.innerHTML = PostCardRenderer.render(post);
            while (tempDiv.firstChild) {
                fragment.appendChild(tempDiv.firstChild);
            }
        });

        content.appendChild(fragment);
    },

    async _fetchPersonalFeed(cursor = null) {
        const params = new URLSearchParams({ limit: '20' });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`${API_BASE}/api/feed?${params}`, {
            headers: _getAuthHeaders()
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    },

    async _fetchExploreFeed(cursor = null) {
        const params = new URLSearchParams({ limit: '20' });
        if (cursor) params.set('cursor', cursor);

        const res = await fetch(`${API_BASE}/api/feed/explore?${params}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return await res.json();
    }
};

// =========================================================================
// KHỞI TẠO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    NewsFeedManager.init();
});
