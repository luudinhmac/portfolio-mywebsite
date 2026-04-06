/**
 * admin-layout.js
 * Dùng chung cho tất cả trang Admin:
 *  1. Kiểm tra JWT token → redirect về /sys-login nếu thiếu
 *  2. Inject admin-header.html và admin-footer.html vào trang
 *  3. Đánh dấu active link theo pathname hiện tại
 *  4. Xử lý nút Đăng xuất
 */

(function initAdminLayout() {
    // --- 1. Auth Guard ---
    const checkAuth = async () => {
        const user = JSON.parse(sessionStorage.getItem('currentUser') || 'null');
        
        // Nếu không có user trong session, thử check server một lần nữa
        if (!user) {
            try {
                const res = await fetch('/api/me', { credentials: 'include' });
                if ((res.status === 401 || res.status === 403) && window.location.pathname.startsWith('/manage_')) {
                    sessionStorage.removeItem('currentUser');
                    window.location.href = '/';
                    return;
                }
                const data = await res.json();
                sessionStorage.setItem('currentUser', JSON.stringify(data.user));
                window.currentUser = data.user;
            } catch (err) {
                if (window.location.pathname.startsWith('/manage_')) {
                    sessionStorage.removeItem('currentUser');
                    window.location.href = '/';
                }
            }
        } else {
            window.currentUser = user;
        }

        // Ẩn các phần tử admin nếu không phải admin
        if(window.currentUser && window.currentUser.role !== 'admin') {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'none');
        }
    };

    document.addEventListener('DOMContentLoaded', checkAuth);

    // --- 2. Logout Button Handler (Dùng chung với header.ejs) ---
    // Header.ejs đã xử lý nút này, nên ở đây ta chỉ cần bám vào logic đó nếu cần thiết.
})();

// --- Helper: Không còn cần thiết vì dùng Cookie ---
function getToken() {
    return null; 
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
