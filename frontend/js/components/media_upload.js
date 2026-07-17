// ── CẤU HÌNH SUPABASE ──
import { supabaseConfig } from '../supabaseConfig.js';
const SUPABASE_URL      = supabaseConfig.url;
const SUPABASE_ANON_KEY = supabaseConfig.anonKey;
const SUPABASE_BUCKET   = supabaseConfig.bucket;

const IMAGE_MAX_PX  = 1080;   // max chiều dài/rộng ảnh
const IMAGE_QUALITY = 0.82;   // JPEG quality
const VIDEO_MAX_MB  = 50;     // giới hạn video
const IMAGE_MAX_MB  = 10;     // giới hạn ảnh gốc

/** Nén ảnh bằng Canvas → Blob (nhanh hơn base64 ~33%) */
function compressImageToBlob(file) {
  return new Promise((resolve, reject) => {
    if (file.size / 1024 / 1024 > IMAGE_MAX_MB) {
      return reject(new Error(`Ảnh quá lớn (tối đa ${IMAGE_MAX_MB}MB)`));
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > IMAGE_MAX_PX || h > IMAGE_MAX_PX) {
          if (w > h) { h = Math.round(h * IMAGE_MAX_PX / w); w = IMAGE_MAX_PX; }
          else       { w = Math.round(w * IMAGE_MAX_PX / h); h = IMAGE_MAX_PX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob(blob => {
          blob ? resolve(blob) : reject(new Error("Không thể nén ảnh"));
        }, 'image/jpeg', IMAGE_QUALITY);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Upload 1 file lên Supabase Storage với progress callback.
 * @param {File} file
 * @param {'image'|'video'} type
 * @param {Function} onProgress  - callback(percent: 0-100)
 * @returns {Promise<string>}    - download URL
 */
export async function uploadMedia(file, type = 'image', onProgress = null) {
  if (type === 'video') {
    const mb = file.size / 1024 / 1024;
    if (mb > VIDEO_MAX_MB) throw new Error(`Video quá lớn (tối đa ${VIDEO_MAX_MB}MB)`);
  }

  // Với ảnh: nén trước; với video: upload thẳng
  const blob = type === 'image' ? await compressImageToBlob(file) : file;

  const ext  = type === 'image' ? 'jpg' : (file.name.split('.').pop() || 'mp4');
  const path = `posts/${type}s/${type}_${Date.now()}_${Math.random().toString(36).slice(2,7)}.${ext}`;
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${path}`;

  console.log('[TopGo][MediaUpload] Bắt đầu upload lên Supabase:', uploadUrl);

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    // Theo dõi tiến trình upload
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      console.log('[TopGo][MediaUpload] Supabase status:', xhr.status, xhr.responseText);
      if (xhr.status === 200 || xhr.status === 201) {
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
        resolve(publicUrl);
      } else {
        let errMsg = `Supabase lỗi HTTP ${xhr.status}`;
        try {
          const data = JSON.parse(xhr.responseText);
          errMsg = data?.message || data?.error || errMsg;
        } catch {}
        reject(new Error(errMsg));
      }
    });

    xhr.addEventListener('error', (err) => {
      console.error('[TopGo][MediaUpload] Lỗi mạng/CORS:', err);
      reject(new Error('Lỗi CORS hoặc kết nối mạng khi tải lên Supabase Storage.'));
    });

    xhr.addEventListener('abort', () => reject(new Error('Upload bị hủy.')));

    xhr.open('POST', uploadUrl);

    // Headers cho Supabase Storage REST API
    xhr.setRequestHeader('Authorization', `Bearer ${SUPABASE_ANON_KEY}`);
    xhr.setRequestHeader('apikey',        SUPABASE_ANON_KEY);
    xhr.setRequestHeader('Content-Type',  type === 'image' ? 'image/jpeg' : file.type);
    xhr.setRequestHeader('x-upsert',      'true');

    xhr.send(blob);
  });
}

// Giữ tên cũ để backward compatible
export async function compressAndUploadImage(file) {
  return uploadMedia(file, 'image');
}

window.compressAndUploadImage = compressAndUploadImage;
window.uploadMedia = uploadMedia;

