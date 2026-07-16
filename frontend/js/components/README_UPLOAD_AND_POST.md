# 📸 Tài liệu Kỹ thuật: Supabase Storage & Cơ chế Đăng bài lên News Feed

Thư mục này chứa các module xử lý **upload media** và **tạo bài viết** cho tính năng News Feed của **TopGo**. Tài liệu này mô tả chi tiết cách kết nối Supabase Storage, quy trình upload ảnh/video, cơ chế kiểm duyệt nội dung bằng AI, và luồng dữ liệu từ frontend đến Firestore phục vụ việc bảo trì và phát triển tính năng.

---

## 📌 1. Bản đồ Kiến trúc Module (`frontend/js/components/`)

| File | Vai trò & Trách nhiệm |
| :--- | :--- |
| [`media_upload.js`](./media_upload.js) | **Storage Layer**: Nén ảnh bằng Canvas API và upload file lên Supabase Storage với theo dõi tiến trình realtime. Cung cấp hàm `uploadMedia()` và `compressAndUploadImage()`. |
| [`post_create_modal.js`](./post_create_modal.js) | **UI Controller**: Toàn bộ logic giao diện modal tạo bài viết — upload song song, tag địa điểm, đính kèm lịch trình, gửi bài về backend. |
| [`share_modal.js`](./share_modal.js) | **Share UI**: Giao diện cấu hình quyền chia sẻ lịch trình (Private / Unlisted / Public lên News Feed). |

---

## ⚙️ 2. Hướng dẫn Cài đặt & Kết nối Supabase Storage

### Bước 1: Tạo bucket trên Supabase Dashboard

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard) → chọn project **TopGo**
2. Vào **Storage → New Bucket**
3. Đặt tên bucket: `post-images`
4. Bật **Public bucket** để ảnh có thể truy cập công khai qua URL
5. **Cấu hình Storage Policies (Thiết lập Public để Test):**
   - Vẫn ở màn hình Storage, nhìn sang menu bên trái, chọn **Policies**.
   - Kéo xuống tìm bucket `post-images`, bấm nút **New Policy**.
   - Chọn **For Full Customization** (Tạo policy tùy chỉnh).
   - Đặt tên Policy Name: `Public Access for Testing`
   - **Allowed Operations**: Tích chọn **TẤT CẢ** (SELECT, INSERT, UPDATE, DELETE).
   - Ở mục **Target Roles**: Để trống (hoặc chọn `anon`, `public`).
   - Ở mục **USING expression**, gõ vào: `true`
   - Ở mục **WITH CHECK expression**, gõ vào: `true`
   - Bấm **Save policy**. 
   > **Lưu ý cho Leader:** Cấu hình `true` này nhằm mục đích public toàn quyền cho DEV/TEST dễ dàng upload ảnh mà không bị lỗi 403 Forbidden. Khi lên Production, Leader cần siết lại Policy này (ví dụ: chỉ cho phép `authenticated` users được INSERT/UPDATE).

### Bước 2: Lấy thông tin API Key

1. Vào **Project Settings → API**
2. Sao chép hai giá trị:
   - **Project URL** → điền vào trường `url`
   - **anon / public** key → điền vào trường `anonKey`

### Bước 3: Tạo file cấu hình local

```bash
# Copy file mẫu (Windows)
copy frontend\js\supabaseConfig_example.js frontend\js\supabaseConfig.js

# Copy file mẫu (macOS / Linux)
cp frontend/js/supabaseConfig_example.js frontend/js/supabaseConfig.js
```

Mở `supabaseConfig.js` và điền thông tin thật từ Bước 2:

```js
// frontend/js/supabaseConfig.js
export const supabaseConfig = {
  url:     'https://<project-ref>.supabase.co',   // ← dán Project URL vào đây
  anonKey: '<your-supabase-anon-key>',             // ← dán anon/public key vào đây
  bucket:  'post-images',                          // ← giữ nguyên nếu dùng tên mặc định
};
```

> ⚠️ **Quan trọng:** File `supabaseConfig.js` đã được thêm vào `.gitignore` — **tuyệt đối không commit** file này lên git. File mẫu `supabaseConfig_example.js` là file được commit để teammate tham khảo và làm theo.

---

## 🖼️ 3. Cơ chế Upload Ảnh & Video

### 3.1 Quy trình nén ảnh (tự động, trước khi upload)

Để giảm băng thông và tăng tốc độ tải, mọi ảnh đều được **nén tự động** bằng Canvas API trước khi gửi lên Supabase. Video được upload trực tiếp (không nén).

```
File ảnh gốc (PNG / JPG / HEIC / WebP...)
         │
         ▼
  compressImageToBlob()          ← Canvas API
         │  • Resize về tối đa 1080px (giữ tỉ lệ)
         │  • Chuyển đổi sang định dạng JPEG
         │  • Nén với quality = 82%
         ▼
  Blob (giảm ~30–50% dung lượng)
         │
         ▼
  Upload lên Supabase Storage
```

Các tham số có thể điều chỉnh trong [`media_upload.js`](./media_upload.js):

| Hằng số | Giá trị mặc định | Ý nghĩa |
| :--- | :---: | :--- |
| `IMAGE_MAX_PX` | `1080` | Kích thước tối đa (px) của chiều dài hoặc rộng |
| `IMAGE_QUALITY` | `0.82` | Chất lượng JPEG — từ 0.0 (thấp nhất) đến 1.0 (lossless) |
| `IMAGE_MAX_MB` | `10` | Giới hạn dung lượng file ảnh gốc (MB) |
| `VIDEO_MAX_MB` | `50` | Giới hạn dung lượng file video (MB) |

### 3.2 Cấu trúc đường dẫn lưu file trên bucket

```
post-images/                          ← tên bucket
└── posts/
    ├── images/
    │   └── image_<timestamp>_<id>.jpg   ← ảnh đã nén
    └── videos/
        └── video_<timestamp>_<id>.mp4   ← video gốc
```

Ví dụ URL công khai sau khi upload thành công:
```
https://<project-ref>.supabase.co/storage/v1/object/public/post-images/posts/images/image_1721100000000_k3x9f.jpg
```

### 3.3 Gọi hàm upload trong code

```js
import { uploadMedia } from './components/media_upload.js';

// Upload ảnh — có progress callback (0 → 100%)
const publicUrl = await uploadMedia(file, 'image', (percent) => {
  progressBar.style.width = percent + '%';
});

// Upload video
const videoUrl = await uploadMedia(file, 'video', onProgress);

// Tương thích ngược — chỉ upload ảnh, không cần progress
const url = await compressAndUploadImage(file);
```

---

## 📝 4. Cơ chế Đăng bài & Hiển thị trên News Feed

### 4.1 Nhúng Modal Tạo bài vào trang

Để sử dụng tính năng tạo bài trong một trang HTML mới:

**Bước 1** — Thêm container vào HTML:
```html
<div id="post-modal-container"></div>
```

**Bước 2** — Khởi tạo bằng JS:
```html
<script type="module">
  import('./js/components/post_create_modal.js').then(m => m.initPostModal());
</script>
```

**Bước 3** — Mở modal khi người dùng nhấn nút:
```html
<button onclick="window.openPostModal()">✏️ Tạo bài viết</button>
```

> Modal hỗ trợ tối đa **10 ảnh** và **1 video** trong cùng một bài. Upload diễn ra **song song** để tối ưu tốc độ.

### 4.2 Luồng xử lý khi người dùng nhấn "Đăng bài"

```
① Người dùng nhấn "Đăng bài"
         │
         ▼
② Lấy Firebase ID Token
   window.TopGoAuth?.getIdToken()
   → Chưa đăng nhập? → Báo lỗi, dừng lại.
         │
         ▼
③ Gửi yêu cầu lên Backend
   POST /api/posts/create
   ┌─ Header: Authorization: Bearer <firebase_id_token>
   └─ Body (JSON):
      {
        "content": "Nội dung bài viết...",
        "mediaUrls": ["https://...jpg", "https://...mp4"],
        "taggedLocations": ["Hội An", "Đà Nẵng"],
        "itineraryId": "abc123"   ← null nếu không đính kèm lịch trình
      }
         │
         ▼  ── FastAPI Backend ──
④ Xác thực Firebase Token
   verify_firebase_token()         ← firebase_service.py
   → Token không hợp lệ? → Trả lỗi 401.
   → Hợp lệ? → Lấy uid người dùng, tiếp tục.
         │
         ▼
⑤ Kiểm duyệt nội dung bằng AI
   check_content_safety(content)   ← ai_moderation.py
   → Gemini 1.5 Flash phân tích văn bản
   → "UNSAFE"? → Trả lỗi 400, bài không được lưu.
   → "SAFE"?   → Tiếp tục.
         │
         ▼
⑥ Lưu vào Firestore
   db.collection("posts").document(post_id).set(doc_data)
         │
         ▼
⑦ Phản hồi thành công
   → { "status": "success", "id": "post-..." }
   → Frontend hiển thị toast "🎉 Đã đăng bài thành công!"
   → Modal tự đóng sau 1.8 giây
```

### 4.3 Cơ chế AI Kiểm duyệt nội dung

Tính năng này sử dụng **Gemini 1.5 Flash** để tự động lọc nội dung vi phạm trước khi lưu vào cơ sở dữ liệu.

File xử lý: `backend/app/services/ai_logic/ai_moderation.py`

| Kết quả trả về từ Gemini | Hành động của hệ thống |
| :--- | :--- |
| `SAFE` | Cho phép lưu bài vào Firestore, trả về thành công |
| `UNSAFE` | Từ chối lưu, trả lỗi HTTP 400 kèm thông báo vi phạm |
| Lỗi kết nối API | Fallback: coi là `SAFE` — không chặn người dùng oan |

Các loại nội dung bị kiểm tra: *chửi thề, thù địch, đồi trụy, phản động, lừa đảo.*

---

## 🗃️ 5. Cấu trúc Dữ liệu

### Firestore — Collection `posts`

```
posts/
└── post-<timestamp>/
      ├── id              : "post-1721100000000"
      ├── authorId        : "firebase_uid_abc123"        ← uid người đăng
      ├── content         : "Chuyến đi Hội An tuyệt vời!"
      ├── mediaUrls       : ["https://...jpg", "https://...mp4"]
      ├── taggedLocations : ["Hội An", "Phố Cổ"]
      ├── itineraryId     : "itinerary-xyz" | null
      ├── likeCount       : 0
      ├── commentCount    : 0
      ├── hotScore        : 0
      └── createdAt       : Timestamp (SERVER_TIMESTAMP)
```

### Supabase Storage — Bucket `post-images`

```
post-images/
└── posts/
    ├── images/
    │   └── image_<timestamp>_<randomId>.jpg    ← JPEG, đã nén (quality 82%)
    └── videos/
        └── video_<timestamp>_<randomId>.mp4    ← video gốc, không nén
```

---

## 🛠️ 6. Tham chiếu Nhanh cho Dev

| Việc cần làm | File cần chỉnh sửa | Vị trí cụ thể |
| :--- | :--- | :--- |
| Cập nhật Supabase key | `frontend/js/supabaseConfig.js` | Các trường `url`, `anonKey` |
| Thay đổi giới hạn kích thước ảnh | `media_upload.js` | Hằng số `IMAGE_MAX_PX`, `IMAGE_MAX_MB` |
| Thay đổi chất lượng nén ảnh | `media_upload.js` | Hằng số `IMAGE_QUALITY` |
| Thay đổi giới hạn video | `media_upload.js` | Hằng số `VIDEO_MAX_MB` |
| Chỉnh sửa prompt AI kiểm duyệt | `ai_moderation.py` | Hàm `check_content_safety()` |
| Thêm trường dữ liệu vào bài đăng | `post_controller.py` | Class `CreatePostRequest` và dict `doc_data` |
| Chỉnh sửa giao diện modal | `post_create_modal.js` | Hàm `initPostModal()` |
| Thay đổi tên bucket | `supabaseConfig.js` | Trường `bucket` |
