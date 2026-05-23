// aboutus.js – Cập nhật trạng thái card 3D khi cuộn ngang
(function() {
    const container = document.querySelector('.aboutus-carousel-container');
    if (!container) return;

    const cards = Array.from(document.querySelectorAll('.aboutus-carousel-card'));
    if (cards.length === 0) return;

    function updateActiveCard() {
        const containerRect = container.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;

        // Tìm card gần trung tâm nhất
        let closestCard = null;
        let minDistance = Infinity;
        cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const cardCenter = rect.left + rect.width / 2;
            const distance = Math.abs(cardCenter - centerX);
            if (distance < minDistance) {
                minDistance = distance;
                closestCard = card;
            }
        });

        if (!closestCard) return;

        const activeIndex = cards.indexOf(closestCard);

        // Reset tất cả class
        cards.forEach(card => {
            card.classList.remove('active', 'adjacent', 'inactive');
        });

        // Gán class active
        closestCard.classList.add('active');

        // Gán class adjacent cho 2 bên (nếu có)
        if (cards[activeIndex - 1]) cards[activeIndex - 1].classList.add('adjacent');
        if (cards[activeIndex + 1]) cards[activeIndex + 1].classList.add('adjacent');

        // Các card còn lại là inactive
        cards.forEach(card => {
            if (!card.classList.contains('active') && !card.classList.contains('adjacent')) {
                card.classList.add('inactive');
            }
        });
    }

    // Lắng nghe sự kiện scroll và resize
    container.addEventListener('scroll', () => {
        requestAnimationFrame(updateActiveCard);
    });
    window.addEventListener('resize', updateActiveCard);

    // Khởi tạo lần đầu
    updateActiveCard();
})();