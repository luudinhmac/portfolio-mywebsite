/**
 * admin-layout.js
 * Dùng chung cho tất cả trang Admin:
 *  1. Kiểm tra JWT token → redirect về /sys-login nếu thiếu
 *  2. Inject admin-header.html và admin-footer.html vào trang
 *  3. Đánh dấu active link theo pathname hiện tại
 *  4. Xử lý nút Đăng xuất
 */

(function initAdminLayout() {
    // ── 1. Auth Guard ─────────────────────────────────────────
    const token = localStorage.getItem('token');
    if (!token && !window.location.pathname.includes('/sys-login')) {
        window.location.href = '/sys-login';
        return;
    }

    if(token && !window.location.pathname.includes('/sys-login')) {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            window.currentUser = payload; // Global attach
            
            // Hide admin stuff if not admin
            document.addEventListener('DOMContentLoaded', () => {
                if(payload.role !== 'admin') {
                    document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
                }
            });
        } catch(e) {
            localStorage.removeItem('token');
            window.location.href = '/sys-login';
        }
    }

    // ── 2. Logout Button Handler ──────────────────────────────
    document.addEventListener('click', (e) => {
        if (e.target.closest('#logoutBtn')) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = '/sys-login';
        }
    });
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
