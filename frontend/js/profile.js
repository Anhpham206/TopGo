/*
  ========================================================================
  FILE: profile.js
  CHỨC NĂNG:
  - Điều khiển logic hiển thị thông tin trang cá nhân.
  - Hỗ trợ chế độ cá nhân (chủ sở hữu) và chế độ khách truy cập (xem hồ sơ người khác).
  - Gọi các APIs follow/unfollow, lấy công khai profile, và danh sách lịch trình tương ứng.
  - Hỗ trợ phân tách các Tab: Lịch trình du lịch & Bài viết cá nhân (dùng stub).
  ========================================================================
*/
import { showToast, showPopup, closePopup } from './shared.js';
import { renderPostCard } from './post.js';

const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

// Helper cập nhật text toàn cục
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val || '—';
}

document.addEventListener('DOMContentLoaded', async () => {
    const params = new URLSearchParams(window.location.search);
    const targetUid = params.get('uid');
    
    const loggedInUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;

    // Kiểm tra xem targetUid có phải là mã hộ chiếu rút gọn (TG-XXXXXXXX) của chính mình không
    let isOwnProfile = !targetUid;
    if (!isOwnProfile && loggedInUser) {
        if (loggedInUser.uid === targetUid) {
            isOwnProfile = true;
        } else if (targetUid.toUpperCase().startsWith('TG-') && targetUid.length <= 11) {
            // So sánh mã hộ chiếu rút gọn với UID đầy đủ
            const shortId = targetUid.slice(3).toUpperCase();
            isOwnProfile = loggedInUser.uid.toUpperCase().startsWith(shortId);
        }
    }
    
    // Nếu không xem profile người khác và chưa đăng nhập -> chuyển hướng
    if (!isOwnProfile && !loggedInUser && !targetUid) {
        window.location.href = './auth.html';
        return;
    }
    if (isOwnProfile && !loggedInUser) {
        window.location.href = './auth.html';
        return;
    }

    const uid = isOwnProfile ? loggedInUser.uid : targetUid;

    // Khởi động giao diện & tải dữ liệu
    await initProfile(uid, isOwnProfile, loggedInUser);
    setupTabs(uid, isOwnProfile);
});

// Khởi tạo trang cá nhân
async function initProfile(uid, isOwnProfile, loggedInUser) {
    const editBtn = document.getElementById('btn-edit-profile');
    const logoutBtn = document.getElementById('btn-logout');
    const followBtn = document.getElementById('btn-follow');
    const photoEditBtn = document.getElementById('pp-photo-edit');
    const avatarInput = document.getElementById('pp-avatar-input');

    if (isOwnProfile) {
        // Chế độ CHỦ SỞ HỮU
        if (editBtn) { editBtn.classList.remove('hidden'); editBtn.style.display = 'flex'; }
        if (logoutBtn) { logoutBtn.classList.remove('hidden'); logoutBtn.style.display = 'flex'; }
        if (followBtn) { followBtn.classList.add('hidden'); followBtn.style.display = 'none'; }
        if (photoEditBtn) { photoEditBtn.classList.remove('hidden'); photoEditBtn.style.display = 'flex'; }

        // Render UI ban đầu từ local storage
        updateUI(loggedInUser);

        // Lắng nghe sự thay đổi auth (khi auth.js tải xong profile từ backend)
        window.addEventListener('topgo-auth-change', () => {
            const freshUser = window.TopGoAuth.getUser();
            if (freshUser) {
                updateUI(freshUser);
            }
        });

        // Đăng xuất
        logoutBtn?.addEventListener('click', async () => {
            if (window.TopGoAuth) {
                await window.TopGoAuth.logout();
                window.location.href = './auth.html';
            }
        });

        // Chỉnh sửa hồ sơ
        const overlay = document.getElementById('pp-edit-overlay');
        editBtn?.addEventListener('click', () => {
            const user = window.TopGoAuth.getUser() || {};
            document.getElementById('edit-lastname').value = user.lastname || '';
            document.getElementById('edit-firstname').value = user.firstname || '';
            document.getElementById('edit-dob').value = user.dob || '';
            document.getElementById('edit-sex').value = user.sex || '';
            document.getElementById('edit-pob').value = user.pob || '';
            document.getElementById('edit-nationality').value = user.nationality || '';
            overlay.classList.remove('hidden');
        });
        document.getElementById('pp-edit-close')?.addEventListener('click', () => overlay.classList.add('hidden'));
        document.getElementById('btn-edit-cancel')?.addEventListener('click', () => overlay.classList.add('hidden'));
        overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

        document.getElementById('btn-edit-save')?.addEventListener('click', async () => {
            const updated = await window.TopGoAuth.updateProfile({
                lastname: document.getElementById('edit-lastname').value.trim(),
                firstname: document.getElementById('edit-firstname').value.trim(),
                dob: document.getElementById('edit-dob').value,
                sex: document.getElementById('edit-sex').value,
                pob: document.getElementById('edit-pob').value.trim(),
                nationality: document.getElementById('edit-nationality').value.trim(),
            });
            if (updated) window.location.reload();
        });

        // Xử lý upload avatar
        photoEditBtn?.addEventListener('click', () => avatarInput?.click());
        avatarInput?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = async () => {
                    const canvas = document.createElement('canvas');
                    const max_size = 150;
                    let width = img.width, height = img.height;
                    if (width > height) {
                        if (width > max_size) { height *= max_size / width; width = max_size; }
                    } else {
                        if (height > max_size) { width *= max_size / height; height = max_size; }
                    }
                    canvas.width = width; canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const base64Str = canvas.toDataURL('image/jpeg', 0.85);
                    try {
                        await window.TopGoAuth.updateProfile({ photoURL: base64Str });
                        window.location.reload();
                    } catch (err) {
                        showToast("Không thể cập nhật ảnh đại diện: " + err.message, "error");
                    }
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Tải mạng lưới follow
        loadFollowNetwork(uid);

        // Tải lịch trình cá nhân
        loadUserPlans(uid, true);

    } else {
        // Chế độ KHÁCH TRUY CẬP
        if (editBtn) { editBtn.classList.add('hidden'); editBtn.style.display = 'none'; }
        if (logoutBtn) { logoutBtn.classList.add('hidden'); logoutBtn.style.display = 'none'; }
        if (followBtn) { followBtn.classList.remove('hidden'); followBtn.style.display = 'flex'; }
        if (photoEditBtn) { photoEditBtn.classList.add('hidden'); photoEditBtn.style.display = 'none'; }

        // Tải profile công khai
        let publicProfile = null;
        try {
            const headers = {};
            if (loggedInUser && window.TopGoAuth) {
                const token = await window.TopGoAuth.getIdToken();
                if (token) headers['Authorization'] = `Bearer ${token}`;
            }
            const res = await fetch(`${API_BASE}/api/users/${uid}/public-profile`, { headers });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            publicProfile = await res.json();
        } catch (err) {
            console.error("Lỗi khi tải profile công khai:", err);
            showToast("Không thể tải thông tin người dùng", "error");
            return;
        }

        // Render UI khách
        updateUI(publicProfile);

        // Cập nhật trạng thái nút Follow
        updateFollowButton(publicProfile.is_following);

        // Sự kiện nút Follow/Unfollow
        followBtn?.addEventListener('click', async () => {
            if (!loggedInUser) {
                showToast("Vui lòng đăng nhập để theo dõi người dùng này.", "warning");
                if (window.TopGoAuth) showPopup('popup-login');
                return;
            }

            followBtn.disabled = true;
            const isFollowing = followBtn.classList.contains('following');
            const endpoint = isFollowing ? 'unfollow' : 'follow';
            try {
                const token = await window.TopGoAuth.getIdToken();
                const res = await fetch(`${API_BASE}/api/users/${uid}/${endpoint}`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                
                // Toggle trạng thái UI
                const nextState = !isFollowing;
                updateFollowButton(nextState);
                
                // Cập nhật live số lượng followers
                const followersEl = document.getElementById('pp-followers');
                if (followersEl) {
                    let currentCount = parseInt(followersEl.textContent) || 0;
                    followersEl.textContent = String(nextState ? currentCount + 1 : Math.max(0, currentCount - 1));
                }
                showToast(nextState ? "Đã theo dõi người dùng này." : "Đã hủy theo dõi.", "success");
            } catch (err) {
                showToast("Lỗi: " + err.message, "error");
            } finally {
                followBtn.disabled = false;
            }
        });

        // Bỏ tải lịch trình công khai ở chế độ khách (bảo mật)
    }
}

// Cập nhật các thông tin cơ bản lên Passport UI
function updateUI(user) {
    if (!user) return;
    const fullname = `${user.lastname || ''} ${user.firstname || ''}`.trim() || user.displayName || user.username || 'Thành viên TopGo';
    const fullnameDisplay = user.is_vip ? `${fullname} 👑 (VIP)` : fullname;
    
    const fullnameEl = document.getElementById('pp-fullname');
    if (fullnameEl) fullnameEl.innerHTML = fullnameDisplay;

    setText('pp-nationality', user.nationality);
    setText('pp-sex', user.sex);
    setText('pp-dob', user.dob);
    setText('pp-pob', user.pob);
    setText('pp-email', user.email || 'Ẩn bảo mật');
    setText('pp-doi', user.createdAt);

    const passportNo = user.is_vip ? `${user.uid.slice(0, 8)} (VIP)` : user.uid ? user.uid.slice(0, 8) : 'TG-000000';
    setText('pp-passport-no', `TG-${passportNo.toUpperCase()}`);

    // Render ảnh đại diện
    const photoEl = document.getElementById('pp-photo');
    if (photoEl) {
        const borderStyle = user.is_vip ? 'border: 3px solid #ffb347; box-shadow: 0 0 10px rgba(255,179,71,0.5);' : '';
        const url = user.photoURL || user.photoUrl;
        if (url) {
            photoEl.innerHTML = `<img src="${url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px; ${borderStyle}">`;
        } else {
            photoEl.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="pp-photo-placeholder" style="${borderStyle}">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
            </svg>`;
        }
    }

    // Vẽ MRZ giả lập hộ chiếu
    const mrzEl = document.getElementById('pp-mrz');
    if (mrzEl) {
        const lastname = (user.lastname || 'TOPGO').toUpperCase().replace(/\s/g, '<');
        const firstname = (user.firstname || 'TRAVELER').toUpperCase().replace(/\s/g, '<');
        const line1 = `P<VNM<${lastname}<<${firstname}`.padEnd(44, '<').replace(/</g, '&lt;');
        
        const dobStr = (user.dob || '000000').replace(/-/g, '').slice(-6); 
        const sexStr = (user.sex === 'Nam' ? 'M' : (user.sex === 'Nữ' ? 'F' : '<'));
        const idStr = user.uid ? `TG${user.uid.slice(0, 6)}`.toUpperCase() : 'TG000000';
        const line2 = `${idStr.padEnd(9, '<')}0VNM${dobStr.padEnd(6, '<')}0${sexStr}${'<'.repeat(7)}`.padEnd(44, '<').replace(/</g, '&lt;');
        
        mrzEl.innerHTML = `${line1}<br>${line2}`;
    }

    // Cập nhật số lượng followers / following (nếu có trong dữ liệu, ví dụ từ public-profile API)
    if (user.followers_count !== undefined) {
        setText('pp-followers', String(Math.round(user.followers_count) || 0));
    }
    if (user.following_count !== undefined) {
        setText('pp-following', String(Math.round(user.following_count) || 0));
    }
}

// Cập nhật trạng thái nút Follow
function updateFollowButton(isFollowing) {
    const followBtn = document.getElementById('btn-follow');
    if (!followBtn) return;
    if (isFollowing) {
        followBtn.classList.add('following');
        followBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg> Đang theo dõi
        `;
        followBtn.style.background = "rgba(0, 169, 255, 0.15)";
        followBtn.style.color = "#00a9ff";
        followBtn.style.border = "1px solid #00a9ff";
    } else {
        followBtn.classList.remove('following');
        followBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <line x1="19" y1="8" x2="19" y2="14"/>
                <line x1="22" y1="11" x2="16" y2="11"/>
            </svg> Theo dõi
        `;
        followBtn.style.background = "linear-gradient(135deg, #00a9ff 0%, #0077ff 100%)";
        followBtn.style.color = "#fff";
        followBtn.style.border = "none";
    }
}

// Tải số lượng follow
async function loadFollowNetwork(uid) {
    try {
        const res = await fetch(`${API_BASE}/api/users/${uid}/network-count`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        setText('pp-followers', String(data.followers_count || 0));
        setText('pp-following', String(data.following_count || 0));
    } catch (e) {
        console.warn("Lỗi tải mạng lưới follow:", e);
    }
}

// Tải lịch trình hiển thị trên Visa Stamps
async function loadUserPlans(uid, isOwn) {
    let trips = [];
    try {
        const headers = {};
        if (window.TopGoAuth && window.TopGoAuth.isLoggedIn()) {
            const token = await window.TopGoAuth.getIdToken();
            if (token) headers['Authorization'] = `Bearer ${token}`;
        }
        
        // Gọi API lấy danh sách plans (nếu là chủ sở hữu, trả về toàn bộ; nếu là khách, chỉ trả về public)
        const res = await fetch(`${API_BASE}/api/users/${uid}/plans`, { headers });
        if (!res.ok) throw new Error("HTTP " + res.status);
        trips = await res.json();
    } catch (e) {
        console.warn("Lỗi khi tải lịch trình từ server:", e);
    }

    setText('pp-trips', String(trips.length));
    setText('stamps-count', `${trips.length} chuyến`);

    renderTrips(trips, uid, isOwn);
    setupFilters(trips, uid, isOwn);
}

// Render các chuyến đi
function renderTrips(trips, profileOwnerUid, isOwn) {
    const grid = document.getElementById('stamps-grid');
    const empty = document.getElementById('stamps-empty');
    if (!grid) return;

    // Xóa card cũ
    grid.querySelectorAll('.stamp-card').forEach(card => card.remove());

    if (trips.length === 0) {
        if (empty) {
            empty.style.display = '';
            const cta = empty.querySelector('.stamps-empty-cta');
            if (cta) cta.style.display = isOwn ? '' : 'none'; // Ẩn cta tạo lịch trình nếu không phải chủ
        }
        return;
    }
    if (empty) empty.style.display = 'none';

    trips.forEach(trip => {
        const card = document.createElement('div');
        card.className = 'stamp-card';
        // Hiển thị trạng thái visibility nếu là chủ sở hữu
        const visibilityTag = isOwn ? `<span class="stamp-tag visibility">${trip.visibility === 'private' ? 'Riêng tư' : trip.visibility === 'unlisted' ? 'Ẩn' : 'Công khai'}</span>` : '';
        
        card.innerHTML = `
            <div class="stamp-main-info">
                <div class="stamp-dest-wrap">
                    <div class="stamp-dest">${trip.destination || 'Chuyến đi'}</div>
                </div>
                <div class="stamp-meta">
                    <span class="stamp-tag">${trip.days || '?'} ngày</span>
                    <span class="stamp-tag">${trip.pax || '?'} người</span>
                    ${trip.budget ? `<span class="stamp-tag">${Number(trip.budget).toLocaleString('vi-VN')}₫</span>` : ''}
                    ${visibilityTag}
                </div>
            </div>
            <div class="stamp-date">${trip.dateStart || ''} → ${trip.dateEnd || ''}</div>
            <div class="stamp-actions">
                ${isOwn ? `<button class="stamp-btn" data-share="${trip.id}" style="color: var(--p1); border-color: var(--p1);">Chia sẻ</button>` : ''}
                <button class="stamp-btn" data-review="${trip.id}">${isOwn ? 'Xem lại' : 'Chi tiết'}</button>
                ${isOwn ? `<button class="stamp-btn danger" data-delete="${trip.id}">Xóa</button>` : ''}
            </div>
        `;
        grid.appendChild(card);
    });

    // Sự kiện click Xem lại / Chi tiết
    grid.querySelectorAll('[data-review]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const planId = btn.dataset.review;
            const trip = trips.find(t => t.id === planId);
            if (trip) {
                if (isOwn) {
                    localStorage.setItem('topgo_review_plan', JSON.stringify(trip));
                    window.location.href = './planner.html';
                } else {
                    window.location.href = `./itinerary.html?uid=${profileOwnerUid}&planId=${planId}`;
                }
            }
        });
    });

    // Sự kiện click Chia sẻ
    grid.querySelectorAll('[data-share]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            const planId = btn.dataset.share;
            const trip = trips.find(t => t.id === planId);
            if (trip && typeof window.openShareModal === 'function') {
                window.openShareModal(trip);
            }
        });
    });

    // Sự kiện xóa (chỉ hiển thị nếu là chủ)
    if (isOwn) {
        grid.querySelectorAll('[data-delete]').forEach(btn => {
            btn.addEventListener('click', async e => {
                e.stopPropagation();
                const id = btn.dataset.delete;
                if (confirm('Bạn chắc chắn muốn xóa lịch trình này?')) {
                    try {
                        if (window.TopGoAuth) {
                            await window.TopGoAuth.deleteTrip(id);
                            window.location.reload();
                        }
                    } catch (error) {
                        showToast('Không thể xóa lịch trình: ' + error.message, 'error');
                    }
                }
            });
        });
    }
}

// Thiết lập bộ lọc lịch trình
function setupFilters(trips, uid, isOwn) {
    const filterDest = document.getElementById('filter-dest');
    const filterDateFrom = document.getElementById('filter-date-from');
    const filterDateTo = document.getElementById('filter-date-to');
    const filterBudget = document.getElementById('filter-budget');

    function applyFilters() {
        const destQuery = filterDest ? filterDest.value.toLowerCase().trim() : '';
        const dateFromQuery = filterDateFrom ? filterDateFrom.value : '';
        const dateToQuery = filterDateTo ? filterDateTo.value : '';
        const maxBudget = filterBudget && filterBudget.value ? parseFloat(filterBudget.value) : Infinity;

        const filtered = trips.filter(trip => {
            const matchDest = !destQuery || (trip.destination && trip.destination.toLowerCase().includes(destQuery));
            let matchDate = true;
            if (dateFromQuery && trip.dateStart) matchDate = matchDate && (trip.dateStart >= dateFromQuery);
            if (dateToQuery && trip.dateEnd) matchDate = matchDate && (trip.dateEnd <= dateToQuery);
            const matchBudget = !trip.budget || (parseFloat(trip.budget) <= maxBudget);
            return matchDest && matchDate && matchBudget;
        });

        renderTrips(filtered, uid, isOwn);
    }

    filterDest?.addEventListener('input', applyFilters);
    filterDateFrom?.addEventListener('change', applyFilters);
    filterDateTo?.addEventListener('change', applyFilters);
    filterBudget?.addEventListener('input', applyFilters);
}

// Thiết lập Tab điều khiển Lộ trình / Bài đăng (Ẩn lộ trình đối với khách xem profile người khác)
function setupTabs(uid, isOwnProfile) {
    const tabs = document.querySelectorAll('.profile-tab');
    const tripsGrid = document.getElementById('stamps-grid');
    const stampsEmpty = document.getElementById('stamps-empty');
    const filters = document.querySelector('.stamps-filters');
    const postsGrid = document.getElementById('posts-grid');
    const viewToggle = document.getElementById('stamps-view-toggle');

    if (!isOwnProfile) {
        // Ẩn nút tab Lộ trình du lịch
        const tripsTabBtn = document.querySelector('.profile-tab[data-tab="trips"]');
        if (tripsTabBtn) tripsTabBtn.style.display = 'none';

        // Thiết lập tab Bài đăng cá nhân là active duy nhất
        const postsTabBtn = document.querySelector('.profile-tab[data-tab="posts"]');
        if (postsTabBtn) {
            postsTabBtn.classList.add('active');
            postsTabBtn.style.color = '#00a9ff';
            postsTabBtn.style.borderBottom = '2px solid #00a9ff';
        }

        // Hiện vùng danh sách bài viết, ẩn vùng lộ trình
        tripsGrid.classList.add('hidden');
        tripsGrid.style.display = 'none';
        if (stampsEmpty) stampsEmpty.style.display = 'none';
        if (filters) filters.style.display = 'none';
        if (viewToggle) viewToggle.style.display = 'none';

        postsGrid.classList.remove('hidden');
        postsGrid.style.display = 'flex';
        loadUserPosts(uid);
        return; // Không cần lắng nghe sự kiện chuyển tab ở chế độ khách
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.color = '#888';
                t.style.borderBottom = 'none';
            });
            tab.classList.add('active');
            tab.style.color = '#00a9ff';
            tab.style.borderBottom = '2px solid #00a9ff';

            const activeTab = tab.dataset.tab;
            if (activeTab === 'trips') {
                tripsGrid.classList.remove('hidden');
                tripsGrid.style.display = 'grid';
                if (stampsEmpty) stampsEmpty.style.display = tripsGrid.children.length === 1 ? '' : 'none'; // logic empty
                if (filters) filters.style.display = '';
                if (viewToggle) viewToggle.style.display = '';
                postsGrid.classList.add('hidden');
                postsGrid.style.display = 'none';
            } else {
                tripsGrid.classList.add('hidden');
                tripsGrid.style.display = 'none';
                if (stampsEmpty) stampsEmpty.style.display = 'none';
                if (filters) filters.style.display = 'none';
                if (viewToggle) viewToggle.style.display = 'none';
                postsGrid.classList.remove('hidden');
                postsGrid.style.display = 'flex';
                loadUserPosts(uid);
            }
        });
    });

    // Thiết lập bộ chọn chế độ xem (Lưới / Danh sách) cho lịch trình
    if (viewToggle) {
        const viewButtons = viewToggle.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                viewButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const viewMode = btn.dataset.view;
                if (viewMode === 'list') {
                    tripsGrid.classList.add('list-view');
                } else {
                    tripsGrid.classList.remove('list-view');
                }
            });
        });
    }
}

// Tải bài viết cá nhân (stub/mock)
async function loadUserPosts(uid) {
    const postsContainer = document.getElementById('posts-grid');
    if (!postsContainer) return;

    try {
        const res = await fetch(`${API_BASE}/api/users/${uid}/posts`);
        if (!res.ok) throw new Error("HTTP " + res.status);
        const posts = await res.json();
        
        renderUserPosts(posts);
    } catch (e) {
        console.warn("Lỗi tải bài viết:", e);
    }
}

// Vẽ danh sách bài đăng bằng component của Thư
async function renderUserPosts(posts) {
    const container = document.getElementById('posts-grid');
    if (!container) return;

    // Xóa các card bài viết cũ ngoại trừ posts-empty
    container.querySelectorAll('.mock-post-card, .topgo-post-card-container').forEach(card => card.remove());
    const emptyEl = document.getElementById('posts-empty');

    if (posts.length === 0) {
        if (emptyEl) emptyEl.style.display = '';
        return;
    }
    if (emptyEl) emptyEl.style.display = 'none';

    // Gọi hàm renderPostCard cho mỗi bài viết để vẽ và khởi tạo bản đồ/like/comment
    for (const post of posts) {
        const postWrapper = document.createElement('div');
        postWrapper.className = 'topgo-post-card-container';
        container.appendChild(postWrapper);
        try {
            await renderPostCard(post.id, postWrapper, { mockData: post });
        } catch (err) {
            console.error("Lỗi khi render post card:", err);
        }
    }
}
