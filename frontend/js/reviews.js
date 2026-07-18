import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchCities, fetchPlaces } from './api.js';

const API_BASE = ['localhost', '127.0.0.1', ''].includes(window.location.hostname)
    ? 'http://localhost:8000'
    : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allPlaces = {};
let currentPlaceId = null;
let currentRating = 0;
let unsubscribeReviews = null;
const googleReviewsCache = {};

// ── Suggestion chips by star rating ──────────────────────────
const SUGGESTIONS = {
    1: ["Thất vọng hoàn toàn", "Không đáng đến", "Dịch vụ tệ", "Giá quá đắt so với chất lượng"],
    2: ["Dưới kỳ vọng", "Cần cải thiện nhiều", "Không gian ổn nhưng dịch vụ kém", "Sẽ không quay lại"],
    3: ["Tạm được", "Bình thường, không nổi bật", "Giá cả phải chăng", "Phù hợp để ghé qua"],
    4: ["Khá tốt, đáng thử", "Không khí dễ chịu", "Nhân viên thân thiện", "Sẽ giới thiệu bạn bè"],
    5: ["Tuyệt vời!", "Không thể chê được gì", "Nhất định phải đến", "Cảnh đẹp ấn tượng", "Dịch vụ xuất sắc"],
};

const STAR_LABELS = {
    1: "Rất tệ",
    2: "Không hài lòng",
    3: "Bình thường",
    4: "Khá tốt",
    5: "Tuyệt vời!",
};

async function initReviews() {
    const citySelector = document.getElementById('city-selector');
    const placeSelector = document.getElementById('place-selector');
    const reviewsSection = document.getElementById('reviews-section');
    const reviewsPlaceholder = document.getElementById('reviews-placeholder');
    const authWarning = document.getElementById('auth-warning');
    const starRatingSpans = document.querySelectorAll('#star-rating span');
    const starLabel = document.getElementById('star-label');
    const reviewSuggestions = document.getElementById('review-suggestions');
    const suggestionChips = document.getElementById('suggestion-chips');
    const reviewText = document.getElementById('review-text');

    // ── Auth ─────────────────────────────────────────────────
    const checkAuthStatus = () => {
        const loggedIn = window.TopGoAuth && window.TopGoAuth.isLoggedIn();
        authWarning.style.display = loggedIn ? 'none' : 'flex';
        reviewText.disabled = !loggedIn;
        document.getElementById('btn-submit-review').disabled = !loggedIn;
    };
    window.addEventListener('topgo-auth-change', checkAuthStatus);
    setTimeout(checkAuthStatus, 1000);

    // ── Load cities & places ──────────────────────────────────
    try {
        const cities = await fetchCities();
        
        // Populate City Selector immediately to ensure cities list is always shown
        cities.forEach(city => {
            const option = document.createElement('option');
            option.value = city.id;
            option.textContent = city.name;
            citySelector.appendChild(option);
        });

        allPlaces = await fetchPlaces();
    } catch (error) {
        console.error("Lỗi tải dữ liệu địa điểm:", error);
    }

    // ── City change ───────────────────────────────────────────
    citySelector.addEventListener('change', (e) => {
        const cityId = e.target.value;
        placeSelector.innerHTML = '<option value="">-- Chọn Địa điểm --</option>';
        reviewsSection.style.display = 'none';
        reviewsPlaceholder?.style.display = 'flex';
        document.getElementById('google-reviews-list').innerHTML = '';
        document.getElementById('user-reviews-list').innerHTML = '';
        document.getElementById('user-reviews-empty').style.display = 'none';
        if (unsubscribeReviews) { unsubscribeReviews(); unsubscribeReviews = null; }
        currentPlaceId = null;

        if (cityId && allPlaces[cityId]) {
            allPlaces[cityId].forEach(place => {
                const option = document.createElement('option');
                option.value = place.id;
                option.textContent = place.ten || place.name;
                placeSelector.appendChild(option);
            });
            placeSelector.disabled = false;
        } else {
            placeSelector.disabled = true;
        }
    });

    // ── Place change ──────────────────────────────────────────
    placeSelector.addEventListener('change', (e) => {
        currentPlaceId = e.target.value;
        if (currentPlaceId) {
            reviewsSection.style.display = 'block';
            reviewsPlaceholder?.style.display = 'none';
            loadReviews(currentPlaceId);
        } else {
            reviewsSection.style.display = 'none';
            reviewsPlaceholder?.style.display = 'flex';
        }
    });

    // ── Star rating + hover ───────────────────────────────────
    starRatingSpans.forEach(span => {
        span.addEventListener('mouseenter', () => {
            const hoverVal = parseInt(span.getAttribute('data-val'));
            starRatingSpans.forEach(s => {
                s.classList.toggle('hover', parseInt(s.getAttribute('data-val')) <= hoverVal);
            });
        });
        span.addEventListener('mouseleave', () => {
            starRatingSpans.forEach(s => s.classList.remove('hover'));
        });
        span.addEventListener('click', () => {
            currentRating = parseInt(span.getAttribute('data-val'));
            updateStarsUI();
            showSuggestions(currentRating);
        });
    });

    function updateStarsUI() {
        starRatingSpans.forEach(s => {
            s.classList.toggle('active', parseInt(s.getAttribute('data-val')) <= currentRating);
        });
        starLabel.textContent = currentRating > 0 ? STAR_LABELS[currentRating] : 'Chọn số sao';
    }

    function showSuggestions(rating) {
        const chips = SUGGESTIONS[rating] || [];
        if (!chips.length) { reviewSuggestions.style.display = 'none'; return; }
        reviewSuggestions.style.display = 'block';
        suggestionChips.innerHTML = chips.map(text =>
            `<span class="suggestion-chip" data-text="${escapeHtml(text)}">${escapeHtml(text)}</span>`
        ).join('');
        // Bind chip clicks — append to textarea (không replace)
        suggestionChips.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const addText = chip.getAttribute('data-text');
                const cur = reviewText.value;
                reviewText.value = cur
                    ? cur.trimEnd() + ' ' + addText
                    : addText;
                reviewText.focus();
            });
        });
    }

    // ── Submit ────────────────────────────────────────────────
    document.getElementById('btn-submit-review').addEventListener('click', async () => {
        if (!window.TopGoAuth || !window.TopGoAuth.isLoggedIn()) return;
        if (currentRating === 0) { alert('Vui lòng chọn số sao đánh giá!'); return; }
        const text = reviewText.value.trim();
        if (!text) { alert('Vui lòng nhập nội dung đánh giá!'); return; }

        const user = window.TopGoAuth.getUser();
        const userName = `${user.lastname || ''} ${user.firstname || ''}`.trim() || 'Người dùng Ẩn danh';

        const btn = document.getElementById('btn-submit-review');
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:16px;height:16px;border-width:2px"></div> Đang gửi...';

        try {
            await addDoc(collection(db, "Reviews"), {
                location_id: currentPlaceId,
                user_id: user.uid,
                user_name: userName,
                rating: currentRating,
                comment: text,
                timestamp: serverTimestamp()
            });
            reviewText.value = '';
            currentRating = 0;
            updateStarsUI();
            reviewSuggestions.style.display = 'none';
        } catch (error) {
            console.error("Lỗi gửi đánh giá:", error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Gửi đánh giá';
            checkAuthStatus();
        }
    });

    // ── Load reviews ──────────────────────────────────────────
    function loadReviews(placeId) {
        if (unsubscribeReviews) unsubscribeReviews();

        const googleList = document.getElementById('google-reviews-list');
        const userList = document.getElementById('user-reviews-list');
        const userEmpty = document.getElementById('user-reviews-empty');

        // Reset
        googleList.innerHTML = `<div class="reviews-loading" id="google-reviews-loading">
            <div class="loading-spinner"></div><span>Đang tải từ Google Maps...</span>
        </div>`;
        userList.innerHTML = '';
        userEmpty.style.display = 'none';

        // Google reviews
        loadGoogleReviews(placeId);

        // Firestore realtime
        const q = query(collection(db, "Reviews"), where("location_id", "==", placeId));
        unsubscribeReviews = onSnapshot(q, (snapshot) => {
            const currentUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;
            const docs = [];
            snapshot.forEach(docSnap => docs.push({ id: docSnap.id, data: docSnap.data() }));
            docs.sort((a, b) => {
                const tA = a.data.timestamp ? a.data.timestamp.toMillis() : 0;
                const tB = b.data.timestamp ? b.data.timestamp.toMillis() : 0;
                return tB - tA;
            });

            userList.innerHTML = '';
            if (docs.length === 0) {
                userEmpty.style.display = 'flex';
            } else {
                userEmpty.style.display = 'none';
                docs.forEach(({ id: reviewId, data: review }) => {
                    const isOwner = currentUser && currentUser.uid === review.user_id;
                    const dateStr = review.timestamp
                        ? new Date(review.timestamp.toDate()).toLocaleDateString('vi-VN')
                        : 'Vừa xong';
                    const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
                    const avatarLetter = review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U';
                    const el = document.createElement('div');
                    el.className = 'review-item';
                    el.innerHTML = `
                        <div class="review-header">
                            <div class="review-author-info">
                                <div class="review-author-avatar">${avatarLetter}</div>
                                <div class="review-author-details">
                                    <span class="review-author">${escapeHtml(review.user_name)}</span>
                                    <span class="review-date">${dateStr}</span>
                                </div>
                            </div>
                            <div class="review-stars">${starsHtml}</div>
                        </div>
                        <div class="review-text">${escapeHtml(review.comment)}</div>
                        ${isOwner ? `<div class="review-actions"><button class="btn-delete-review" data-id="${reviewId}">Xoá</button></div>` : ''}
                    `;
                    userList.appendChild(el);
                });

                // Bind delete
                userList.querySelectorAll('.btn-delete-review').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        if (confirm('Bạn có chắc muốn xóa đánh giá này?')) {
                            const id = e.target.getAttribute('data-id');
                            try { await deleteDoc(doc(db, "Reviews", id)); }
                            catch (err) { console.error("Lỗi xóa:", err); alert("Xóa thất bại!"); }
                        }
                    });
                });
            }
        }, (error) => {
            console.error("Firestore error:", error);
            userList.innerHTML = '<div class="reviews-empty"><p style="color:#ef4444">Lỗi tải dữ liệu. Vui lòng thử lại.</p></div>';
        });
    }

    // ── Google Reviews ────────────────────────────────────────
    async function loadGoogleReviews(placeId) {
        const googleList = document.getElementById('google-reviews-list');
        const placeName = placeSelector.options[placeSelector.selectedIndex]?.textContent || '';
        const cityName = citySelector.options[citySelector.selectedIndex]?.textContent || '';
        if (!placeName) return;

        if (googleReviewsCache[placeId]) {
            renderGoogleReviews(googleReviewsCache[placeId]);
            return;
        }

        try {
            const resp = await fetch(`${API_BASE}/api/google-reviews?place_name=${encodeURIComponent(placeName)}&city_name=${encodeURIComponent(cityName)}`);
            const data = await resp.json();
            if (data.reviews && data.reviews.length > 0) {
                googleReviewsCache[placeId] = data.reviews;
                renderGoogleReviews(data.reviews);
            } else {
                googleList.innerHTML = `<div class="reviews-empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 15h8M9 9h.01M15 9h.01"/></svg>
                    <p>Không tìm thấy đánh giá Google Maps<br>cho địa điểm này.</p>
                </div>`;
            }
        } catch (err) {
            console.error("Lỗi Google reviews:", err);
            googleList.innerHTML = `<div class="reviews-empty"><p style="color:#ef4444">Không thể kết nối Google Maps API.</p></div>`;
        }
    }

    function renderGoogleReviews(reviews) {
        const googleList = document.getElementById('google-reviews-list');
        googleList.innerHTML = '';
        reviews.forEach(review => {
            const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
            const avatarLetter = review.user_name ? review.user_name.charAt(0).toUpperCase() : 'G';
            const el = document.createElement('div');
            el.className = 'review-item google-review';
            el.innerHTML = `
                <div class="review-header">
                    <div class="review-author-info">
                        <div class="review-author-avatar" style="background: linear-gradient(135deg, #4285f4, #34a853);">${avatarLetter}</div>
                        <div class="review-author-details">
                            <span class="review-author">${escapeHtml(review.user_name)}</span>
                            <span class="review-date">${review.date || 'Google Maps'}</span>
                        </div>
                    </div>
                    <div class="review-stars">${starsHtml}</div>
                </div>
                <div class="review-text">${escapeHtml(review.comment)}</div>
            `;
            googleList.appendChild(el);
        });
    }

    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initReviews);
} else {
    initReviews();
}
