/**
 * ========================================================================
 * FILE: profilePosts.js
 * CHỨC NĂNG:
 * - Tải và render danh sách bài viết/lịch trình của người dùng trên trang cá nhân.
 * ========================================================================
 */
// js/profilePosts.js
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { firebaseConfig } from './firebaseConfig.js';

const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

// Khởi tạo Firebase Auth (dùng app đã có nếu tồn tại)
const _fbApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const _fbAuth = getAuth(_fbApp);

// Chờ Firebase Auth xác minh trạng thái đăng nhập
function _waitForFirebaseAuth() {
    return new Promise((resolve) => {
        if (_fbAuth.currentUser) {
            resolve(_fbAuth.currentUser);
            return;
        }
        const unsubscribe = onAuthStateChanged(_fbAuth, (user) => {
            unsubscribe();
            resolve(user);
        });
    });
}

// Lấy fresh token từ Firebase Auth (tự động refresh nếu hết hạn)
async function _getFreshToken() {
    try {
        const user = _fbAuth.currentUser || await _waitForFirebaseAuth();
        if (user) {
            return await user.getIdToken(); // tự động refresh token hết hạn
        }
    } catch (e) {
        console.warn('[TopGo] Không thể lấy Firebase token:', e);
    }
    return null;
}

function onDOMReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

onDOMReady(async () => {
    // Chờ Firebase Auth khởi tạo xong trước khi gọi API
    await _waitForFirebaseAuth();
    initProfilePosts();
});

async function initProfilePosts() {
    const feedContainer = document.getElementById('profile-posts-feed');
    const emptyState = document.getElementById('profile-posts-empty');
    const countEl = document.getElementById('profile-posts-count');
    
    if (!feedContainer || !emptyState) return;

    try {
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        let fetchUrl = `${API_BASE}/api/users/profile/posts`;
        let fetchHeaders = {};
        
        if (userId) {
            // Fetch for a specific user (public endpoint)
            fetchUrl = `${API_BASE}/api/users/${userId}/posts`;
            const token = await _getFreshToken();
            if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            // Fetch for the logged in user (requires auth)
            const token = await _getFreshToken();
            if (!token) return;
            fetchHeaders['Authorization'] = `Bearer ${token}`;
        }

        const res = await fetch(fetchUrl, {
            headers: fetchHeaders
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        let posts = data.posts || [];
        
        if (countEl) {
            countEl.textContent = `${data.total || 0} bài viết`;
        }
        // Also update v2 stats bar
        const v2PostsStat = document.getElementById('pv2-stat-posts');
        if (v2PostsStat) v2PostsStat.textContent = String(data.total || posts.length || 0);

        if (posts.length === 0) {
            emptyState.style.display = 'flex';
        } else {
            emptyState.style.display = 'none';
            
            // Remove existing posts if any
            const existingPosts = feedContainer.querySelectorAll('.post-card');
            existingPosts.forEach(p => p.remove());

            // Render all posts
            posts.forEach(post => {
                if (typeof PostCardRenderer !== 'undefined') {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = PostCardRenderer.render(post);
                    const postCard = tempDiv.firstElementChild;
                    feedContainer.appendChild(postCard);
                }
            });
        }
    } catch (e) {
        console.warn("Lỗi tải bài viết cá nhân:", e);
        if (countEl) countEl.textContent = `0 bài viết`;
        emptyState.style.display = 'flex';
    }
}
