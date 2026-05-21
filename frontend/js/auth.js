/*
  ========================================================================
  FILE: auth.js
  CHỨC NĂNG:
  - Quản lý auth flow giả lập bằng localStorage.
  - Xử lý login/register form, profile page, edit profile, saved trips.
  - Sẵn sàng tích hợp BE: tất cả logic qua AuthService object.
  ========================================================================
*/
import { loadSharedComponents } from './shared.js';

// ── Auth Service (localStorage mock — thay bằng API calls khi có BE) ──
const AuthService = {
  USER_KEY: 'topgo_user',
  TRIPS_KEY: 'topgo_saved_trips',

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); } catch { return null; }
  },
  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('topgo-auth-change'));
  },
  logout() {
    localStorage.removeItem(this.USER_KEY);
    window.dispatchEvent(new Event('topgo-auth-change'));
  },
  isLoggedIn() { return !!this.getUser(); },

  // Register mock
  register({ firstname, lastname, email, password }) {
    const user = {
      id: 'TG-' + String(Date.now()).slice(-6),
      firstname, lastname, email,
      nationality: 'Việt Nam', sex: '', dob: '', pob: '',
      createdAt: new Date().toISOString().split('T')[0],
      avatar: null,
    };
    this.setUser(user);
    return user;
  },

  // Login mock
  login({ email, password }) {
    const existing = this.getUser();
    if (existing && existing.email === email) return existing;
    // Giả lập: tạo user mới nếu chưa có
    return this.register({ firstname: 'Traveler', lastname: 'TopGo', email, password });
  },

  updateProfile(updates) {
    const user = this.getUser();
    if (!user) return null;
    Object.assign(user, updates);
    this.setUser(user);
    return user;
  },

  // Saved Trips
  getTrips() {
    try { return JSON.parse(localStorage.getItem(this.TRIPS_KEY)) || []; } catch { return []; }
  },
  saveTrip(trip) {
    const trips = this.getTrips();
    trip.id = trip.id || 'trip-' + Date.now();
    trip.savedAt = new Date().toISOString();
    trips.unshift(trip);
    localStorage.setItem(this.TRIPS_KEY, JSON.stringify(trips));
    return trip;
  },
  deleteTrip(id) {
    const trips = this.getTrips().filter(t => t.id !== id);
    localStorage.setItem(this.TRIPS_KEY, JSON.stringify(trips));
  }
};

// Make available globally for other pages
window.TopGoAuth = AuthService;

// ── Page Detection ──
const currentPage = window.location.pathname.split('/').pop() || '';

// ── Auth Page Logic ──
if (currentPage === 'auth.html') {
  document.addEventListener('DOMContentLoaded', () => {
    // Redirect if already logged in
    if (AuthService.isLoggedIn()) {
      window.location.href = './profile.html';
      return;
    }

    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    // Toggle forms
    document.getElementById('switch-to-register')?.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });
    document.getElementById('switch-to-login')?.addEventListener('click', () => {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });

    // Password toggles
    document.querySelectorAll('.pass-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('.auth-input');
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // Validation helpers
    const showErr = id => document.getElementById(id)?.classList.add('show');
    const hideErr = id => document.getElementById(id)?.classList.remove('show');
    const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    // Login
    document.getElementById('btn-login')?.addEventListener('click', () => {
      let valid = true;
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      hideErr('err-login-email'); hideErr('err-login-password');

      if (!isEmail(email)) { showErr('err-login-email'); valid = false; }
      if (!password) { showErr('err-login-password'); valid = false; }

      if (valid) {
        AuthService.login({ email, password });
        window.location.href = './profile.html';
      }
    });

    // Register
    document.getElementById('btn-register')?.addEventListener('click', () => {
      let valid = true;
      const lastname = document.getElementById('reg-lastname').value.trim();
      const firstname = document.getElementById('reg-firstname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      ['err-reg-lastname','err-reg-firstname','err-reg-email','err-reg-password','err-reg-confirm']
        .forEach(hideErr);

      if (!lastname) { showErr('err-reg-lastname'); valid = false; }
      if (!firstname) { showErr('err-reg-firstname'); valid = false; }
      if (!isEmail(email)) { showErr('err-reg-email'); valid = false; }
      if (password.length < 6) { showErr('err-reg-password'); valid = false; }
      if (password !== confirm) { showErr('err-reg-confirm'); valid = false; }

      if (valid) {
        AuthService.register({ firstname, lastname, email, password });
        window.location.href = './profile.html';
      }
    });

    // Google mock
    document.getElementById('btn-google')?.addEventListener('click', () => {
      AuthService.register({
        firstname: 'Traveler',
        lastname: 'Google',
        email: 'user@gmail.com',
        password: ''
      });
      window.location.href = './profile.html';
    });

    // Enter key support
    document.querySelectorAll('.auth-input').forEach(input => {
      input.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
          const form = input.closest('.auth-form');
          if (form.id === 'form-login') document.getElementById('btn-login').click();
          else document.getElementById('btn-register').click();
        }
      });
    });
  });
}

// ── Profile Page Logic ──
if (currentPage === 'profile.html') {
  document.addEventListener('DOMContentLoaded', () => {
    // Redirect if not logged in
    if (!AuthService.isLoggedIn()) {
      window.location.href = './auth.html';
      return;
    }

    const user = AuthService.getUser();

    // Populate profile
    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    };
    setText('pp-fullname', `${user.lastname || ''} ${user.firstname || ''}`.trim());
    setText('pp-nationality', user.nationality);
    setText('pp-sex', user.sex);
    setText('pp-dob', user.dob);
    setText('pp-pob', user.pob);
    setText('pp-email', user.email);
    setText('pp-doi', user.createdAt);
    setText('pp-passport-no', user.id);

    // Trips count
    const trips = AuthService.getTrips();
    setText('pp-trips', String(trips.length));
    setText('stamps-count', `${trips.length} chuyến`);

    // Render saved trips
    renderTrips(trips);

    // MRZ update
    const mrzEl = document.getElementById('pp-mrz');
    if (mrzEl) {
      const lastname = (user.lastname || 'TOPGO').toUpperCase().replace(/\s/g, '<');
      const firstname = (user.firstname || 'TRAVELER').toUpperCase().replace(/\s/g, '<');
      const line1 = `P<VNM<${lastname}<<${firstname}`.padEnd(44, '<').replace(/</g, '&lt;');
      
      const dobStr = (user.dob || '000000').replace(/-/g, '').slice(-6); // usually YYMMDD
      const sexStr = (user.sex === 'Nam' ? 'M' : (user.sex === 'Nữ' ? 'F' : '<'));
      const idStr = (user.id || 'TG000000');
      const line2 = `${idStr.padEnd(9, '<')}0VNM${dobStr.padEnd(6, '<')}0${sexStr}${'<'.repeat(7)}`.padEnd(44, '<').replace(/</g, '&lt;');
      
      mrzEl.innerHTML = `${line1}<br>${line2}`;
    }

    // View Toggle for Stamps
    const toggleBtns = document.querySelectorAll('.view-btn');
    const stampsGrid = document.getElementById('stamps-grid');
    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.view === 'list') {
          stampsGrid.classList.add('list-view');
        } else {
          stampsGrid.classList.remove('list-view');
        }
      });
    });

    // Edit Profile
    const overlay = document.getElementById('pp-edit-overlay');
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
      document.getElementById('edit-lastname').value = user.lastname || '';
      document.getElementById('edit-firstname').value = user.firstname || '';
      document.getElementById('edit-dob').value = user.dob || '';
      document.getElementById('edit-sex').value = user.sex || '';
      document.getElementById('edit-pob').value = user.pob || '';
      document.getElementById('edit-nationality').value = user.nationality || '';
      overlay.classList.remove('hidden');
    });
    document.getElementById('pp-edit-close')?.addEventListener('click', () => overlay.classList.add('hidden'));
    document.getElementById('btn-edit-cancel')?.addEventListener('click', () => overlay.classList.add('hidden'));
    overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

    document.getElementById('btn-edit-save')?.addEventListener('click', () => {
      const updated = AuthService.updateProfile({
        lastname: document.getElementById('edit-lastname').value.trim(),
        firstname: document.getElementById('edit-firstname').value.trim(),
        dob: document.getElementById('edit-dob').value,
        sex: document.getElementById('edit-sex').value,
        pob: document.getElementById('edit-pob').value.trim(),
        nationality: document.getElementById('edit-nationality').value.trim(),
      });
      if (updated) window.location.reload();
    });

    // Logout
    document.getElementById('btn-logout')?.addEventListener('click', () => {
      AuthService.logout();
      window.location.href = './auth.html';
    });

    // Filter Event Listeners
    const filterDest = document.getElementById('filter-dest');
    const filterDateFrom = document.getElementById('filter-date-from');
    const filterDateTo = document.getElementById('filter-date-to');
    const filterBudget = document.getElementById('filter-budget');

    function applyFilters() {
      const destQuery = filterDest ? filterDest.value.toLowerCase().trim() : '';
      const dateFromQuery = filterDateFrom ? filterDateFrom.value : '';
      const dateToQuery = filterDateTo ? filterDateTo.value : '';
      const maxBudget = filterBudget && filterBudget.value ? parseFloat(filterBudget.value) : Infinity;

      const filteredTrips = trips.filter(trip => {
        const matchDest = !destQuery || (trip.destination && trip.destination.toLowerCase().includes(destQuery));
        let matchDate = true;
        if (dateFromQuery && trip.dateStart) {
          matchDate = matchDate && (trip.dateStart >= dateFromQuery);
        }
        if (dateToQuery && trip.dateEnd) {
          matchDate = matchDate && (trip.dateEnd <= dateToQuery);
        }
        const matchBudget = !trip.budget || (parseFloat(trip.budget) <= maxBudget);
        return matchDest && matchDate && matchBudget;
      });

      renderTrips(filteredTrips);
    }

    filterDest?.addEventListener('input', applyFilters);
    filterDateFrom?.addEventListener('change', applyFilters);
    filterDateTo?.addEventListener('change', applyFilters);
    filterBudget?.addEventListener('input', applyFilters);

    // Seed demo trips if empty
    if (trips.length === 0) {
      seedDemoTrips();
      window.location.reload();
    }
  });
}

function renderTrips(trips) {
  const grid = document.getElementById('stamps-grid');
  const empty = document.getElementById('stamps-empty');
  if (!grid) return;

  // Clear existing cards
  grid.querySelectorAll('.stamp-card').forEach(card => card.remove());

  if (trips.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  trips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'stamp-card';
    card.innerHTML = `
      <div class="stamp-dest">${trip.destination || 'Chuyến đi'}</div>
      <div class="stamp-meta">
        <span class="stamp-tag">${trip.days || '?'} ngày</span>
        <span class="stamp-tag">${trip.pax || '?'} người</span>
        ${trip.budget ? `<span class="stamp-tag">${Number(trip.budget).toLocaleString('vi-VN')}₫</span>` : ''}
      </div>
      <div class="stamp-date">${trip.dateStart || ''} → ${trip.dateEnd || ''}</div>
      <div class="stamp-actions">
        <button class="stamp-btn" onclick="window.location.href='./planner.html'">Xem lại</button>
        <button class="stamp-btn danger" data-delete="${trip.id}">Xóa</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Delete handlers
  grid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.delete;
      if (confirm('Xóa lịch trình này?')) {
        AuthService.deleteTrip(id);
        window.location.reload();
      }
    });
  });
}

function seedDemoTrips() {
  const demos = [
    { destination: 'Đà Nẵng', days: 3, pax: 2, budget: 5000000, dateStart: '2026-06-15', dateEnd: '2026-06-17' },
    { destination: 'Phú Quốc', days: 4, pax: 4, budget: 12000000, dateStart: '2026-07-01', dateEnd: '2026-07-04' },
    { destination: 'Sapa', days: 2, pax: 3, budget: 3000000, dateStart: '2026-08-10', dateEnd: '2026-08-11' },
  ];
  demos.forEach(d => AuthService.saveTrip(d));
}
