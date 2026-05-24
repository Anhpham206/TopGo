document.addEventListener('DOMContentLoaded', () => {
    // Left for backwards compatibility if needed, but we delegate to the robust initialization below
});

/**
 * Mission & Vision Puzzle Interaction
 */
function init_mission_vision() {
    const container = document.getElementById('mvContainer');
    const toggleBtn = document.getElementById('mvToggleBtn');
    const closeBtn = document.getElementById('mvCloseBtn');
    const pieces = document.querySelectorAll('.mv-piece');

    if (!container || !toggleBtn || !closeBtn) return;
    
    if (container.dataset.mvInitialized) return;
    container.dataset.mvInitialized = 'true';

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
        
        // Remove hover effects when merged
        pieces.forEach(p => p.classList.remove('is-hovered'));

        // Add merged class to animate pieces together
        container.classList.add('merged');
        toggleBtn.setAttribute('aria-expanded', 'true');
        
        // Disable individual piece transitions briefly, or let them transition smoothly
        toggleBtn.style.opacity = '0';
        toggleBtn.style.pointerEvents = 'none';

        // After the puzzle pieces have merged (750ms), reveal the glass panel
        setTimeout(() => {
            container.classList.add('panel-active');
        }, 750);
    }

    function scatter_puzzle() {
        if (!isMerged) return;
        isMerged = false;
        
        // Hide panel first
        container.classList.remove('panel-active');
        toggleBtn.setAttribute('aria-expanded', 'false');
        
        // After panel starts fading out (300ms), scatter the puzzle pieces
        setTimeout(() => {
            container.classList.remove('merged');
            toggleBtn.style.opacity = '1';
            toggleBtn.style.pointerEvents = 'all';
            // Clear any lingering hover classes
            pieces.forEach(p => p.classList.remove('is-hovered'));
        }, 300);
    }

    // Toggle button clicks
    toggleBtn.addEventListener('click', merge_puzzle);
    closeBtn.addEventListener('click', scatter_puzzle);

    // Also support keyboard triggers
    toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            merge_puzzle();
        }
    });

    closeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            scatter_puzzle();
        }
    });

    // Track mousemove over the container to calculate distance to piece centers
    container.addEventListener('mousemove', (e) => {
        if (isMerged) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Convert mouse coordinates to nominal 600x450 grid system
        const nominalMouseX = (mouseX / rect.width) * 600;
        const nominalMouseY = (mouseY / rect.height) * 450;

        let closestPiece = null;
        let minDistance = Infinity;

        pieces.forEach(piece => {
            const index = parseInt(piece.getAttribute('data-index'));
            const center = nominalCenters[index];
            if (!center) return;

            // Get the computed scatter values
            const pieceStyle = window.getComputedStyle(piece);
            const scatterX = parseFloat(piece.style.getPropertyValue('--scatter-x') || pieceStyle.getPropertyValue('--scatter-x')) || 0;
            const scatterY = parseFloat(piece.style.getPropertyValue('--scatter-y') || pieceStyle.getPropertyValue('--scatter-y')) || 0;

            const scatteredCenterX = center.x + scatterX;
            const scatteredCenterY = center.y + scatterY;

            // Calculate Euclidean distance to the scattered center
            const dx = nominalMouseX - scatteredCenterX;
            const dy = nominalMouseY - scatteredCenterY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestPiece = piece;
            }
        });

        // Set hover threshold (110px works well for 200x150px grid cells)
        const threshold = 110;

        pieces.forEach(piece => {
            if (piece === closestPiece && minDistance < threshold) {
                piece.classList.add('is-hovered');
            } else {
                piece.classList.remove('is-hovered');
            }
        });
    });

    // Remove hover styles when mouse leaves container
    container.addEventListener('mouseleave', () => {
        if (!isMerged) {
            pieces.forEach(piece => piece.classList.remove('is-hovered'));
        }
    });

    // Support click on piece to merge (only if hovered/active)
    pieces.forEach(piece => {
        piece.addEventListener('click', () => {
            if (!isMerged && piece.classList.contains('is-hovered')) {
                merge_puzzle();
            }
        });

        // Keyboard accessibility
        piece.setAttribute('tabindex', '0');
        
        piece.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (!isMerged) merge_puzzle();
            }
        });

        // Add focus visual style matching hover style
        piece.addEventListener('focus', () => {
            if (!isMerged) {
                pieces.forEach(p => p.classList.remove('is-hovered'));
                piece.classList.add('is-hovered');
            }
        });

        piece.addEventListener('blur', () => {
            piece.classList.remove('is-hovered');
        });
    });
    
    // Add scroll reveal effect for mission-vision section
    const mvSection = document.querySelector('.mission-vision-section');
    if (mvSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    mvSection.classList.add('revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: "0px 0px -50px 0px"
        });
        observer.observe(mvSection);
    }
}

// Initialize reliably
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init_mission_vision);
} else {
    init_mission_vision();
}
