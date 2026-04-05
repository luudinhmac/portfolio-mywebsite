# 🚀 Portfolio & Blog System - Lưu Đình Mác

Chào mừng bạn đến với repo của hệ thống **Portfolio & Blog cá nhân**. Đây là một nền tảng được thiết kế chuyên biệt cho **System Engineer & Ops** để chia sẻ kiến thức kỹ thuật, quản lý dự án và tương tác với cộng đồng.

---

## 🌟 Tính Năng Nổi Bật

### 📝 Hệ thống Blog Hiện Đại
- **📊 Chỉ số tương tác**: Theo dõi lượt xem tự động, tổng số bình luận và lượt yêu thích.
- **❤️ Thả tim (Like/Unlike)**: Chức năng Like/Unlike cho người dùng đã đăng nhập (Giới hạn 1 like/user/bài viết).
- **🔍 Tìm kiếm tức thì (Universal Search)**: Tìm kiếm AJAX siêu tốc ngay khi gõ trên Sidebar (Hỗ trợ tìm theo Tiêu đề, Nội dung, Danh mục, Series và Tác giả).
- **📄 Nhập liệu từ Word**: Hỗ trợ Parser chuyển đổi file `.docx` sang HTML chỉ trong một lần upload.
- **📌 Ghim bài viết**: Admin có quyền ghim bài viết quan trọng lên đầu danh sách.

### ⚙️ Quản trị Toàn Diện (Admin Panel)
- **👥 Quản lý người dùng**: Phân quyền Admin/User, quản lý danh sách và đổi mật khẩu an toàn.
- **🏷️ Phân loại nội dung**: Quản lý đa tầng theo Danh mục (Category) và Chuỗi bài viết (Series).
- **👤 Hồ sơ cá nhân**: Tùy chỉnh Avatar, Số điện thoại, Ngày sinh, Địa chỉ.
- **👤 Avatar Mặc định**: Tự động hiển thị "Silhouette professional" nếu người dùng chưa đặt avatar.

### 🔒 Bảo mật & Tối ưu
- **🛡️ Authentication**: Sử dụng JWT (JSON Web Token) kết hợp với mã hóa mật khẩu BcryptJS.
- **✨ Login Modal Overlay**: Chuyển đổi từ trang đăng nhập tĩnh sang cửa sổ bật lên (Modal) hiện đại với hiệu ứng Glassmorphism (làm mờ hậu cảnh), giúp trải nghiệm người dùng liền mạch hơn.
- **⚡ Performance**: Tối ưu hóa truy vấn MariaDB, giao diện Responsive mượt mà trên Mobile/Tablet.

---

## 🛠️ Công Nghệ Sử Dụng

- **Backend**: Node.js, Express Framework.
- **Database**: MariaDB (MySql2 Driver).
- **Frontend**: EJS Template Engine, Vanilla CSS & Vanilla JavaScript.
- **Design**: Font Inter (Google Fonts), Font Awesome 6 Icons.
- **Deploy**: Hỗ trợ chạy Node.js thuần hoặc Docker.

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy

### 1. Chạy trên Local (Development)
Yêu cầu: Node.js >= 18.x, MySQL/MariaDB.

1.  **Clone dự án**:
    ```bash
    git clone [repo_url]
    cd portfolio-mywebsite
    ```
2.  **Cài đặt thư viện**:
    ```bash
    npm install
    ```
3.  **Cấu hình môi trường**:
    Tạo file `.env` tại thư mục gốc với các thông số:
    ```env
    PORT=3000
    DB_HOST=localhost
    DB_USER=root
    DB_PASS=your_password
    DB_NAME=portfolio_db
    JWT_SECRET=your_super_secret_key
    ```
4.  **Chạy server**:
    ```bash
    node server.js
    ```
    Truy cập tại: `http://localhost:3000`

### 2. Chạy trên Production (Docker)
1.  **Build & Run**:
    ```bash
    docker-compose up -d --build
    ```
2.  **Cấu hình Remote DB**: Đảm bảo khai báo đúng IP Server MariaDB trong `.env`.

---

## 📂 Cấu Trúc Thư Mục
```text
├── public/          # Tài nguyên tĩnh (CSS, JS, Images, Uploads)
├── src/             # Logic Backend
│   ├── config/      # Kết nối Database
│   ├── controllers/ # Xử lý nghiệp vụ (Auth, Post, User...)
│   ├── middleware/  # Kiểm soát truy cập (JWT)
│   └── routes/      # Định tuyến API và Views
├── views/           # Giao diện EJS Templates
│   ├── admin/       # Trang quản trị
│   ├── blog/        # Trang công cộng
│   └── partials/    # Thành phần dùng chung (Header, Footer)
└── .agent/          # Quy tắc vận hành của Agent trợ lý (ROLES & RULES)
```

---

## 🌿 Quy Tắc Phát Triển
Để giữ mã nguồn sạch sẽ, vui lòng tuân thủ quy tắc Commit tại:
`[.agent/skills/master-rules/SKILL.md](file:///d:/DATA/Portfolio/.agent/skills/master-rules/SKILL.md)`

- **Format:** `type(scope): message`
- **Example:** `feat(blog): add heart toggle animation`

---
Copyright © 2026 - **Lưu Đình Mác**
