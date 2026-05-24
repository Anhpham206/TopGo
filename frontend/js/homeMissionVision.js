/**
 * FILE: homeMissionVision.js
 * CHỨC NĂNG:
 * - Xử lý tương tác 3D Puzzle cho phần Sứ Mệnh & Tầm Nhìn trên trang chủ.
 * - Logic tương tự missionVision.js nhưng dùng ID riêng (home-prefix) để không xung đột.
 */

function init_home_mission_vision() {
    const container = document.getElementById('homeMvContainer');
    const toggleBtn = document.getElementById('homeMvToggleBtn');
    const closeBtn = document.getElementById('homeMvCloseBtn');
    const section = document.getElementById('home-mv-section');
    
    if (!container || !toggleBtn || !closeBtn) return;

    // Avoid duplicate initialization
    if (container.dataset.mvInitialized) return;
    container.dataset.mvInitialized = 'true';

    const pieces = container.querySelectorAll('.mv-piece');
    let isMerged = false;

    // Nominal centers for the 600x450 grid system
    const nominalCenters = [
        { x: 100, y: 75 },   // Piece 0
        { x: 300, y: 75 },   // Piece 1
        { x: 500, y: 75 },   // Piece 2
        { x: 100, y: 225 },  // Piece 3
        { x: 300, y: 225 },  // Piece 4
        { x: 500, y: 225 },  // Piece 5
        { x: 300, y: 375 }   // Piece 6
    ];

    function merge_puzzle() {
        if (isMerged) return;
        isMerged = true;

        pieces.forEach(p => p.classList.remove('is-hovered'));
        container.classList.add('merged');
        toggleBtn.setAttribute('aria-expanded', 'true');
        toggleBtn.style.opacity = '0';
        toggleBtn.style.pointerEvents = 'none';

        setTimeout(() => {
            container.classList.add('panel-active');
        }, 750);
    }

    function scatter_puzzle() {
        if (!isMerged) return;
        isMerged = false;

        container.classList.remove('panel-active');
        toggleBtn.setAttribute('aria-expanded', 'false');

        setTimeout(() => {
            container.classList.remove('merged');
            toggleBtn.style.opacity = '1';
            toggleBtn.style.pointerEvents = 'all';
            pieces.forEach(p => p.classList.remove('is-hovered'));
        }, 300);
    }

    // Toggle button clicks
    toggleBtn.addEventListener('click', merge_puzzle);
    closeBtn.addEventListener('click', scatter_puzzle);

    // Keyboard support
    toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); merge_puzzle(); }
    });
    closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); scatter_puzzle(); }
    });

    // Hover tracking
    container.addEventListener('mousemove', (e) => {
        if (isMerged) return;

        const rect = container.getBoundingClientRect();
        const nominalMouseX = ((e.clientX - rect.left) / rect.width) * 600;
        const nominalMouseY = ((e.clientY - rect.top) / rect.height) * 450;

        let closestPiece = null;
        let minDistance = Infinity;

        pieces.forEach(piece => {
            const index = parseInt(piece.getAttribute('data-index'));
            const center = nominalCenters[index];
            if (!center) return;

            const scatterX = parseFloat(piece.style.getPropertyValue('--scatter-x')) || 0;
            const scatterY = parseFloat(piece.style.getPropertyValue('--scatter-y')) || 0;

            const dx = nominalMouseX - (center.x + scatterX);
            const dy = nominalMouseY - (center.y + scatterY);
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestPiece = piece;
            }
        });

        const threshold = 110;
        pieces.forEach(piece => {
            if (piece === closestPiece && minDistance < threshold) {
                piece.classList.add('is-hovered');
            } else {
                piece.classList.remove('is-hovered');
            }
        });
    });

    container.addEventListener('mouseleave', () => {
        if (!isMerged) {
            pieces.forEach(piece => piece.classList.remove('is-hovered'));
        }
    });

    // Click on piece to merge
    pieces.forEach(piece => {
        piece.addEventListener('click', () => {
            if (!isMerged && piece.classList.contains('is-hovered')) {
                merge_puzzle();
            }
        });
        piece.setAttribute('tabindex', '0');
        piece.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!isMerged) merge_puzzle(); }
        });
        piece.addEventListener('focus', () => {
            if (!isMerged) { pieces.forEach(p => p.classList.remove('is-hovered')); piece.classList.add('is-hovered'); }
        });
        piece.addEventListener('blur', () => { piece.classList.remove('is-hovered'); });
    });

    // Scroll reveal
    if (section) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    section.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
        observer.observe(section);
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init_home_mission_vision);
} else {
    init_home_mission_vision();
}
