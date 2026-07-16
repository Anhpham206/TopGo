import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchCities, fetchPlaces } from './api.js';
const API_BASE = 'http://localhost:8000'

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let allPlaces = {};
let currentPlaceId = null;
let currentRating = 5;
let unsubscribeReviews = null;

document.addEventListener('DOMContentLoaded', async () => {
    const citySelector = document.getElementById('city-selector');
    const placeSelector = document.getElementById('place-selector');
    const reviewsSection = document.getElementById('reviews-section');
    const authWarning = document.getElementById('auth-warning');
    const reviewFormContainer = document.getElementById('review-form-container');
    const starRatingSpans = document.querySelectorAll('#star-rating span');

    // Check Auth Status
    const checkAuthStatus = () => {
        if (window.TopGoAuth && window.TopGoAuth.isLoggedIn()) {
            authWarning.style.display = 'none';
            document.getElementById('review-text').disabled = false;
            document.getElementById('btn-submit-review').disabled = false;
        } else {
            authWarning.style.display = 'block';
            document.getElementById('review-text').disabled = true;
            document.getElementById('btn-submit-review').disabled = true;
        }
    };

    window.addEventListener('topgo-auth-change', checkAuthStatus);
    // Initial check
    setTimeout(checkAuthStatus, 1000); // Wait for auth.js to initialize

    // Load Cities and Places
    try {
        const cities = await fetchCities();
        allPlaces = await fetchPlaces();

        // Populate City Selector
        cities.forEach(city => {
            if (allPlaces[city.id] && allPlaces[city.id].length > 0) {
                const option = document.createElement('option');
                option.value = city.id;
                option.textContent = city.name;
                citySelector.appendChild(option);
            }
        });
    } catch (error) {
        console.error("Lỗi khi tải dữ liệu địa điểm:", error);
    }

    // Handle City Change
    citySelector.addEventListener('change', (e) => {
        const cityId = e.target.value;
        placeSelector.innerHTML = '<option value="">-- Chọn Địa điểm --</option>';

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
            reviewsSection.style.display = 'none';
        }
    });

    // Handle Place Change
    placeSelector.addEventListener('change', (e) => {
        currentPlaceId = e.target.value;
        if (currentPlaceId) {
            reviewsSection.style.display = 'block';
            loadReviews(currentPlaceId);
        } else {
            reviewsSection.style.display = 'none';
        }
    });

    // Star Rating Logic
    starRatingSpans.forEach(span => {
        span.addEventListener('click', () => {
            currentRating = parseInt(span.getAttribute('data-val'));
            updateStarsUI();
        });
    });

    function updateStarsUI() {
        starRatingSpans.forEach(span => {
            if (parseInt(span.getAttribute('data-val')) <= currentRating) {
                span.classList.add('active');
            } else {
                span.classList.remove('active');
            }
        });
    }
    updateStarsUI();

    // Submit Review
    document.getElementById('btn-submit-review').addEventListener('click', async () => {
        if (!window.TopGoAuth || !window.TopGoAuth.isLoggedIn()) return;

        const textInput = document.getElementById('review-text');
        const text = textInput.value.trim();
        if (!text) {
            alert('Vui lòng nhập nội dung đánh giá!');
            return;
        }

        const user = window.TopGoAuth.getUser();
        const userName = `${user.lastname || ''} ${user.firstname || ''}`.trim() || 'Người dùng Ẩn danh';

        try {
            const btn = document.getElementById('btn-submit-review');
            btn.disabled = true;
            btn.textContent = 'Đang gửi...';

            await addDoc(collection(db, "Reviews"), {
                location_id: currentPlaceId,
                user_id: user.uid,
                user_name: userName,
                rating: currentRating,
                comment: text,
                timestamp: serverTimestamp()
            });

            textInput.value = '';
            currentRating = 5;
            updateStarsUI();

        } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            const btn = document.getElementById('btn-submit-review');
            btn.disabled = false;
            btn.textContent = 'Gửi Đánh giá';
        }
    });

    // Cache Google reviews phía frontend để không gọi lại API
    const googleReviewsCache = {};

    // Lấy tên địa điểm và thành phố hiện tại
    function getCurrentPlaceName() {
        const placeSelector = document.getElementById('place-selector');
        return placeSelector.options[placeSelector.selectedIndex]?.textContent || '';
    }
    function getCurrentCityName() {
        const citySelector = document.getElementById('city-selector');
        return citySelector.options[citySelector.selectedIndex]?.textContent || '';
    }

    // Load and Render Reviews
    function loadReviews(placeId) {
        if (unsubscribeReviews) {
            unsubscribeReviews();
        }

        const reviewsList = document.getElementById('reviews-list');
        reviewsList.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải đánh giá...</div>';

        // Load Google reviews song song
        loadGoogleReviews(placeId);

        // Load user reviews từ Firestore
        const q = query(collection(db, "Reviews"), where("location_id", "==", placeId));

        unsubscribeReviews = onSnapshot(q, (snapshot) => {
            // Giữ lại phần Google reviews nếu đã render
            const googleSection = reviewsList.querySelector('.google-reviews-section');
            reviewsList.innerHTML = '';
            if (googleSection) {
                reviewsList.appendChild(googleSection);
            }

            const currentUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;

            const reviewDocs = [];
            snapshot.forEach((docSnap) => {
                reviewDocs.push({ id: docSnap.id, data: docSnap.data() });
            });
            reviewDocs.sort((a, b) => {
                const timeA = a.data.timestamp ? a.data.timestamp.toMillis() : 0;
                const timeB = b.data.timestamp ? b.data.timestamp.toMillis() : 0;
                return timeB - timeA;
            });

            if (reviewDocs.length > 0) {
                // Thêm header cho phần user reviews
                const userHeader = document.createElement('div');
                userHeader.className = 'reviews-section-header';
                userHeader.innerHTML = `<h4 style="margin: 20px 0 10px; color: var(--text); font-size: 1.1rem;">💬 Đánh giá từ người dùng TopGo</h4>`;
                reviewsList.appendChild(userHeader);
            }

            reviewDocs.forEach(({ id: reviewId, data: review }) => {
                const isOwner = currentUser && currentUser.uid === review.user_id;

                const dateStr = review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString('vi-VN') : 'Vừa xong';
                const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                const avatarLetter = review.user_name ? review.user_name.charAt(0).toUpperCase() : 'U';
                const reviewEl = document.createElement('div');
                reviewEl.className = 'review-item';
                reviewEl.innerHTML = `
                    <div class="review-header">
                        <div class="review-author-info">
                            <div class="review-author-avatar">${avatarLetter}</div>
                            <div class="review-author-details">
                                <span class="review-author">${review.user_name}</span>
                                <span class="review-date">${dateStr}</span>
                            </div>
                        </div>
                        <div class="review-stars">${starsHtml}</div>
                    </div>
                    <div class="review-text">${escapeHtml(review.comment)}</div>
                    ${isOwner ? `<div class="review-actions"><button class="btn-delete-review" data-id="${reviewId}">Xoá</button></div>` : ''}
                `;
                reviewsList.appendChild(reviewEl);
            });

            // Nếu không có cả Google reviews lẫn user reviews
            if (reviewDocs.length === 0 && !reviewsList.querySelector('.google-reviews-section')) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'empty-reviews';
                emptyMsg.id = 'empty-reviews-msg';
                emptyMsg.textContent = 'Đang tải đánh giá từ Google Maps...';
                reviewsList.appendChild(emptyMsg);
            }

            // Bind Delete Events
            document.querySelectorAll('.btn-delete-review').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (confirm('Bạn có chắc muốn xóa đánh giá này?')) {
                        const id = e.target.getAttribute('data-id');
                        try {
                            await deleteDoc(doc(db, "Reviews", id));
                        } catch (err) {
                            console.error("Lỗi xóa:", err);
                            alert("Xóa thất bại!");
                        }
                    }
                });
            });
        }, (error) => {
            console.error("Lỗi lắng nghe dữ liệu:", error);
            reviewsList.innerHTML = '<div class="empty-reviews" style="color:red">Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
        });
    }

    // Lazy-load Google reviews qua backend API
    async function loadGoogleReviews(placeId) {
        const reviewsList = document.getElementById('reviews-list');
        const placeName = getCurrentPlaceName();
        const cityName = getCurrentCityName();

        if (!placeName) return;

        // Check cache frontend
        if (googleReviewsCache[placeId]) {
            renderGoogleReviews(googleReviewsCache[placeId]);
            return;
        }

        try {
            const apiBase = window.location.origin;
            const resp = await fetch(`${API_BASE}/api/google-reviews?place_name=${encodeURIComponent(placeName)}&city_name=${encodeURIComponent(cityName)}`);
            const data = await resp.json();

            if (data.reviews && data.reviews.length > 0) {
                googleReviewsCache[placeId] = data.reviews;
                renderGoogleReviews(data.reviews);
            } else {
                // Xoá msg "đang tải" nếu có
                const emptyMsg = document.getElementById('empty-reviews-msg');
                if (emptyMsg && !reviewsList.querySelector('.review-item')) {
                    emptyMsg.textContent = 'Chưa có đánh giá nào cho địa điểm này. Hãy là người đầu tiên!';
                }
            }
        } catch (err) {
            console.error("Lỗi tải Google reviews:", err);
        }
    }

    function renderGoogleReviews(reviews) {
        const reviewsList = document.getElementById('reviews-list');

        // Xoá phần Google cũ nếu có
        const oldSection = reviewsList.querySelector('.google-reviews-section');
        if (oldSection) oldSection.remove();

        // Xoá msg "đang tải" hoặc "chưa có đánh giá"
        const emptyMsg = document.getElementById('empty-reviews-msg');
        if (emptyMsg) emptyMsg.remove();

        const section = document.createElement('div');
        section.className = 'google-reviews-section';
        section.innerHTML = `<h4 style="margin: 0 0 12px; color: var(--text); font-size: 1.1rem;">
            <img src="https://www.google.com/favicon.ico" alt="G" style="width:18px;height:18px;vertical-align:middle;margin-right:6px;">
            Đánh giá từ Google Maps
        </h4>`;

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
            section.appendChild(el);
        });

        // Chèn Google reviews lên ĐẦU danh sách
        reviewsList.insertBefore(section, reviewsList.firstChild);
    }

    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
