/**
 * ========================================================================
 * FILE: sidebarUtils.js
 * CHỨC NĂNG:
 * - Quản lý và render các widget Sidebar bên phải (Gợi ý theo dõi, Địa điểm nổi bật).
 * ========================================================================
 */
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from './firebaseConfig.js';

const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

const _fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const _fbAuth = getAuth(_fbApp);

function _escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}

function _waitForFirebaseAuth() {
    return new Promise((resolve) => {
        const unsubscribe = _fbAuth.onAuthStateChanged((user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

async function _getAuthHeaders() {
    try {
        let user = _fbAuth.currentUser;
        if (!user) {
            user = await _waitForFirebaseAuth();
        }
        if (user) {
            const token = await user.getIdToken();
            return { 'Authorization': `Bearer ${token}` };
        }
    } catch (e) {
        console.warn('[TopGo] Không thể lấy Firebase token:', e);
    }
    return {};
}

export const HotSearchWidget = {
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
        let list = document.getElementById('hot-search-list');
        if (!list) list = document.querySelector('.hot-search-list'); // fallback for cached HTML
        if (list) {
            list.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--muted); font-size: 13px;">Đang cập nhật xu hướng mới nhất...</div>';
        }
    },

    render(topics) {
        let list = document.getElementById('hot-search-list');
        if (!list) list = document.querySelector('.hot-search-list');
        if (!list || !topics.length) {
            this.hide();
            return;
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

export async function updateSidebarProfile() {
    await _waitForFirebaseAuth();
    
    let userInfo = { fullName: "Khách", email: "", photoURL: "" };
    let userStats = { trips: 0, posts: 0 };
    try {
        const stored = localStorage.getItem('topgo_user');
        if (stored) {
            const parsed = JSON.parse(stored);
            userInfo.fullName = [parsed.lastname, parsed.firstname].filter(Boolean).join(' ').trim() || parsed.fullName || parsed.email || "Khách";
            userInfo.email = parsed.email || "";
            userInfo.photoURL = parsed.photoURL || "";
            userInfo.username = parsed.username || "";
            userInfo.uid = parsed.uid || parsed.id || "";
        }
        
        const storedStats = localStorage.getItem('userStats');
        if (storedStats) userStats = JSON.parse(storedStats);
    } catch(e) {}

    const nameEl = document.getElementById('sp-name');
    const handleEl = document.getElementById('sp-handle');
    const avatarEl = document.getElementById('sp-avatar');

    // Fallback if not logged in and no local data
    if (!_fbAuth.currentUser && (!userInfo.fullName || userInfo.fullName === 'Khách')) {
        if (nameEl) nameEl.textContent = 'Đăng nhập';
        if (handleEl) handleEl.textContent = '@topgo';
        return;
    }

    if (userInfo.fullName && userInfo.fullName !== 'Khách') {
        const fullName = userInfo.fullName;
        if (nameEl) nameEl.textContent = fullName;
        if (handleEl) {
            const handle = userInfo.username || (userInfo.email ? userInfo.email.split('@')[0] : (userInfo.id || userInfo.uid || 'topgo').substring(0, 8));
            handleEl.textContent = `@${handle}`;
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

    if (userInfo.uid) {
        _getAuthHeaders().then(headers => {
            if (!headers['Authorization']) return;
            
            Promise.all([
                fetch(`${API_BASE}/api/plans/list`, { headers }).then(res => res.ok ? res.json() : {plans:[]}),
                fetch(`${API_BASE}/api/users/profile/posts`, { headers }).then(res => res.ok ? res.json() : {posts:[]})
            ]).then(([tripsData, postsData]) => {
                const tripCount = tripsData.plans ? tripsData.plans.length : 0;
                const postCount = postsData.posts ? postsData.posts.length : 0;
                if (tripsEl) tripsEl.textContent = tripCount;
                if (postsEl) postsEl.textContent = postCount;
                localStorage.setItem('userStats', JSON.stringify({ trips: tripCount, posts: postCount }));
            }).catch(err => console.warn('Lỗi tải thống kê:', err));
        });
    }
}

export const SuggestedFollowWidget = {
    async load() {
        let container = document.getElementById('sg-list');
        if (!container) return;

        try {
            // Real-world logic for production
            const res = await fetch(`${API_BASE}/api/users/suggestions?limit=3`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            if (data.users && data.users.length > 0) {
                this.render(data.users);
            } else {
                this.renderFallback();
            }
        } catch (err) {
            console.warn('[TopGo] Suggested Follows API failed, using fallback:', err.message);
            this.renderFallback();
        }
    },

    renderFallback() {
        // Small inline fallback array to avoid bloating mockFallback.js
        const mockUsers = [
            { id: 'topgo', displayName: 'TopGo', handle: 'topgo.vn', trips: 99, posts: 999, avatar: './assets/logo.png', link: './aboutus.html', color: 'linear-gradient(135deg, var(--p1), var(--p2))' }
        ];
        this.render(mockUsers);
    },

    render(users) {
        let container = document.getElementById('sg-list');
        if (!container) return;

        const html = users.map(u => {
            const avatarContent = u.avatar ? `<img src="${_escapeHtml(u.avatar)}" alt="TopGo" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">` : _escapeHtml(u.displayName.charAt(0));
            const targetLink = u.link ? _escapeHtml(u.link) : `./profile.html?userId=${_escapeHtml(u.id)}`;
            
            return `
            <div class="sg-item">
                <a href="${targetLink}" class="sg-avatar" style="background: ${u.color || 'var(--p1)'}; text-decoration:none;">${avatarContent}</a>
                <div class="sg-info">
                    <a href="${targetLink}" class="sg-name" style="text-decoration:none; color:inherit;">${_escapeHtml(u.displayName)}</a>
                    <div class="sg-desc">${u.posts || 0} bài viết · ${u.trips || 0} chuyến đi</div>
                </div>
                ${u.id === 'topgo' 
                    ? `<button class="sg-follow" onclick="window.location.href='./aboutus.html'">Khám phá</button>`
                    : `<button class="sg-follow" onclick="alert('Chức năng theo dõi đang được hoàn thiện!')">Theo dõi</button>`
                }
            </div>
            `;
        }).join('');
        container.innerHTML = html;
    }
};

export const DestinationsWidget = {
    async load(currentLocationId = null) {
        let container = document.getElementById('sd-grid');
        if (!container) return;

        try {
            // Real-world logic for production
            const res = await fetch(`${API_BASE}/api/locations/outstanding?limit=4`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            if (data.locations && data.locations.length > 0) {
                let locs = data.locations.filter(l => l.id !== currentLocationId && l.name !== currentLocationId);
                this.render(locs.slice(0, 4));
            } else {
                this.renderFallback(currentLocationId);
            }
        } catch (err) {
            console.warn('[TopGo] Destinations API failed, using fallback:', err.message);
            this.renderFallback(currentLocationId);
        }
    },

    renderFallback(currentLocationId) {
        let mocks = [
            { id: 'dalat', name: 'Đà Lạt', img: 'https://images.unsplash.com/photo-1597505191845-a7ee5fdf687a?w=300&q=80' },
            { id: 'danang', name: 'Đà Nẵng', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=300&q=80' },
            { id: 'sapa', name: 'Sa Pa', img: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=300&q=80' },
            { id: 'hoian', name: 'Hội An', img: 'https://images.unsplash.com/photo-1588614959060-4d144f28b2ea?w=300&q=80' },
            { id: 'hanoi', name: 'Hà Nội', img: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=300&q=80' }
        ];
        
        mocks = mocks.filter(l => l.id !== currentLocationId && l.name !== currentLocationId).slice(0, 4);
        this.render(mocks);
    },

    render(locations) {
        let container = document.getElementById('sd-grid');
        if (!container) return;

        const html = locations.map(loc => `
            <a href="./location.html?name=${encodeURIComponent(loc.name || '')}" class="sd-card" style="background: url('${_escapeHtml(loc.img || loc.image)}') center/cover;">
                <span class="sd-name">${_escapeHtml(loc.name)}</span>
            </a>
        `).join('');
        container.innerHTML = html;
    }
};
