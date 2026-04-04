/**
 * admin-layout.js
 * Dùng chung cho tất cả trang Admin:
 *  1. Kiểm tra JWT token → redirect về /sys-login nếu thiếu
 *  2. Inject admin-header.html và admin-footer.html vào trang
 *  3. Đánh dấu active link theo pathname hiện tại
 *  4. Xử lý nút Đăng xuất
 */

(async function initAdminLayout() {
    // ── 1. Auth Guard ─────────────────────────────────────────
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/sys-login';
        return;
    }

    // ── 2. Inject Header ──────────────────────────────────────
    const headerPlaceholder = document.getElementById('admin-header');
    if (headerPlaceholder) {
        try {
            const res = await fetch('/partials/admin-header.html');
            if (!res.ok) throw new Error('Cannot load header partial');
            headerPlaceholder.innerHTML = await res.text();

            // Mark active nav link
            const currentPath = window.location.pathname;
            headerPlaceholder.querySelectorAll('a[data-path]').forEach(link => {
                if (currentPath === link.getAttribute('data-path') ||
                    currentPath.startsWith(link.getAttribute('data-path'))) {
                    link.classList.add('active');
                }
            });

            // Logout button
            const logoutBtn = document.getElementById('logoutBtn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    localStorage.removeItem('token');
                    window.location.href = '/sys-login';
                });
            }
        } catch (err) {
            console.error('Admin header load error:', err);
        }
    }

    // ── 3. Inject Footer ──────────────────────────────────────
    const footerPlaceholder = document.getElementById('admin-footer');
    if (footerPlaceholder) {
        try {
            const res = await fetch('/partials/admin-footer.html');
            if (!res.ok) throw new Error('Cannot load footer partial');
            footerPlaceholder.innerHTML = await res.text();
        } catch (err) {
            console.error('Admin footer load error:', err);
        }
    }
})();

// ── Helper: lấy token từ localStorage ────────────────────────
function getToken() {
    return localStorage.getItem('token');
}

// ── Helper: hiển thị thông báo alert ─────────────────────────
function showAlert(elementId, message, type = 'error') {
    const el = document.getElementById(elementId);
    if (!el) return;
    el.className = `alert alert-${type} show`;
    el.innerHTML = `<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'exclamation-circle'}"></i> ${message}`;
    if (type === 'success' || type === 'info') {
        setTimeout(() => el.classList.remove('show'), 4000);
    }
}

// ── Helper: format ngày theo vi-VN ───────────────────────────
function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit', month: '2-digit', year: 'numeric'
    });
}
