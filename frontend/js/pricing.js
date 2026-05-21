/**
 * ========================================================================
 * FILE: pricing.js
 * CHỨC NĂNG:
 * - Điều khiển hiệu ứng bay chéo của các tấm vé 3D theo thao tác cuộn trang (scroll).
 * - Sử dụng CSS Variables để tối ưu hóa hiệu năng render bằng GPU.
 * - Sử dụng requestAnimationFrame chống hiện tượng giật lag (jank).
 * ========================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const ticketsContainer = document.querySelector('.hero-3d-tickets');
  if (!ticketsContainer) return;

  const maxScroll = 500; // Khoảng cách cuộn trang áp dụng hiệu ứng bay hoàn toàn
  let ticking = false;

  function updateTicketsScroll() {
    const scrollY = window.scrollY;
    // Tính toán tiến trình cuộn trang từ 0 đến 1
    const progress = Math.min(scrollY / maxScroll, 1);
    
    // Đặt biến CSS --scroll-progress lên root document
    document.documentElement.style.setProperty('--scroll-progress', progress);
    ticking = false;
  }

  // Lắng nghe sự kiện scroll tối ưu với requestAnimationFrame
  window.addEventListener('scroll', () => {
    if (!ticking) {
      window.requestAnimationFrame(() => {
        updateTicketsScroll();
      });
      ticking = true;
    }
  }, { passive: true });

  // Khởi tạo ban đầu để đảm bảo vị trí chính xác khi F5 trang giữa chừng
  updateTicketsScroll();
});
