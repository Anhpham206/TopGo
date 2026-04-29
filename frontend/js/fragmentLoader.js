/* 
  ========================================================================
  FILE: fragmentLoader.js
  CHỨC NĂNG: 
  - Tiện ích hỗ trợ mô hình SPA (Single Page Application) cục bộ.
  - Hàm \`fetchHtmlFragment\`: Fetch bất kỳ file HTML tĩnh nào (từ thư mục \`components/\`) thông qua Fetch API.
  - Tích hợp logic kiểm tra lỗi, nhận diện file trả về sai định dạng (vd: server trả fallback index.html thay vì fragment) để cảnh báo kịp thời.
  ========================================================================
*/
function previewText(text, maxLen = 120) {
    const compact = (text || '').replace(/\s+/g, ' ').trim();
    return compact.length > maxLen ? compact.slice(0, maxLen) + '...' : compact;
}

export async function fetchHtmlFragment(name, url) {
    const href = url instanceof URL ? url.href : String(url);
    console.info(`[TopGo][FragmentLoader] Fetching ${name}: ${href}`);

    const res = await fetch(url, { cache: 'no-store' });
    const text = await res.text();
    const meta = {
        name,
        url: href,
        ok: res.ok,
        status: res.status,
        length: text.length,
        preview: previewText(text),
    };

    if (!res.ok) {
        throw new Error(`[${name}] HTTP ${res.status} at ${href}`);
    }

    // Guard: nếu server trả về full HTML page (index.html fallback) thay vì fragment
    // Điều này xảy ra khi Live Server root không trỏ đúng vào /frontend
    if (/^\s*<!DOCTYPE/i.test(text)) {
        throw new Error(
            `[${name}] Server tra ve full HTML page (DOCTYPE) thay vi HTML fragment. ` +
            `Kiem tra Live Server root: phai set "liveServer.settings.root": "/frontend" ` +
            `trong .vscode/settings.json. URL: ${href}`
        );
    }

    console.info(
        `[TopGo][FragmentLoader] Loaded ${name}: status=${meta.status}, length=${meta.length}`
    );
    return { text, meta };
}
