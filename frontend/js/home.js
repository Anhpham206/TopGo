/**
 * FILE: home.js
 * CHỨC NĂNG:
 * - Tạo hiệu ứng hạt sáng bay lơ lửng trong bầu không khí (Atmospheric Particles).
 * - Xử lý Parallax chuột nhẹ nhàng cho máy bay (phục hồi bản gốc không Morph để loại bỏ hoàn toàn lag giật).
 * - Điều khiển ánh đèn spotlight chiếu sáng theo chuột tại mỗi section.
 */

document.addEventListener('DOMContentLoaded', () => {
    initCinematicParticles();
    initCinematicSpotlights();
    initMouseParallax();
});

/**
 * Khởi tạo hạt sáng lơ lửng ngẫu nhiên trong tầm nhìn
 */
function initCinematicParticles() {
    const container = document.getElementById('particles-container');
    if (!container) return;
    
    const particleCount = 35; // Số lượng hạt vừa phải để giữ hiệu năng mượt
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'cinematic-particle';
        
        const size = Math.random() * 4 + 2; // Hạt từ 2px đến 6px
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * -20;
        const duration = Math.random() * 20 + 15;
        const opacity = Math.random() * 0.4 + 0.2;

        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${left}%`;
        particle.style.top = `${top}%`;
        particle.style.animationDelay = `${delay}s`;
        particle.style.animationDuration = `${duration}s`;
        particle.style.opacity = opacity;
        
        container.appendChild(particle);
    }
}

/**
 * Điều khiển ánh đèn Spotlight chiếu sáng di chuyển theo chuột
 */
function initCinematicSpotlights() {
    const sections = document.querySelectorAll('.cinematic-section');
    sections.forEach(section => {
        const spotlight = section.querySelector('.section-spotlight');
        if (!spotlight) return;

        section.style.setProperty('--light-x', '50%');
        section.style.setProperty('--light-y', '40%');

        let ticking = false;
        section.addEventListener('mousemove', (e) => {
            if (!ticking) {
                window.requestAnimationFrame(() => {
                    const rect = section.getBoundingClientRect();
                    const x = ((e.clientX - rect.left) / rect.width) * 100;
                    const y = ((e.clientY - rect.top) / rect.height) * 100;
                    
                    section.style.setProperty('--light-x', `${x}%`);
                    section.style.setProperty('--light-y', `${y}%`);
                    ticking = false;
                });
                ticking = true;
            }
        });

        section.addEventListener('mouseleave', () => {
            section.style.setProperty('--light-x', '50%');
            section.style.setProperty('--light-y', '40%');
        });
    });
}

/**
 * Xử lý hiệu ứng Parallax mượt mà cho máy bay theo vị trí chuột (Bản gốc siêu mượt)
 */
function initMouseParallax() {
    const parallaxItems = document.querySelectorAll('[data-parallax-speed]');
    if (parallaxItems.length === 0) return;

    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;
    const ease = 0.08; // Chỉ số mượt (lerp factor)

    window.addEventListener('mousemove', (e) => {
        mouseX = (e.clientX / window.innerWidth) - 0.5;
        mouseY = (e.clientY / window.innerHeight) - 0.5;
    });

    window.addEventListener('deviceorientation', (e) => {
        if (e.beta !== null && e.gamma !== null) {
            mouseX = (e.gamma / 30) * 0.5;
            mouseY = ((e.beta - 45) / 45) * 0.5;
        }
    });

    function updateParallaxFrame() {
        currentX += (mouseX - currentX) * ease;
        currentY += (mouseY - currentY) * ease;

        parallaxItems.forEach(item => {
            const speed = parseFloat(item.getAttribute('data-parallax-speed')) || 0;
            const xOffset = currentX * speed * 120;
            const yOffset = currentY * speed * 120;
            
            let rotOffset = 0;
            if (item.classList.contains('plane-item')) {
                rotOffset = currentX * 45 + currentY * 15;
            }
            
            item.style.setProperty('--parallax-x', `${xOffset}px`);
            item.style.setProperty('--parallax-y', `${yOffset}px`);
            item.style.setProperty('--parallax-rot', `${rotOffset}deg`);
        });

        requestAnimationFrame(updateParallaxFrame);
    }

    requestAnimationFrame(updateParallaxFrame);
}
