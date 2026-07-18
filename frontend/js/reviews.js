import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchCities, fetchPlaces } from './api.js';
const API_BASE = 'http://localhost:8000'

// Initialize Firebase (sử dụng chung instance với auth.js)
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app); // Ensure Auth is initialized for Firestore permissions
const db = getFirestore(app);

let allPlaces = {};
let currentPlaceId = null;
let currentRating = 0;
let unsubscribeReviews = null;

document.addEventListener('DOMContentLoaded', async () => {
    const citySelector = document.getElementById('city-selector');
    const placeSelector = document.getElementById('place-selector');
    const reviewsSection = document.getElementById('reviews-section');
    const authWarning = document.getElementById('auth-warning');
    const starRatingSpans = document.querySelectorAll('#star-rating span');

    // ── Auth Status ──────────────────────────────────────────────────────────
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
    setTimeout(checkAuthStatus, 1000);

    // ── Load Cities & Places ─────────────────────────────────────────────────
    try {
        const cities = await fetchCities();
        allPlaces = await fetchPlaces();

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

    // ── City Change ──────────────────────────────────────────────────────────
    citySelector.addEventListener('change', (e) => {
        const cityId = e.target.value;
        placeSelector.innerHTML = '<option value="">-- Chọn Địa điểm --</option>';

        reviewsSection.style.display = 'none';
        const colGoogle = document.getElementById('col-google');
        const colUser = document.getElementById('col-user');
        if (colGoogle) colGoogle.innerHTML = '';
        if (colUser) colUser.innerHTML = '';

        if (unsubscribeReviews) {
            unsubscribeReviews();
            unsubscribeReviews = null;
        }
        currentRating = 0;
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

    // ── Place Change ─────────────────────────────────────────────────────────
    placeSelector.addEventListener('change', (e) => {
        currentPlaceId = e.target.value;
        if (currentPlaceId) {
            reviewsSection.style.display = 'block';
            loadReviews(currentPlaceId);
        } else {
            reviewsSection.style.display = 'none';
        }
    });

    // ── Star Rating & Suggestion Chips ───────────────────────────────────────
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

    const starLabel = document.getElementById('star-label');
    const reviewSuggestions = document.getElementById('review-suggestions');
    const suggestionChips = document.getElementById('suggestion-chips');
    const reviewText = document.getElementById('review-text');

    starRatingSpans.forEach(span => {
        span.addEventListener('click', () => {
            currentRating = parseInt(span.getAttribute('data-val'));
            updateStarsUI();
            showSuggestions(currentRating);
        });

        span.addEventListener('mouseenter', () => {
            const hoverVal = parseInt(span.getAttribute('data-val'));
            starRatingSpans.forEach(s => {
                s.classList.toggle('hover', parseInt(s.getAttribute('data-val')) <= hoverVal);
            });
        });

        span.addEventListener('mouseleave', () => {
            starRatingSpans.forEach(s => s.classList.remove('hover'));
        });
    });

    function showSuggestions(rating) {
        const chips = SUGGESTIONS[rating] || [];
        if (!chips.length) {
            if (reviewSuggestions) reviewSuggestions.style.display = 'none';
            return;
        }
        if (reviewSuggestions) reviewSuggestions.style.display = 'flex';
        if (suggestionChips) {
            suggestionChips.innerHTML = chips.map(text =>
                `<span class="suggestion-chip" data-text="${text}">${text}</span>`
            ).join('');

            suggestionChips.querySelectorAll('.suggestion-chip').forEach(chip => {
                chip.addEventListener('click', () => {
                    const addText = chip.getAttribute('data-text');
                    const curText = reviewText.value;
                    // Append — không replace
                    reviewText.value = curText
                        ? curText.trimEnd() + ' ' + addText
                        : addText;
                    reviewText.focus();
                });
            });
        }
    }

    function updateStarsUI() {
        starRatingSpans.forEach(span => {
            span.classList.toggle('active', parseInt(span.getAttribute('data-val')) <= currentRating);
        });
        if (starLabel) {
            starLabel.textContent = STAR_LABELS[currentRating] || 'Chọn số sao';
        }
    }
    updateStarsUI();

    // ── Submit Review ────────────────────────────────────────────────────────
    document.getElementById('btn-submit-review').addEventListener('click', async () => {
        if (!window.TopGoAuth || !window.TopGoAuth.isLoggedIn()) return;

        const textInput = document.getElementById('review-text');
        const text = textInput.value.trim();

        if (currentRating === 0) {
            alert('Vui lòng chọn số sao đánh giá!');
            return;
        }

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

            console.log("Firebase Auth Current User before addDoc:", auth.currentUser);
            if (!auth.currentUser) {
                console.warn("Auth state hasn't propagated to Firestore yet. Trying to re-authenticate or wait.");
            }

            await addDoc(collection(db, "Reviews"), {
                location_id: currentPlaceId,
                user_id: user.uid,
                user_name: userName,
                rating: currentRating,
                comment: text,
                timestamp: serverTimestamp()
            });


            textInput.value = '';
            currentRating = 0;
            updateStarsUI();
            if (reviewSuggestions) reviewSuggestions.style.display = 'none';

        } catch (error) {
            console.error("Lỗi khi gửi đánh giá:", error);
            alert("Có lỗi xảy ra: " + error.message);
        } finally {
            const btn = document.getElementById('btn-submit-review');
            btn.disabled = false;
            btn.textContent = 'Gửi Đánh giá';
        }
    });

    // ── Google Reviews Cache ─────────────────────────────────────────────────
    const googleReviewsCache = {};

    function getCurrentPlaceName() {
        const ps = document.getElementById('place-selector');
        return ps.options[ps.selectedIndex]?.textContent || '';
    }
    function getCurrentCityName() {
        const cs = document.getElementById('city-selector');
        return cs.options[cs.selectedIndex]?.textContent || '';
    }

    // ── Load Reviews (both columns) ──────────────────────────────────────────
    function loadReviews(placeId) {
        if (unsubscribeReviews) unsubscribeReviews();

        const colGoogle = document.getElementById('col-google');
        const colUser = document.getElementById('col-user');

        colGoogle.innerHTML = '<div class="reviews-loading">Đang tải Google Maps...</div>';
        colUser.innerHTML = '<div class="reviews-loading">Đang tải đánh giá...</div>';

        // Load Google reviews concurrently
        loadGoogleReviews(placeId);

        // Load Firestore user reviews
        const q = query(collection(db, "Reviews"), where("location_id", "==", placeId));

        unsubscribeReviews = onSnapshot(q, (snapshot) => {
            colUser.innerHTML = '';

            const currentUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;
            const reviewDocs = [];

            snapshot.forEach(docSnap => {
                reviewDocs.push({ id: docSnap.id, data: docSnap.data() });
            });

            reviewDocs.sort((a, b) => {
                const tA = a.data.timestamp ? a.data.timestamp.toMillis() : 0;
                const tB = b.data.timestamp ? b.data.timestamp.toMillis() : 0;
                return tB - tA;
            });

            if (reviewDocs.length === 0) {
                colUser.innerHTML = '<div class="empty-reviews">Chưa có đánh giá nào. Hãy là người đầu tiên! 🎉</div>';
            } else {
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
                    colUser.appendChild(reviewEl);
                });
            }

            // Delete event bindings
            colUser.querySelectorAll('.btn-delete-review').forEach(btn => {
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
            colUser.innerHTML = '<div class="empty-reviews" style="color:red">Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
        });
    }

    // ── Load Google Reviews from backend ────────────────────────────────────
    async function loadGoogleReviews(placeId) {
        const colGoogle = document.getElementById('col-google');
        const placeName = getCurrentPlaceName();
        const cityName = getCurrentCityName();

        if (!placeName) return;

        // Frontend cache hit
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
                if (colGoogle) {
                    colGoogle.innerHTML = '<div class="empty-reviews">Không tìm thấy đánh giá Google cho địa điểm này.</div>';
                }
            }
        } catch (err) {
            console.error("Lỗi tải Google reviews:", err);
            if (colGoogle) {
                colGoogle.innerHTML = '<div class="empty-reviews">Không thể kết nối để tải đánh giá Google.</div>';
            }
        }
    }

    // ── Render Google Reviews into left column ────────────────────────────────
    function renderGoogleReviews(reviews) {
        const colGoogle = document.getElementById('col-google');
        if (!colGoogle) return;

        colGoogle.innerHTML = '';

        if (!reviews || reviews.length === 0) {
            colGoogle.innerHTML = '<div class="empty-reviews">Không tìm thấy đánh giá Google cho địa điểm này.</div>';
            return;
        }

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
            colGoogle.appendChild(el);
        });
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    function escapeHtml(unsafe) {
        if (!unsafe) return '';
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
});
