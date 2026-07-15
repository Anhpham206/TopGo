import os
import re
import subprocess

def resolve_file(filepath, resolver_func):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Regex to find conflict blocks
    pattern = re.compile(r'<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> origin/main\n?', re.DOTALL)
    
    def replacer(match):
        head_content = match.group(1)
        main_content = match.group(2)
        return resolver_func(head_content, main_content)

    new_content = pattern.sub(replacer, content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Resolved {filepath}")

def resolve_ai_logic(head, main):
    return head + "\n"

def resolve_gitignore(head, main):
    return head + "\n" + main + "\n"

def resolve_main_js(head, main):
    res = """
    if (isNonsensicalText(val)) { 
        showToast('Phản hồi không rõ ràng. Vui lòng mô tả cụ thể hơn để hệ thống cập nhật chính xác.', 'error'); 
        return; 
    }
    
    if (!window._lastPayload) {
        showToast('Không tìm thấy dữ liệu yêu cầu lịch trình ban đầu.', 'error');
        return;
    }

    const btn = document.querySelector('.btn-feedback') || document.getElementById('btn-feedback');
    """
    return res

def resolve_shared_js(head, main):
    res = """
            if (iconEl && user.photoURL && user.photoURL !== 'undefined' && user.photoURL !== 'null') {
                const borderStyle = user.is_vip ? 'border: 2px solid #ffb347;' : '';
                iconEl.innerHTML = `<img src="${user.photoURL}" alt="Avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;${borderStyle}">`;
            } else if (iconEl) {
                const initial = (user.firstname || user.email || 'T').charAt(0).toUpperCase();
                iconEl.innerHTML = `<span style="font-weight: 700; color: var(--p1); font-size: 14px;">${initial}</span>`;
    """
    return res

def resolve_auth_js(head, main):
    return head + "\n"

def resolve_css(head, main):
    return head + "\n" + main + "\n"

def run(cmd):
    print(f"Running: {cmd}")
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    print("STDOUT:", res.stdout)
    if res.stderr:
        print("STDERR:", res.stderr)
    print("RETURN_CODE:", res.returncode)
    print("-" * 40)
    return res.returncode

def main():
    base = r"c:\Users\Trung Kien\Downloads\FOR STUDYING\TDTT\main project\TopGo"
    resolve_file(os.path.join(base, ".gitignore"), resolve_gitignore)
    resolve_file(os.path.join(base, "backend", "app", "services", "ai_logic", "ai_logic.py"), resolve_ai_logic)
    resolve_file(os.path.join(base, "frontend", "css", "pricing.css"), resolve_css)
    resolve_file(os.path.join(base, "frontend", "css", "result.css"), resolve_css)
    resolve_file(os.path.join(base, "frontend", "js", "auth.js"), resolve_auth_js)
    resolve_file(os.path.join(base, "frontend", "js", "main.js"), resolve_main_js)
    resolve_file(os.path.join(base, "frontend", "js", "shared.js"), resolve_shared_js)

    # After resolving, complete the merge
    run("git add .")
    run("git commit --no-edit")
    
    # Push to origin
    run("git push -u origin kien-social-update")

if __name__ == "__main__":
    main()
