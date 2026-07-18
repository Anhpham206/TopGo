import http.server
import socketserver
import mimetypes
import sys
import os

# Sửa lỗi MIME type trên Windows cho các module JavaScript
mimetypes.init()
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('image/svg+xml', '.svg')

PORT = 3000
Handler = http.server.SimpleHTTPRequestHandler

# Chuyển directory hiện tại tới thư mục chứa serve.py (tức là frontend)
os.chdir(os.path.dirname(os.path.abspath(__file__)))

try:
    from http.server import ThreadingHTTPServer as ServerClass
except ImportError:
    from socketserver import ThreadingTCPServer as ServerClass

ServerClass.allow_reuse_address = True

with ServerClass(("0.0.0.0", PORT), Handler) as httpd:
    print(f"Serving HTTP on 0.0.0.0 port {PORT} (with correct MIME types - Multi-threaded)")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received, exiting.")
        sys.exit(0)
