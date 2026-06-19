import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, where, orderBy, deleteDoc, doc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { fetchCities, fetchPlaces } from './api.js';

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

    // Load and Render Reviews
    function loadReviews(placeId) {
        if (unsubscribeReviews) {
            unsubscribeReviews(); // Unsubscribe previous listener
        }

        const reviewsList = document.getElementById('reviews-list');
        reviewsList.innerHTML = '<div style="text-align:center; padding: 20px;">Đang tải đánh giá...</div>';

        const q = query(collection(db, "Reviews"), where("location_id", "==", placeId), orderBy("timestamp", "desc"));
        
        unsubscribeReviews = onSnapshot(q, (snapshot) => {
            reviewsList.innerHTML = '';
            if (snapshot.empty) {
                reviewsList.innerHTML = '<div class="empty-reviews">Chưa có đánh giá nào cho địa điểm này. Hãy là người đầu tiên!</div>';
                return;
            }

            const currentUser = window.TopGoAuth ? window.TopGoAuth.getUser() : null;

            snapshot.forEach((docSnap) => {
                const review = docSnap.data();
                const reviewId = docSnap.id;
                const isOwner = currentUser && currentUser.uid === review.user_id;
                
                const dateStr = review.timestamp ? new Date(review.timestamp.toDate()).toLocaleDateString('vi-VN') : 'Vừa xong';
                const starsHtml = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);

                const reviewEl = document.createElement('div');
                reviewEl.className = 'review-item';
                reviewEl.innerHTML = `
                    <div class="review-header">
                        <span class="review-author">${review.user_name}</span>
                        <span style="color: #888; font-size: 0.85rem;">${dateStr}</span>
                    </div>
                    <div class="review-stars">${starsHtml}</div>
                    <div class="review-text" style="margin-top: 10px;">${escapeHtml(review.comment)}</div>
                    ${isOwner ? `<div class="review-actions"><button class="btn-delete-review" data-id="${reviewId}">Xoá</button></div>` : ''}
                `;
                reviewsList.appendChild(reviewEl);
            });

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
            // Có thể lỗi do thiếu index trong Firestore (báo qua console kèm link tạo index)
            if (error.message.includes('index')) {
                reviewsList.innerHTML = '<div class="empty-reviews" style="color:red">Vui lòng tạo Index cho Firestore theo link trong Console.</div>';
            } else {
                reviewsList.innerHTML = '<div class="empty-reviews" style="color:red">Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
            }
        });
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
