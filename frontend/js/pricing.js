import { showToast } from './shared.js';

document.addEventListener('DOMContentLoaded', () => {
  // ── Existing 3D Ticket scroll animation logic ──
  const ticketsContainer = document.querySelector('.hero-3d-tickets');
  if (ticketsContainer) {
    const maxScroll = 500;
    let ticking = false;

    function updateTicketsScroll() {
      const scrollY = window.scrollY;
      const progress = Math.min(scrollY / maxScroll, 1);
      document.documentElement.style.setProperty('--scroll-progress', progress);
      ticking = false;
    }

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          updateTicketsScroll();
        });
        ticking = true;
      }
    }, { passive: true });

    updateTicketsScroll();
  }

  // ── Pricing Packages & Payment Integration Logic ──
  const billingCheckbox = document.getElementById('billing-checkbox');
  const billingMonthlyLabel = document.getElementById('billing-monthly');
  const billingYearlyLabel = document.getElementById('billing-yearly');
  const vipPriceEl = document.getElementById('vip-price');
  const vipPeriodEl = document.getElementById('vip-period');
  const vipCtaBtn = document.getElementById('vip-cta-btn');
  const freeCtaBtn = document.getElementById('free-cta-btn');

  // API base URL configuration (sync with api.js)
  const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
  const API_BASE = _isLocal ? 'http://localhost:8000' : 'https://api.topgo.vn';

  function updatePricing() {
    if (!billingCheckbox) return;
    if (billingCheckbox.checked) {
      // Yearly
      if (vipPriceEl) vipPriceEl.textContent = '299.000';
      if (vipPeriodEl) vipPeriodEl.textContent = '/năm';
      if (billingYearlyLabel) billingYearlyLabel.classList.add('active');
      if (billingMonthlyLabel) billingMonthlyLabel.classList.remove('active');
    } else {
      // Monthly
      if (vipPriceEl) vipPriceEl.textContent = '49.000';
      if (vipPeriodEl) vipPeriodEl.textContent = '/tháng';
      if (billingMonthlyLabel) billingMonthlyLabel.classList.add('active');
      if (billingYearlyLabel) billingYearlyLabel.classList.remove('active');
    }
  }

  if (billingCheckbox) {
    billingCheckbox.addEventListener('change', updatePricing);
  }
  if (billingMonthlyLabel) {
    billingMonthlyLabel.addEventListener('click', () => {
      if (billingCheckbox) {
        billingCheckbox.checked = false;
        updatePricing();
      }
    });
  }
  if (billingYearlyLabel) {
    billingYearlyLabel.addEventListener('click', () => {
      if (billingCheckbox) {
        billingCheckbox.checked = true;
        updatePricing();
      }
    });
  }

  // Cập nhật trạng thái nút bấm dựa trên user hiện tại
  function checkUserState() {
    try {
      const user = JSON.parse(localStorage.getItem('topgo_user'));
      if (user && user.is_vip) {
        if (freeCtaBtn) {
          freeCtaBtn.textContent = 'Mặc định';
          freeCtaBtn.disabled = true;
          freeCtaBtn.style.opacity = '0.5';
          freeCtaBtn.style.cursor = 'default';
        }
        if (vipCtaBtn) {
          const expiry = user.vip_expires_at ? new Date(user.vip_expires_at).toLocaleDateString('vi-VN') : '';
          vipCtaBtn.textContent = expiry ? `VIP (HSD: ${expiry})` : 'Đang hoạt động';
          vipCtaBtn.disabled = true;
          vipCtaBtn.style.background = 'linear-gradient(90deg, #2e7d64, #3b9e7f)';
          vipCtaBtn.style.boxShadow = 'none';
          vipCtaBtn.style.cursor = 'default';
        }
      } else {
        if (freeCtaBtn) {
          freeCtaBtn.textContent = 'Đang sử dụng';
          freeCtaBtn.disabled = true;
          freeCtaBtn.style.opacity = '1';
          freeCtaBtn.style.cursor = 'default';
        }
        if (vipCtaBtn) {
          vipCtaBtn.textContent = 'Mua gói VIP';
          vipCtaBtn.disabled = false;
          vipCtaBtn.style.background = 'linear-gradient(90deg, #ffb347, #ffa500)';
          vipCtaBtn.style.boxShadow = '0 8px 24px rgba(255,179,71,0.3)';
          vipCtaBtn.style.cursor = 'pointer';
        }
      }
    } catch (e) {
      console.error("Error reading user state in pricing:", e);
    }
  }

  checkUserState();
  window.addEventListener('topgo-auth-change', checkUserState);

  // Xử lý khi nhấn Mua VIP
  if (vipCtaBtn) {
    vipCtaBtn.addEventListener('click', async () => {
      const user = JSON.parse(localStorage.getItem('topgo_user'));
      if (!user) {
        showToast('Vui lòng đăng nhập trước khi mua gói VIP!', 'warning');
        setTimeout(() => {
          window.location.href = `./auth.html?redirect=pricing.html`;
        }, 1500);
        return;
      }

      if (user.is_vip) return;

      const packageType = (billingCheckbox && billingCheckbox.checked) ? 'year' : 'month';
      vipCtaBtn.disabled = true;
      vipCtaBtn.textContent = 'Đang khởi tạo...';

      try {
        if (!window.TopGoAuth) {
          throw new Error('Hệ thống xác thực đang khởi tạo. Vui lòng tải lại trang.');
        }

        const token = await window.TopGoAuth.getIdToken();
        if (!token) {
          throw new Error('Vui lòng đăng nhập lại để xác thực giao dịch.');
        }

        const res = await fetch(`${API_BASE}/api/payment/vnpay_create`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ 
            package_type: packageType,
            return_url: window.location.href.split('?')[0]
          })
        });

        if (!res.ok) {
          const errText = await res.text();
          throw new Error(errText || 'Lỗi kết nối máy chủ thanh toán.');
        }

        const data = await res.json();
        if (data.status === 'success' && data.payment_url) {
          showToast('Đang chuyển hướng đến cổng thanh toán VNPay...', 'success');
          setTimeout(() => {
            window.location.href = data.payment_url;
          }, 1000);
        } else {
          throw new Error(data.detail || 'Không thể tạo liên kết thanh toán.');
        }
      } catch (err) {
        console.error("Payment error:", err);
        showToast(err.message, 'error');
        checkUserState();
      }
    });
  }

  // Xử lý Query parameters từ VNPay trả về (Xác thực trực tiếp trên Frontend)
  const urlParams = new URLSearchParams(window.location.search);
  const receivedHash = urlParams.get('vnp_SecureHash');

  if (receivedHash) {
    showToast('Đang xác thực giao dịch từ VNPay...', 'warning');
    
    // Gọi API của backend để xác thực chữ ký và cập nhật trạng thái VIP
    fetch(`${API_BASE}/api/payment/vnpay_return?${window.location.search.substring(1)}`)
      .then(res => {
        if (!res.ok) {
          return res.json().then(errData => {
            throw new Error(errData.detail || 'Xác thực thanh toán thất bại.');
          });
        }
        return res.json();
      })
      .then(data => {
        if (data.status === 'success') {
          // Cập nhật trạng thái VIP cục bộ
          const user = JSON.parse(localStorage.getItem('topgo_user'));
          if (user) {
            user.is_vip = true;
            user.vip_package = data.package;
            if (data.expiry) {
              const pts = data.expiry.split('/');
              if (pts.length === 3) {
                user.vip_expires_at = `${pts[2]}-${pts[1]}-${pts[0]}`;
              }
            }
            localStorage.setItem('topgo_user', JSON.stringify(user));
            window.dispatchEvent(new Event('topgo-auth-change'));
          }
          showToast(`Nâng cấp tài khoản VIP (${data.package === 'year' ? 'Năm' : 'Tháng'}) thành công!`, 'success');
        } else {
          throw new Error('Xác thực thất bại.');
        }
      })
      .catch(err => {
        console.error("Verification error:", err);
        showToast(err.message, 'error');
      })
      .finally(() => {
        // Xóa query parameters khỏi URL để tránh F5 bị lặp lại
        window.history.replaceState({}, document.title, window.location.pathname);
        checkUserState();
      });
  }
});
