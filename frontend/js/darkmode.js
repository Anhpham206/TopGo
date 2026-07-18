/* 
  ========================================================================
  FILE: darkmode.js
  CHỨC NĂNG: 
  - Tách biệt và quản lý tính năng Dark Mode cho hệ thống TopGo.
  - Tự động kiểm tra và áp dụng giao diện tối ngay khi tải tệp để tránh nhấp nháy giao diện (FOUC).
  - Khởi tạo sự kiện chuyển đổi giao diện sáng/tối qua nút bấm #theme-toggle.
  - Tệp này được cấu hình trong .gitignore để không đẩy lên GitHub khi nộp bài.
  ========================================================================
*/

// ── Cấu hình bật/tắt nhanh Dark Mode ──────────────────────────────────
// Đổi giá trị dưới đây thành 'true' để khôi phục hoàn toàn tính năng Dark Mode
const IS_DARK_MODE_ENABLED = true; 

// ── Immediate Dark Mode Application to prevent FOUC ───────────────────
(function applyThemeImmediately() {
    if (!IS_DARK_MODE_ENABLED) return;
    
    const savedTheme = localStorage.getItem('topgo-theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    } else {
        // Mặc định là Light Mode (hoặc khi người dùng chọn 'light')
        document.body.classList.remove('dark');
    }
})();

// ── Initialize Dark Mode Toggle ───────────────────────────────
export function initThemeToggle() {
    if (!IS_DARK_MODE_ENABLED) return;

    const toggleBtn = document.getElementById('theme-toggle');
    if (!toggleBtn) return;

    // Hiển thị nút bấm (vì mặc định trong CSS đang là display: none)
    toggleBtn.style.display = 'flex';

    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark');
        localStorage.setItem('topgo-theme', isDark ? 'dark' : 'light');
    });
}
