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

// Khởi tạo Firebase Web SDK an toàn
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
      photoUrl: user.photoURL || null,
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
      } catch (e) { }
    }
    localStorage.setItem('topgo_user', JSON.stringify(cachedUser));

    // Đồng bộ thông tin hồ sơ từ Firestore backend
    user.getIdToken(true).then(token => {
      localStorage.setItem('topgo_token', token);
      fetch(`${API_BASE}/api/users/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then(dbProfile => {
          if (dbProfile && (dbProfile.firstname || dbProfile.lastname || dbProfile.nationality || dbProfile.sex || dbProfile.dob || dbProfile.pob)) {
            // Ghi nhận các trường thay đổi từ database, giữ lại photoURL từ Google Auth làm dự phòng nếu DB trống
            const updatedUser = { ...cachedUser, ...dbProfile };
            if (!updatedUser.photoURL && user.photoURL) {
              updatedUser.photoURL = user.photoURL;
              updatedUser.photoUrl = user.photoURL;
              
              // Tự động đồng bộ ảnh đại diện Google lên Firestore để lưu trữ lâu dài
              fetch(`${API_BASE}/api/users/profile`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ photoURL: user.photoURL, photoUrl: user.photoURL })
              }).catch(e => console.error("Lỗi tự động đồng bộ ảnh Google:", e));
            }
            localStorage.setItem('topgo_user', JSON.stringify(updatedUser));
            window.dispatchEvent(new Event('topgo-auth-change'));
          } else {
            // Bản ghi profile chưa có trên Firestore, tiến hành tự động khởi tạo mặc định
            const nameParts = (user.displayName || '').trim().split(/\s+/);
            const firstname = nameParts.pop() || '';
            const lastname = nameParts.join(' ') || '';
            const initialProfile = {
              firstname: cachedUser.firstname || firstname || 'Thành viên',
              lastname: cachedUser.lastname || lastname || 'TopGo',
              email: user.email || '',
              photoURL: user.photoURL || '',
              nationality: 'Việt Nam',
              sex: '',
              dob: '',
              pob: ''
            };
            fetch(`${API_BASE}/api/users/profile`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(initialProfile)
            })
            .then(res => {
              if (res.ok) {
                const updatedUser = { ...cachedUser, ...initialProfile };
                localStorage.setItem('topgo_user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('topgo-auth-change'));
              }
            })
            .catch(err => console.error("Lỗi tự động khởi tạo profile:", err));
          }
        })
        .catch(err => {
          console.warn("Chưa có cấu hình profile hoặc lỗi kết nối:", err);
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
      photoUrl: null,
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
        const token = await firebaseUser.getIdToken(true);
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
    const url = updates.photoURL || updates.photoUrl;
    if (url) {
      user.photoURL = url;
      user.photoUrl = url;
    }
    this.setUser(user);
    window.dispatchEvent(new Event('topgo-auth-change'));
    return user;
  },


  // Saved Trips từ Backend FastAPI + Firestore
  async getTrips() {
    const user = await waitForAuth();
    if (!user) return [];
    try {
      const token = await user.getIdToken(true);
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
      const token = await user.getIdToken(true);

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
      const token = await user.getIdToken(true);
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
  },
  async getIdToken() {
    const user = await waitForAuth();
    if (!user) return null;
    return await user.getIdToken(true);
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

      ['err-reg-lastname', 'err-reg-firstname', 'err-reg-email', 'err-reg-password', 'err-reg-confirm', 'err-register-global']
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
// ── Logic trang Hồ sơ cá nhân (profile.html) đã được chuyển toàn bộ sang profile.js ──



async function seedDemoTrips() {
  const demos = [
    { destination: 'Đà Nẵng', days: 3, pax: 2, budget: 5000000, dateStart: '2026-06-15', dateEnd: '2026-06-17' },
    { destination: 'Phú Quốc', days: 4, pax: 4, budget: 12000000, dateStart: '2026-07-01', dateEnd: '2026-07-04' },
    { destination: 'Sapa', days: 2, pax: 3, budget: 3000000, dateStart: '2026-08-10', dateEnd: '2026-08-11' },
  ];
  for (const d of demos) {
    try {
      await AuthService.saveTrip(d);
    } catch (e) {
      console.warn("Failed to seed demo trip:", e);
    }
  }
}
// ── Expose Firebase auth instance (dùng bởi postUpload.js để lấy ID token) ──
// Không ảnh hưởng bất kỳ logic nào khác.
export function getFirebaseAuthInstance() {
  return auth;
}