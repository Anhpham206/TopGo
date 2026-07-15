/*
  ========================================================================
  FILE: auth.js
  CHỨC NĂNG:
  - Quản lý auth flow bằng Firebase Authentication (Google Sign-In & Email/Password).
  - Tự động đồng bộ trạng thái đăng nhập với backend và localStorage.
  - Quản lý lưu trữ/tải danh sách/xóa lịch trình thông qua các API FastAPI backend được bảo vệ.
  - Hỗ trợ xem lại lịch trình cũ qua localStorage chuyển tiếp.
  ========================================================================
*/
import { loadSharedComponents } from './shared.js';
import { firebaseConfig } from './firebaseConfig.js';
import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Khởi tạo Firebase Web SDK
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const _isLocal = ['localhost', '127.0.0.1', ''].includes(window.location.hostname);
const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');

let authInitialized = false;
let authUser = null;

// Lắng nghe trạng thái đăng nhập từ Firebase để đồng bộ với UI thông qua localStorage
onAuthStateChanged(auth, (user) => {
  authUser = user;
  authInitialized = true;
  if (user) {
    const nameParts = (user.displayName || '').split(' ');
    const firstname = nameParts.pop() || '';
    const lastname = nameParts.join(' ') || '';
    const cachedUser = {
      uid: user.uid,
      email: user.email,
      firstname: firstname || user.email.split('@')[0],
      lastname: lastname,
      photoURL: user.photoURL || null,
      nationality: 'Việt Nam',
      sex: '',
      dob: '',
      pob: '',
      createdAt: new Date().toISOString().split('T')[0],
      id: user.uid.slice(0, 8),
    };
    
    // Giữ nguyên các trường profile bổ sung nếu có trong cache trước đó
    const existing = localStorage.getItem('topgo_user');
    if (existing) {
      try {
        const parsed = JSON.parse(existing);
        if (parsed.uid === user.uid) {
          Object.assign(cachedUser, parsed);
        }
      } catch (e) {}
    }
    localStorage.setItem('topgo_user', JSON.stringify(cachedUser));

    // Đồng bộ thông tin hồ sơ từ Firestore backend
    user.getIdToken().then(token => {
      localStorage.setItem('topgo_token', token);
      fetch(`${API_BASE}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(dbProfile => {
        if (dbProfile && Object.keys(dbProfile).length > 0) {
          // Ghi nhận các trường thay đổi từ database
          const updatedUser = { ...cachedUser, ...dbProfile };
          localStorage.setItem('topgo_user', JSON.stringify(updatedUser));
          window.dispatchEvent(new Event('topgo-auth-change'));
        }

        // ── SYNC photoURL và thông tin cơ bản lên BE nếu chưa có ──
        // Điều này đảm bảo feed_controller có thể lấy avatar khi enrich post
        const needsSync = !dbProfile?.photoURL && user.photoURL
          || !dbProfile?.firstname && cachedUser.firstname
          || !dbProfile?.email && user.email;

        if (needsSync) {
          const profileToSync = {
            firstname: cachedUser.firstname || '',
            lastname: cachedUser.lastname || '',
            email: user.email || '',
            photoURL: user.photoURL || null,
            nationality: dbProfile?.nationality || 'Việt Nam',
          };
          fetch(`${API_BASE}/api/users/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(profileToSync)
          }).catch(err => {
            console.warn('[TopGo] Không thể đồng bộ profile lên BE:', err);
          });
        }
      })
      .catch(err => {
        // Nếu GET profile lỗi, vẫn thử sync thông tin cơ bản lên BE
        console.warn("Chưa có cấu hình profile hoặc lỗi kết nối:", err);
        if (user.photoURL || cachedUser.firstname) {
          fetch(`${API_BASE}/api/users/profile`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              firstname: cachedUser.firstname || '',
              lastname: cachedUser.lastname || '',
              email: user.email || '',
              photoURL: user.photoURL || null,
              nationality: 'Việt Nam',
            })
          }).catch(() => {});
        }
      });
    });
  } else {
    localStorage.removeItem('topgo_user');
    localStorage.removeItem('topgo_token');
  }
  window.dispatchEvent(new Event('topgo-auth-change'));
});

// Chờ Firebase Auth kiểm tra trạng thái đăng nhập
function waitForAuth() {
  if (authInitialized) return Promise.resolve(authUser);
  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      resolve(user);
      unsubscribe();
    });
  });
}

// ── Auth Service (Đồng bộ qua Firebase & Backend API) ──
const AuthService = {
  USER_KEY: 'topgo_user',

  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); } catch { return null; }
  },
  setUser(user) {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    window.dispatchEvent(new Event('topgo-auth-change'));
  },
  async logout() {
    await signOut(auth);
    localStorage.removeItem(this.USER_KEY);
    window.dispatchEvent(new Event('topgo-auth-change'));
  },
  isLoggedIn() { return !!this.getUser(); },

  // Email Register
  async register({ firstname, lastname, email, password }) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const displayName = `${lastname} ${firstname}`.trim();
    await updateProfile(result.user, { displayName });
    const user = {
      uid: result.user.uid,
      email: result.user.email,
      firstname,
      lastname,
      photoURL: null,
      nationality: 'Việt Nam',
      sex: '',
      dob: '',
      pob: '',
      createdAt: new Date().toISOString().split('T')[0],
      id: result.user.uid.slice(0, 8),
    };
    this.setUser(user);
    return user;
  },

  // Email Login
  async login({ email, password }) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
  },

  // Google Login
  async loginWithGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  },

  async updateProfile(updates) {
    const user = this.getUser();
    if (!user) return null;

    // Lưu trữ thông tin hồ sơ lên Firestore của backend trước
    const firebaseUser = await waitForAuth();
    if (firebaseUser) {
      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch(`${API_BASE}/api/users/profile`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updates)
        });
        if (!res.ok) {
           const errData = await res.json().catch(()=>({}));
           throw new Error(errData.detail || "Cập nhật hồ sơ thất bại");
        }
      } catch (err) {
        console.error("Lỗi khi đồng bộ profile lên server:", err);
        throw err; // Ném lỗi ra ngoài để UI xử lý
      }
    }
    
    // Cập nhật local sau khi backend thành công
    Object.assign(user, updates);
    this.setUser(user);
    window.dispatchEvent(new Event('topgo-auth-change'));
    return user;
  },


  // Saved Trips từ Backend FastAPI + Firestore
  async getTrips() {
    const user = await waitForAuth();
    if (!user) return [];
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/plans/list`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi khi tải danh sách lịch trình:", error);
      return [];
    }
  },

  async saveTrip(trip) {
    const user = await waitForAuth();
    if (!user) throw new Error("Bạn cần đăng nhập để thực hiện chức năng này.");
    try {
      const token = await user.getIdToken();
      
      let itineraryStr = null;
      if (trip.itinerary) {
        itineraryStr = typeof trip.itinerary === 'string' ? trip.itinerary : JSON.stringify(trip.itinerary);
      }

      const payload = {
        id: trip.id || null,
        destination: trip.destination || 'Chuyến đi',
        days: parseInt(trip.days) || 1,
        pax: parseInt(trip.pax) || 1,
        budget: parseFloat(trip.budget) || 0.0,
        dateStart: trip.dateStart || '',
        dateEnd: trip.dateEnd || '',
        itinerary: itineraryStr
      };
      const res = await fetch(`${API_BASE}/api/plans/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (error) {
      console.error("Lỗi khi lưu lịch trình:", error);
      throw error;
    }
  },

  async deleteTrip(id) {
    const user = await waitForAuth();
    if (!user) throw new Error("Chưa đăng nhập");
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${API_BASE}/api/plans/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error("Lỗi khi xóa lịch trình:", error);
      throw error;
    }
  }
};

// Đưa ra phạm vi global để dùng chung giữa các trang
window.TopGoAuth = AuthService;

// ── Helper cho DOM Ready (tránh miss DOMContentLoaded trong script module) ──
function onDOMReady(fn) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', fn);
  } else {
    fn();
  }
}

// ── Nhận diện trang hiện tại ──
const currentPage = window.location.pathname.split('/').pop() || '';

// ── Logic trang xác thực (auth.html) ──
if (currentPage === 'auth.html') {
  onDOMReady(() => {
    // Chuyển hướng nếu đã đăng nhập
    if (AuthService.isLoggedIn()) {
      window.location.href = './profile.html';
      return;
    }

    const loginForm = document.getElementById('form-login');
    const registerForm = document.getElementById('form-register');

    // Chuyển đổi qua lại giữa form Đăng nhập / Đăng ký
    document.getElementById('switch-to-register')?.addEventListener('click', () => {
      loginForm.classList.add('hidden');
      registerForm.classList.remove('hidden');
    });
    document.getElementById('switch-to-login')?.addEventListener('click', () => {
      registerForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });

    // Ẩn/hiện mật khẩu
    document.querySelectorAll('.pass-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const input = btn.parentElement.querySelector('.auth-input');
        input.type = input.type === 'password' ? 'text' : 'password';
      });
    });

    // Trợ lý thông báo lỗi
    const showErr = id => document.getElementById(id)?.classList.add('show');
    const hideErr = id => document.getElementById(id)?.classList.remove('show');
    const isEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

    const getFriendlyErrorMessage = error => {
      const msg = `${error?.code || ''} ${error?.message || ''}`.toLowerCase();
      if (msg.includes('email-already-in-use')) {
        return 'Email này đã được sử dụng bởi một tài khoản khác.';
      }
      if (msg.includes('invalid-credential') || msg.includes('wrong-password') || msg.includes('user-not-found')) {
        return 'Email hoặc mật khẩu không chính xác.';
      }
      if (msg.includes('weak-password')) {
        return 'Mật khẩu quá yếu (tối thiểu phải có 6 ký tự).';
      }
      if (msg.includes('invalid-email')) {
        return 'Địa chỉ email không đúng định dạng.';
      }
      if (msg.includes('network-request-failed')) {
        return 'Không thể kết nối Internet. Vui lòng kiểm tra lại mạng.';
      }
      return error?.message || 'Có lỗi xảy ra, vui lòng thử lại.';
    };

    const showGlobalError = (id, message) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = message;
        el.classList.add('show');
      }
    };

    // Đăng nhập Email
    document.getElementById('btn-login')?.addEventListener('click', async () => {
      let valid = true;
      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      hideErr('err-login-email'); hideErr('err-login-password'); hideErr('err-login-global');

      if (!isEmail(email)) { showErr('err-login-email'); valid = false; }
      if (!password) { showErr('err-login-password'); valid = false; }

      if (valid) {
        try {
          await AuthService.login({ email, password });
          window.location.href = './profile.html';
        } catch (e) {
          showGlobalError('err-login-global', getFriendlyErrorMessage(e));
        }
      }
    });

    // Đăng ký Email
    document.getElementById('btn-register')?.addEventListener('click', async () => {
      let valid = true;
      const lastname = document.getElementById('reg-lastname').value.trim();
      const firstname = document.getElementById('reg-firstname').value.trim();
      const email = document.getElementById('reg-email').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm = document.getElementById('reg-confirm').value;

      ['err-reg-lastname','err-reg-firstname','err-reg-email','err-reg-password','err-reg-confirm','err-register-global']
        .forEach(hideErr);

      if (!lastname) { showErr('err-reg-lastname'); valid = false; }
      if (!firstname) { showErr('err-reg-firstname'); valid = false; }
      if (!isEmail(email)) {
        const emailErr = document.getElementById('err-reg-email');
        if (emailErr) emailErr.textContent = 'Email không hợp lệ';
        showErr('err-reg-email');
        valid = false;
      }
      if (password.length < 6) { showErr('err-reg-password'); valid = false; }
      if (password !== confirm) { showErr('err-reg-confirm'); valid = false; }

      if (valid) {
        try {
          await AuthService.register({ firstname, lastname, email, password });
          window.location.href = './profile.html';
        } catch (e) {
          const msg = `${e?.code || ''} ${e?.message || ''}`.toLowerCase();
          if (msg.includes('email-already-in-use')) {
            const emailErr = document.getElementById('err-reg-email');
            if (emailErr) {
              emailErr.textContent = 'Email này đã được sử dụng bởi một tài khoản khác.';
              showErr('err-reg-email');
            }
          } else {
            showGlobalError('err-register-global', getFriendlyErrorMessage(e));
          }
        }
      }
    });

    // Đăng nhập Google thật
    document.getElementById('btn-google')?.addEventListener('click', async () => {
      hideErr('err-login-global');
      try {
        await AuthService.loginWithGoogle();
        window.location.href = './profile.html';
      } catch (e) {
        showGlobalError('err-login-global', getFriendlyErrorMessage(e));
      }
    });

    // Hỗ trợ phím Enter để submit nhanh
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

// ── Logic trang Hồ sơ cá nhân (profile.html) ──
if (currentPage === 'profile.html') {
  onDOMReady(async () => {
    // Chuyển hướng nếu chưa đăng nhập
    if (!AuthService.isLoggedIn()) {
      window.location.href = './auth.html';
      return;
    }

    const setText = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val || '—';
    };

    // Tabs Logic
    const tabs = document.querySelectorAll('.pv2-tab');
    const tabContents = document.querySelectorAll('.pv2-tab-content');
    const tabIndicator = document.querySelector('.pv2-tab-indicator');
    
    function updateTabIndicator(activeTab) {
      if (!tabIndicator || !activeTab) return;
      tabIndicator.style.display = 'block';
      tabIndicator.style.width = `${activeTab.offsetWidth}px`;
      tabIndicator.style.left = `${activeTab.offsetLeft}px`;
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const targetId = tab.dataset.tab;
        const targetContent = document.getElementById(targetId);
        if (targetContent) targetContent.classList.add('active');
        
        updateTabIndicator(tab);
      });
    });

    // Initialize tab indicator on load (give DOM time to render)
    setTimeout(() => {
      const activeTab = document.querySelector('.pv2-tab.active');
      if (activeTab) updateTabIndicator(activeTab);
    }, 100);


    const updateProfileUI = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const viewUserId = urlParams.get('userId');
      let user = AuthService.getUser();
      
      const isViewingOther = viewUserId && (!user || (user.id !== viewUserId && user.uid !== viewUserId));
      
      if (isViewingOther) {
          // Ẩn nút chỉnh sửa, đăng xuất, edit avatar
          const actionsEl = document.getElementById('pv2-actions');
          if (actionsEl) actionsEl.style.display = 'none';
          const photoEditBtn = document.getElementById('pp-photo-edit');
          if (photoEditBtn) photoEditBtn.style.display = 'none';
          
          setText('pv2-name', 'Đang tải...');
          
          try {
              const res = await fetch(`${API_BASE}/api/users/${viewUserId}/profile`);
              if (res.ok) {
                  user = await res.json();
              } else {
                  throw new Error('User not found');
              }
          } catch (e) {
              console.warn("Không thể tải public profile:", e);
              user = {
                  id: viewUserId.substring(0, 8),
                  firstname: '',
                  lastname: 'Thành viên ' + viewUserId.substring(0, 4),
                  nationality: 'Việt Nam',
                  sex: 'Khác',
                  dob: '—',
                  pob: '—',
                  email: 'Bảo mật',
                  createdAt: '—',
                  photoURL: null
              };
          }
      }

      if (!user) return;
      const fullname = `${user.lastname || ''} ${user.firstname || ''}`.trim() || '—';
      
      // ── Populate V2 Header ──
      setText('pv2-name', fullname);
      const handleEl = document.getElementById('pv2-handle');
      if (handleEl) {
          const username = user.username ? user.username : (user.id || 'TG-000000');
          handleEl.textContent = `@${username} · ${user.nationality || 'Việt Nam'}`;
      }
      const emailEl = document.getElementById('pv2-email');
      if (emailEl && !isViewingOther) emailEl.textContent = user.email || '';
      
      // V2 Avatar
      const v2AvatarEl = document.getElementById('pv2-avatar');
      if (v2AvatarEl) {
        if (user.photoURL && user.photoURL !== 'undefined' && user.photoURL !== 'null') {
          v2AvatarEl.innerHTML = `<img src="${user.photoURL}" alt="Avatar">`;
        } else {
          const initial = (user.firstname || user.lastname || user.email || 'T').charAt(0).toUpperCase();
          v2AvatarEl.innerHTML = `<span style="font-size: 40px; font-weight: 600; color: var(--p1); display: flex; align-items: center; justify-content: center; width: 100%; height: 100%;">${initial}</span>`;
        }
      }

      // V2 Stats
      const statNationEl = document.getElementById('pv2-stat-nation-label');
      if (statNationEl) statNationEl.textContent = user.nationality || 'Việt Nam';

      // ── Populate Identity Panel (Sidebar) ──
      setText('pip-fullname', fullname);
      setText('pip-nationality', user.nationality || 'Việt Nam');
      setText('pip-sex', user.sex || '—');
      setText('pip-dob', user.dob || '—');
      setText('pip-pob', user.pob || '—');
      const pipEmailEl = document.getElementById('pip-email');
      if (pipEmailEl) pipEmailEl.textContent = isViewingOther ? 'Bảo mật' : (user.email || '—');
      const pipJoinedEl = document.getElementById('pip-joined');
      if (pipJoinedEl) {
        pipJoinedEl.textContent = user.createdAt || '—';
      }
    };

    // Render giao diện ban đầu từ cache
    updateProfileUI();

    // Lắng nghe sự kiện để tự động làm mới giao diện khi tải xong profile từ server
    window.addEventListener('topgo-auth-change', updateProfileUI);

    // Xử lý chọn/chụp ảnh đại diện từ camera hoặc thư viện
    const photoEditBtn = document.getElementById('pp-photo-edit');
    const avatarInput = document.getElementById('pp-avatar-input');
    
    photoEditBtn?.addEventListener('click', () => {
      avatarInput?.click();
    });
    
    avatarInput?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const max_size = 150; // Kích thước nén avatar hợp lý để lưu Firestore
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > max_size) {
              height *= max_size / width;
              width = max_size;
            }
          } else {
            if (height > max_size) {
              width *= max_size / height;
              height = max_size;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          const base64Str = canvas.toDataURL('image/jpeg', 0.85);
          
          try {
            await AuthService.updateProfile({ photoURL: base64Str });
            window.location.reload();
          } catch (err) {
            console.error("Lỗi cập nhật ảnh đại diện:", err);
            alert("Không thể cập nhật ảnh đại diện: " + err.message);
          }
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });

    // Tải danh sách lịch trình từ database
    let trips = [];
    const urlParamsTrips = new URLSearchParams(window.location.search);
    const viewUserIdTrips = urlParamsTrips.get('userId');
    const isViewingOtherTrips = viewUserIdTrips && AuthService.getUser() && AuthService.getUser().id !== viewUserIdTrips && AuthService.getUser().uid !== viewUserIdTrips;

    if (!isViewingOtherTrips) {
        try {
          trips = await AuthService.getTrips();
        } catch (e) {
          console.warn("Không thể tải chuyến đi từ API, thử dùng demo.");
        }
    } else {
        // Ẩn phần lịch trình nếu đang xem profile người khác (vì chưa có API lấy lịch trình public)
        const stampsEl = document.querySelector('.passport-stamps');
        if (stampsEl) stampsEl.style.display = 'none';
    }

    // Hiển thị số lượng
    setText('pp-trips', String(trips.length));
    setText('stamps-count', `${trips.length} chuyến`);
    setText('pv2-stat-trips', String(trips.length));

    // Render danh sách chuyến đi ra giao diện
    renderTrips(trips);

    // Chuyển đổi hiển thị dạng lưới hoặc danh sách
    const toggleBtns = document.querySelectorAll('.view-btn');
    const stampsGrid = document.getElementById('stamps-grid');

    // Restore saved view mode
    const savedView = localStorage.getItem('topgo_trips_view_mode') || 'grid';
    if (savedView === 'list' && stampsGrid) {
        stampsGrid.classList.add('list-view');
        toggleBtns.forEach(b => {
            b.classList.toggle('active', b.dataset.view === 'list');
        });
    }

    toggleBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        toggleBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (btn.dataset.view === 'list') {
          stampsGrid.classList.add('list-view');
          localStorage.setItem('topgo_trips_view_mode', 'list');
        } else {
          stampsGrid.classList.remove('list-view');
          localStorage.setItem('topgo_trips_view_mode', 'grid');
        }
      });
    });

    // Chỉnh sửa hồ sơ
    const overlay = document.getElementById('pp-edit-overlay');
    document.getElementById('btn-edit-profile')?.addEventListener('click', () => {
      const user = AuthService.getUser() || {};
      document.getElementById('edit-lastname').value = user.lastname || '';
      document.getElementById('edit-firstname').value = user.firstname || '';
      const usernameInput = document.getElementById('edit-username');
      if (usernameInput) usernameInput.value = user.username || '';
      document.getElementById('edit-dob').value = user.dob || '';
      document.getElementById('edit-sex').value = user.sex || '';
      document.getElementById('edit-pob').value = user.pob || '';
      document.getElementById('edit-nationality').value = user.nationality || '';
      overlay.classList.remove('hidden');
    });
    document.getElementById('pp-edit-close')?.addEventListener('click', () => overlay.classList.add('hidden'));
    document.getElementById('btn-edit-cancel')?.addEventListener('click', () => overlay.classList.add('hidden'));
    overlay?.addEventListener('click', e => { if (e.target === overlay) overlay.classList.add('hidden'); });

    // Username validation logic
    const usernameInput = document.getElementById('edit-username');
    const usernameStatus = document.getElementById('username-status');
    let usernameTimeout;
    if (usernameInput) {
        usernameInput.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            if (usernameStatus) {
                usernameStatus.textContent = '';
                usernameStatus.style.color = '';
            }
            if (!val) return;
            
            clearTimeout(usernameTimeout);
            usernameTimeout = setTimeout(async () => {
                const user = AuthService.getUser();
                if (user && user.username === val) {
                    if (usernameStatus) {
                        usernameStatus.textContent = 'Username hiện tại';
                        usernameStatus.style.color = 'var(--sub)';
                    }
                    return;
                }
                if (usernameStatus) {
                    usernameStatus.textContent = 'Đang kiểm tra...';
                    usernameStatus.style.color = 'var(--sub)';
                }
                try {
                    const _isLocal = ['localhost', '127.0.0.1'].includes(window.location.hostname);
                    const API_BASE = _isLocal ? 'http://localhost:8000' : (window.__TOPGO_API_BASE__ || 'https://api.topgo.vn');
                    
                    const fetchRes = await fetch(`${API_BASE}/api/users/check-username?username=${val}`);
                    const res = await fetchRes.json();
                    if (res && res.available !== undefined) {
                        usernameStatus.textContent = res.message;
                        usernameStatus.style.color = res.available ? 'var(--success)' : 'var(--error)';
                    }
                } catch (err) {
                    if (usernameStatus) {
                        usernameStatus.textContent = 'Username không hợp lệ hoặc trùng';
                        usernameStatus.style.color = 'var(--error)';
                    }
                }
            }, 500);
        });
    }

    document.getElementById('btn-edit-save')?.addEventListener('click', async () => {
      try {
          const updated = await AuthService.updateProfile({
            lastname: document.getElementById('edit-lastname').value.trim(),
            firstname: document.getElementById('edit-firstname').value.trim(),
            username: document.getElementById('edit-username')?.value.trim(),
            dob: document.getElementById('edit-dob').value,
            sex: document.getElementById('edit-sex').value,
            pob: document.getElementById('edit-pob').value.trim(),
            nationality: document.getElementById('edit-nationality').value.trim(),
          });
          if (updated) window.location.reload();
      } catch (err) {
          import('./shared.js').then(module => {
              module.showToast(err.message, 'error');
          });
      }
    });

    // Đăng xuất
    document.getElementById('btn-logout')?.addEventListener('click', async () => {
      await AuthService.logout();
      window.location.href = './auth.html';
    });

    // Lọc tìm kiếm chuyến đi
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

    // ── V2 Tab Switching with Indicator ──
    const pv2Tabs = document.querySelectorAll('.pv2-tab');
    const pv2Indicator = document.querySelector('.pv2-tab-indicator');
    
    function updateTabIndicator(activeTab) {
        if (!pv2Indicator || !activeTab) return;
        pv2Indicator.style.left = activeTab.offsetLeft + 'px';
        pv2Indicator.style.width = activeTab.offsetWidth + 'px';
    }
    
    // Set initial indicator position
    const initialActive = document.querySelector('.pv2-tab.active');
    if (initialActive) {
        requestAnimationFrame(() => updateTabIndicator(initialActive));
    }
    
    pv2Tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            pv2Tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            updateTabIndicator(tab);
            
            const targetId = tab.dataset.tab;
            document.querySelectorAll('.pv2-tab-content').forEach(content => {
                content.classList.toggle('active', content.id === targetId);
            });
        });
    });
    
    // Recalculate on resize
    window.addEventListener('resize', () => {
        const activeTab = document.querySelector('.pv2-tab.active');
        if (activeTab) updateTabIndicator(activeTab);
    });

  });
}

function renderTrips(trips) {
  const grid = document.getElementById('stamps-grid');
  const empty = document.getElementById('stamps-empty');
  if (!grid) return;

  // Xóa các card cũ ngoại trừ card rỗng
  grid.querySelectorAll('.stamp-card').forEach(card => card.remove());

  if (trips.length === 0) {
    if (empty) empty.style.display = '';
    return;
  }
  if (empty) empty.style.display = 'none';

  // Lọc trùng lặp dựa vào id để tránh bị hiển thị lặp
  const uniqueTrips = [];
  const seenIds = new Set();
  trips.forEach(t => {
      if (!seenIds.has(t.id)) {
          seenIds.add(t.id);
          uniqueTrips.push(t);
      }
  });

  // Kiểm tra xem có đang xem profile người khác không
  const urlParamsTrips = new URLSearchParams(window.location.search);
  const viewUserIdTrips = urlParamsTrips.get('userId');
  let user = null;
  try { user = AuthService.getUser(); } catch(e){}
  const isViewingOtherTrips = viewUserIdTrips && user && user.id !== viewUserIdTrips && user.uid !== viewUserIdTrips;

  // Show global privacy toggle only if viewing own profile
  const globalPrivacyToggle = document.getElementById('trips-privacy-toggle');
  if (globalPrivacyToggle) {
    globalPrivacyToggle.style.display = !isViewingOtherTrips ? 'flex' : 'none';
  }

  uniqueTrips.forEach(trip => {
    const card = document.createElement('div');
    card.className = 'stamp-card';
    card.innerHTML = `
      <div class="stamp-main-info">
        <div class="stamp-dest-wrap">
          <span class="stamp-dest">${trip.destination || 'Chuyến đi'}</span>
        </div>
        <div class="stamp-meta">
          <span class="stamp-tag">${trip.days || '?'} ngày</span>
          <span class="stamp-tag">${trip.pax || '?'} người</span>
          ${trip.budget ? `<span class="stamp-tag">${Number(trip.budget).toLocaleString('vi-VN')}₫</span>` : ''}
        </div>
      </div>
      <div class="stamp-date">${trip.dateStart || ''} → ${trip.dateEnd || ''}</div>
      <div class="stamp-actions">
        <button class="stamp-btn" data-review="${trip.id}">Xem lại</button>
        <button class="stamp-btn danger" data-delete="${trip.id}">Xóa</button>
      </div>
    `;
    grid.appendChild(card);
  });

  // Gán sự kiện xem lại
  grid.querySelectorAll('[data-review]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = btn.dataset.review;
      const trip = trips.find(t => t.id === id);
      if (trip) {
        localStorage.setItem('topgo_review_plan', JSON.stringify(trip));
        window.location.href = './planner.html';
      }
    });
  });

  // Gán sự kiện xóa
  grid.querySelectorAll('[data-delete]').forEach(btn => {
    btn.addEventListener('click', async e => {
      e.stopPropagation();
      const id = btn.dataset.delete;
      if (confirm('Bạn chắc chắn muốn xóa lịch trình này?')) {
        try {
          await AuthService.deleteTrip(id);
          window.location.reload();
        } catch (error) {
          alert('Không thể xóa lịch trình: ' + error.message);
        }
      }
    });
  });
}



