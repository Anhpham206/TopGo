/**
 * ========================================================================
 * FILE: location.js
 * CHỨC NĂNG:
 * - Khởi tạo và tải dữ liệu trang chi tiết địa điểm.
 * ========================================================================
 */


import { loadSharedComponents } from "./shared.js";
import { HotSearchWidget, updateSidebarProfile, SuggestedFollowWidget, DestinationsWidget } from "./sidebarUtils.js";

const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

function onDOMReady(fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
}

onDOMReady(async () => {
    // Load Header & Footer & remove FOUC class
    try { await loadSharedComponents(); } catch(e) { console.warn(e); }
    
    
    // Init Location Posts
    initLocationPosts();

    // Init Sidebar (Profile & Hot Search)
    updateSidebarProfile();
    HotSearchWidget.load();
    SuggestedFollowWidget.load();
    const urlParams = new URLSearchParams(window.location.search);
    const locationName = urlParams.get('name');
    DestinationsWidget.load(locationName);
});

async function initLocationPosts() {
    const urlParams = new URLSearchParams(window.location.search);
    const locationName = urlParams.get('name') || "Chưa xác định";
    
    // Set banner info
    document.getElementById('location-name-display').textContent = locationName;
    document.title = `${locationName} — TopGo Social`;

    const feedContainer = document.getElementById('feed-content');
    const emptyState = document.getElementById('feed-empty');
    const skeleton = document.getElementById('feed-skeleton');
    const postCountEl = document.getElementById('location-post-count');
    
    if (!feedContainer || !emptyState) return;

    try {
        if (skeleton) skeleton.style.display = 'block';

        const res = await fetch(`${API_BASE}/api/locations/${encodeURIComponent(locationName)}/posts`);
        
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        let posts = data.posts || [];
        
        if (postCountEl) {
            postCountEl.textContent = `${data.total || 0} bài viết`;
        }

        if (skeleton) skeleton.style.display = 'none';



        if (posts.length === 0) {
            emptyState.style.display = 'block';
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
        console.warn("Lỗi tải bài viết theo địa điểm:", e);
        if (skeleton) skeleton.style.display = 'none';
        if (postCountEl) postCountEl.textContent = `0 bài viết`;
        emptyState.style.display = 'block';
    }
}
