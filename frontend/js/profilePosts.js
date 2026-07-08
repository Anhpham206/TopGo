// js/profilePosts.js
const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

document.addEventListener('DOMContentLoaded', () => {
    // Inject basic feed styling
    const style = document.createElement('style');
    style.textContent = `
        .profile-posts-feed {
            display: flex;
            flex-direction: column;
            gap: 20px;
            margin-top: 24px;
            max-width: 680px;
            margin-left: auto;
            margin-right: auto;
        }
    `;
    document.head.appendChild(style);

    initProfilePosts();
});

async function initProfilePosts() {
    const feedContainer = document.getElementById('profile-posts-feed');
    const emptyState = document.getElementById('profile-posts-empty');
    const countEl = document.getElementById('profile-posts-count');
    
    if (!feedContainer || !emptyState) return;

    try {
        const token = localStorage.getItem('topgo_token');
        
        const urlParams = new URLSearchParams(window.location.search);
        const userId = urlParams.get('userId');
        
        let fetchUrl = `${API_BASE}/api/users/profile/posts`;
        let fetchHeaders = {};
        
        if (userId) {
            // Fetch for a specific user
            fetchUrl = `${API_BASE}/api/users/${userId}/posts`;
            if (token) fetchHeaders['Authorization'] = `Bearer ${token}`;
        } else {
            // Fetch for the logged in user
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
