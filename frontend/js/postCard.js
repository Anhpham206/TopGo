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
        const authorName = post.authorName || 'Người dùng TopGo';
        const authorPhoto = post.authorPhotoUrl || '';
        const initial = authorName.charAt(0).toUpperCase();
        const timeAgo = _timeAgo(post.createdAt);

        // Avatar
        const avatarHtml = authorPhoto
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

        return `
        <article class="post-card" data-post-id="${_escapeHtml(post.id || '')}">
            <div class="post-header" data-user-id="${_escapeHtml(post.authorId || '')}" data-user-name="${_escapeHtml(authorName)}" data-user-avatar="${_escapeHtml(authorPhoto)}">
                ${avatarHtml}
                <div class="post-author-info">
                    <a href="./profile.html?userId=${_escapeHtml(post.authorId || '')}" class="post-author-name" style="text-decoration:none; color:inherit;">${_escapeHtml(authorName)}</a>
                    <div class="post-timestamp">${timeAgo}</div>
                </div>
                <button class="post-more-btn" title="Thêm tùy chọn">⋯</button>
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
