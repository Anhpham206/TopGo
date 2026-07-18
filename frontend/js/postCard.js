/**
 * ========================================================================
 * FILE: postCard.js
 * CHỨC NĂNG:
 * - Render giao diện bài viết (Post Card) chung cho Bảng tin và Hồ sơ.
 * ========================================================================
 */
// js/postCard.js
// Shared PostCardRenderer logic for rendering posts

function _timeAgo(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diff = (now - date) / 1000; // seconds
        
        if (diff < 60) return 'Vừa xong';
        if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
        if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
        if (diff < 604800) return `${Math.floor(diff / 86400)} ngày trước`;
        
        return date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch (e) {
        return '';
    }
}

function _escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function _formatContent(text) {
    if (!text) return '';
    // Escape HTML first
    let safe = _escapeHtml(text);
    // Highlight hashtags
    safe = safe.replace(/#(\w+)/g, '<span class="post-hashtag">#$1</span>');
    // Line breaks
    safe = safe.replace(/\n/g, '<br>');
    return safe;
}

function _formatNumber(num) {
    if (!num || num === 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
}

const PostCardRenderer = {
    render(post) {
        // Cập nhật cache bài đăng
        if (typeof window._renderedPostsCache === 'undefined') {
            window._renderedPostsCache = new Map();
        }
        if (post && post.id) {
            window._renderedPostsCache.set(post.id, post);
        }

        const authorName = post.authorName || 'Người dùng TopGo';
        const authorPhoto = post.authorPhotoUrl || '';
        const initial = authorName.charAt(0).toUpperCase();
        const timeAgo = _timeAgo(post.createdAt);

        // Avatar
        const avatarHtml = (authorPhoto && authorPhoto !== 'undefined' && authorPhoto !== 'null')
            ? `<a href="./profile.html?userId=${_escapeHtml(post.authorId || '')}"><img class="post-avatar" src="${_escapeHtml(authorPhoto)}" alt="${_escapeHtml(authorName)}" onerror="this.outerHTML='<div class=\\'post-avatar-placeholder\\'>${initial}</div>'"></a>`
            : `<a href="./profile.html?userId=${_escapeHtml(post.authorId || '')}" style="text-decoration:none; color:inherit"><div class="post-avatar-placeholder">${initial}</div></a>`;

        // Media grid
        const mediaHtml = this._renderMedia(post.mediaUrls || []);

        // Itinerary card
        const itineraryHtml = this._renderItinerary(post.itinerary);

        // Tagged locations
        const locationsHtml = this._renderLocations(post.taggedLocations || []);

        // Actions
        const likeCount = post.likeCount || 0;
        const commentCount = post.commentCount || 0;

        // Kiểm tra quyền sở hữu để hiển thị nút tùy chọn
        let currentUserUid = null;
        try {
            const userStr = localStorage.getItem('topgo_user');
            if (userStr) {
                const u = JSON.parse(userStr);
                currentUserUid = u.uid;
            }
        } catch (e) {}

        const isOwner = currentUserUid && (post.authorId === currentUserUid);
        const moreBtnHtml = isOwner 
            ? `<button class="post-more-btn" title="Thêm tùy chọn">⋯</button>` 
            : '';

        return `
        <article class="post-card" data-post-id="${_escapeHtml(post.id || '')}">
            <div class="post-header" data-user-id="${_escapeHtml(post.authorId || '')}" data-user-name="${_escapeHtml(authorName)}" data-user-avatar="${_escapeHtml(authorPhoto)}">
                ${avatarHtml}
                <div class="post-author-info">
                    <a href="./profile.html?userId=${_escapeHtml(post.authorId || '')}" class="post-author-name" style="text-decoration:none; color:inherit;">${_escapeHtml(authorName)}</a>
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
                ${moreBtnHtml}
            </div>

            ${post.content ? `<div class="post-content">${_formatContent(post.content)}</div>` : ''}
            ${mediaHtml}
            ${itineraryHtml}
            ${locationsHtml}

            <div class="post-actions">
                <button class="post-action-btn" data-action="like" data-post-id="${_escapeHtml(post.id || '')}">
                    <span class="action-icon">♡</span>
                    <span class="action-count">${_formatNumber(likeCount)}</span>
                </button>
                <button class="post-action-btn" data-action="comment" data-post-id="${_escapeHtml(post.id || '')}">
                    <span class="action-count">${_formatNumber(commentCount)} bình luận</span>
                </button>
                <button class="post-action-btn" data-action="share" data-post-id="${_escapeHtml(post.id || '')}">
                    <span class="action-icon">↗</span>
                    <span class="action-count">Chia sẻ</span>
                </button>
            </div>
        </article>`;
    },

    _renderMedia(mediaUrls) {
        if (!mediaUrls || mediaUrls.length === 0) return '';

        const displayUrls = mediaUrls.slice(0, 4);
        const gridClass = `grid-${Math.min(displayUrls.length, 4)}`;
        const remaining = mediaUrls.length - 4;

        let itemsHtml = displayUrls.map((url, idx) => {
            const isLast = idx === 3 && remaining > 0;
            return `
            <div class="post-media-item">
                <img src="${_escapeHtml(url)}" alt="Ảnh bài đăng" loading="lazy">
                ${isLast ? `<div class="post-media-more">+${remaining}</div>` : ''}
            </div>`;
        }).join('');

        return `
        <div class="post-media">
            <div class="post-media-grid ${gridClass}">
                ${itemsHtml}
            </div>
        </div>`;
    },

    _renderItinerary(itinerary) {
        if (!itinerary) return '';

        const dest = itinerary.destination || 'Lịch trình du lịch';
        const days = itinerary.days || 0;
        const budget = itinerary.budget || 0;

        const budgetStr = budget > 0
            ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(budget)
            : '';

        return `
        <div class="post-itinerary" data-itinerary-id="${_escapeHtml(itinerary.id || '')}">
            <div class="post-itinerary-info">
                <div class="post-itinerary-title">${_escapeHtml(dest)}</div>
                <div class="post-itinerary-meta">
                    ${days > 0 ? `<span>${days} ngày</span>` : ''}
                    ${budgetStr ? `<span>${budgetStr}</span>` : ''}
                </div>
            </div>
            <span class="post-itinerary-arrow">→</span>
        </div>`;
    },

    _renderLocations(locations) {
        if (!locations || locations.length === 0) return '';

        const tags = locations.map(loc =>
            `<span class="post-location-tag">${_escapeHtml(loc)}</span>`
        ).join('');

        return `<div class="post-locations">${tags}</div>`;
    }
};

// Khởi tạo tính năng Toast dự phòng nếu chưa có
if (typeof window.showToast === 'undefined') {
    window.showToast = function(msg, type) {
        const t = document.getElementById('toast'), tm = document.getElementById('toast-msg');
        if (!t || !tm) {
            alert(msg);
            return;
        }
        tm.textContent = msg;
        t.className = 'toast show ' + (type || '');
        setTimeout(() => { t.className = 'toast'; }, 3200);
    };
}

// Global Event Delegation cho menu tùy chọn bài viết
document.addEventListener('click', async (e) => {
    // 1. Nhấn nút ⋯ mở menu
    const moreBtn = e.target.closest('.post-more-btn');
    if (moreBtn) {
        e.stopPropagation();
        // Đóng các menu khác trước
        document.querySelectorAll('.post-dropdown-menu').forEach(m => m.remove());

        const postCard = moreBtn.closest('.post-card');
        const postId = postCard?.dataset.postId;
        if (!postId) return;

        // Render dropdown menu
        const dropdown = document.createElement('div');
        dropdown.className = 'post-dropdown-menu';
        dropdown.innerHTML = `
            <button class="dropdown-item" data-action="edit-post" data-post-id="${postId}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                <span>Chỉnh sửa bài viết</span>
            </button>
            <button class="dropdown-item danger" data-action="delete-post" data-post-id="${postId}">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                <span>Xóa bài viết</span>
            </button>
        `;
        moreBtn.parentElement.appendChild(dropdown);
        return;
    }

    // Đóng menu khi click ra ngoài
    if (!e.target.closest('.post-dropdown-menu')) {
        document.querySelectorAll('.post-dropdown-menu').forEach(m => m.remove());
    }

    // 2. Nhấn nút Xóa bài viết
    const deleteBtn = e.target.closest('[data-action="delete-post"]');
    if (deleteBtn) {
        const postId = deleteBtn.dataset.postId;
        if (!postId) return;

        const confirmDelete = confirm("Bạn có chắc chắn muốn xóa bài viết này không?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem('topgo_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
            const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
            const apiBase = isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

            const res = await fetch(`${apiBase}/api/posts/${postId}`, {
                method: 'DELETE',
                headers: headers
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `HTTP ${res.status}`);
            }

            // Xóa post card khỏi DOM
            const postCard = document.querySelector(`.post-card[data-post-id="${postId}"]`);
            if (postCard) {
                postCard.style.transition = 'all 0.3s ease';
                postCard.style.opacity = '0';
                postCard.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    postCard.remove();
                    
                    // Cập nhật số đếm bài viết trên trang cá nhân nếu có
                    const countEl = document.getElementById('profile-posts-count');
                    if (countEl) {
                        const countVal = parseInt(countEl.textContent) || 0;
                        countEl.textContent = `${Math.max(0, countVal - 1)} bài viết`;
                    }
                    const v2PostsStat = document.getElementById('pv2-stat-posts');
                    if (v2PostsStat) {
                        const statVal = parseInt(v2PostsStat.textContent) || 0;
                        v2PostsStat.textContent = String(Math.max(0, statVal - 1));
                    }
                }, 300);
            }

            window.showToast('Xóa bài viết thành công!', 'success');
        } catch (err) {
            console.error('Lỗi khi xóa bài viết:', err);
            window.showToast('Lỗi: ' + err.message, 'error');
        }
        return;
    }

    // 3. Nhấn nút Chỉnh sửa bài viết
    const editBtn = e.target.closest('[data-action="edit-post"]');
    if (editBtn) {
        const postId = editBtn.dataset.postId;
        if (!postId) return;

        const cachedPost = window._renderedPostsCache?.get(postId);
        if (!cachedPost) {
            window.showToast('Không tìm thấy dữ liệu bài viết trong cache', 'error');
            return;
        }

        _showEditPostModal(cachedPost);
        return;
    }

    // 4. Nhấn vào ảnh để xem full màn hình (Lightbox)
    const mediaImg = e.target.closest('.post-media-item img');
    if (mediaImg) {
        _showImageViewer(mediaImg.src);
        return;
    }
});

// Hàm hiển thị Image Viewer (Lightbox)
function _showImageViewer(imgSrc) {
    let overlay = document.getElementById('post-image-viewer');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'post-image-viewer';
        overlay.className = 'post-image-viewer-overlay';
        overlay.innerHTML = `
            <button class="post-image-viewer-close">&times;</button>
            <img class="post-image-viewer-img" src="" alt="Full view">
        `;
        document.body.appendChild(overlay);

        // Đóng khi click ra ngoài ảnh hoặc nút close
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay || e.target.closest('.post-image-viewer-close')) {
                overlay.classList.remove('open');
            }
        });
    }

    const imgEl = overlay.querySelector('.post-image-viewer-img');
    imgEl.src = imgSrc;
    // Trigger reflow
    void overlay.offsetWidth;
    overlay.classList.add('open');
}

// Hàm hiển thị Modal chỉnh sửa bài viết
function _showEditPostModal(post) {
    let modalOverlay = document.getElementById('post-edit-modal-overlay');
    if (modalOverlay) modalOverlay.remove();

    modalOverlay = document.createElement('div');
    modalOverlay.id = 'post-edit-modal-overlay';
    modalOverlay.className = 'post-edit-overlay';
    
    const locations = [...(post.taggedLocations || [])];
    
    modalOverlay.innerHTML = `
        <div class="post-edit-card glass-card">
            <div class="post-edit-header">
                <h2>Chỉnh sửa bài viết</h2>
                <button class="post-edit-close" id="edit-modal-close">&times;</button>
            </div>
            <div class="post-edit-body">
                <textarea class="post-edit-textarea" id="edit-modal-textarea" placeholder="Bạn đang nghĩ gì về chuyến đi?">${post.content || ''}</textarea>
                
                <div class="post-edit-locations-wrap">
                    <label class="label-sm" style="font-size:11px;font-weight:600;color:var(--muted)">Địa điểm đã gắn thẻ (tối đa 5)</label>
                    <div class="post-edit-locations-list" id="edit-modal-locations-list">
                        ${locations.map((loc, idx) => `
                            <span class="post-edit-loc-tag" data-index="${idx}">
                                <span>${loc}</span>
                                <button type="button" class="btn-remove-loc" data-index="${idx}">✕</button>
                            </span>
                        `).join('')}
                    </div>
                    <div class="post-edit-loc-input-row" style="margin-top: 8px;">
                        <input type="text" class="post-edit-loc-input" id="edit-modal-loc-input" placeholder="Nhập tên địa điểm mới..." maxlength="60">
                        <button type="button" class="post-edit-btn-add-loc" id="edit-modal-btn-add-loc">Thêm</button>
                    </div>
                </div>
            </div>
            <div class="post-edit-footer">
                <button class="post-edit-btn-cancel" id="edit-modal-cancel">Hủy</button>
                <button class="post-edit-btn-save" id="edit-modal-save">Lưu thay đổi</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Fade-in Modal
    setTimeout(() => {
        modalOverlay.classList.add('open');
    }, 10);

    const textarea = document.getElementById('edit-modal-textarea');
    const saveBtn = document.getElementById('edit-modal-save');
    const locInput = document.getElementById('edit-modal-loc-input');
    const addLocBtn = document.getElementById('edit-modal-btn-add-loc');
    const locListEl = document.getElementById('edit-modal-locations-list');

    const updateSaveState = () => {
        const hasContent = textarea.value.trim().length > 0;
        saveBtn.disabled = !hasContent;
    };

    textarea.addEventListener('input', updateSaveState);
    updateSaveState();

    const renderLocationsList = () => {
        locListEl.innerHTML = locations.map((loc, idx) => `
            <span class="post-edit-loc-tag" data-index="${idx}">
                <span>${loc}</span>
                <button type="button" class="btn-remove-loc" data-index="${idx}">✕</button>
            </span>
        `).join('');
    };

    locListEl.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.btn-remove-loc');
        if (removeBtn) {
            const idx = parseInt(removeBtn.dataset.index);
            locations.splice(idx, 1);
            renderLocationsList();
        }
    });

    const addLocation = () => {
        const val = locInput.value.trim();
        if (!val) return;
        if (locations.length >= 5) {
            window.showToast('Gắn thẻ tối đa 5 địa điểm', 'warning');
            return;
        }
        if (locations.includes(val)) {
            window.showToast('Địa điểm này đã được gắn thẻ', 'warning');
            return;
        }
        locations.push(val);
        locInput.value = '';
        renderLocationsList();
    };

    addLocBtn.addEventListener('click', addLocation);
    locInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addLocation();
        }
    });

    const closeModal = () => {
        modalOverlay.classList.remove('open');
        setTimeout(() => {
            modalOverlay.remove();
        }, 300);
    };

    document.getElementById('edit-modal-close').addEventListener('click', closeModal);
    document.getElementById('edit-modal-cancel').addEventListener('click', closeModal);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });

    saveBtn.addEventListener('click', async () => {
        saveBtn.disabled = true;
        saveBtn.textContent = 'Đang lưu...';

        try {
            const token = localStorage.getItem('topgo_token');
            const headers = {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            };
            const isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
            const apiBase = isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

            const body = {
                content: textarea.value.trim(),
                mediaUrls: post.mediaUrls || [],
                taggedLocations: locations,
                itineraryId: post.itineraryId || (post.itinerary ? post.itinerary.id : null)
            };

            const res = await fetch(`${apiBase}/api/posts/${post.id}`, {
                method: 'PUT',
                headers: headers,
                body: JSON.stringify(body)
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.detail || `HTTP ${res.status}`);
            }

            const updatedPost = await res.json();
            
            // Cập nhật cache
            window._renderedPostsCache?.set(post.id, updatedPost);

            // Cập nhật DOM trực tiếp
            const postCard = document.querySelector(`.post-card[data-post-id="${post.id}"]`);
            if (postCard) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = PostCardRenderer.render(updatedPost);
                const newCard = tempDiv.firstElementChild;
                if (newCard) {
                    postCard.replaceWith(newCard);
                }
            }

            window.showToast('Cập nhật bài viết thành công!', 'success');
            closeModal();
        } catch (err) {
            console.error('Lỗi khi cập nhật bài viết:', err);
            window.showToast('Lỗi: ' + err.message, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = 'Lưu thay đổi';
        }
    });
}

