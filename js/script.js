document.addEventListener("DOMContentLoaded", () => {
    
    // --- KHAI BÁO BIẾN ---
    const navbar = document.getElementById("navbar");
    const menuToggle = document.querySelector(".menu-toggle");
    const mobileMenu = document.querySelector(".mobile-menu");
    const mobileClose = document.querySelector(".mobile-menu-close");
    const mobileLinks = document.querySelectorAll(".mobile-menu a");
    const sections = document.querySelectorAll("section");
    const navLinks = document.querySelectorAll(".nav-links a");

    // --- HIỆU ỨNG NAVBAR (SCROLL & STICKY) ---
    window.addEventListener("scroll", () => {
        if (window.scrollY > 50) {
            navbar.classList.add("scrolled");
        } else {
            navbar.classList.remove("scrolled");
        }
    });

    // --- ĐIỀU CHỈNH ACTIVE LINK TRÊN NAVBAR KHI SCROLL ---
    window.addEventListener("scroll", () => {
        let current = "";
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollY >= (sectionTop - 200)) {
                current = section.getAttribute("id");
            }
        });

        navLinks.forEach(link => {
            link.classList.remove("active");
            if (link.getAttribute("href").includes(current)) {
                link.classList.add("active");
            }
        });
    });

    // --- ĐIỀU HƯỚNG MOBILE MENU ---
    menuToggle.addEventListener("click", () => {
        mobileMenu.classList.add("active");
        document.body.style.overflow = "hidden"; // Ngăn cuộn trang
    });

    const closeMobileMenu = () => {
        mobileMenu.classList.remove("active");
        document.body.style.overflow = "auto";
    };

    mobileClose.addEventListener("click", closeMobileMenu);
    
    // Đóng menu khi click vào 1 link
    mobileLinks.forEach(link => {
        link.addEventListener("click", closeMobileMenu);
    });

    // --- HIỆU ỨNG XUẤT HIỆN KHI SCROLL (SCROLL REVEAL) ---
    const revealElements = document.querySelectorAll(".reveal");

    const revealFunction = () => {
        const windowHeight = window.innerHeight;
        const revealPoint = 150;

        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            
            if (elementTop < windowHeight - revealPoint) {
                element.classList.add("active");
            }
        });
    };

    // Kích hoạt ngay lần đầu load trang
    window.addEventListener("scroll", revealFunction);
    revealFunction();
    
    // --- THÊM SMOOTH SCROLLING (NẾU CSS scroll-behavior KHÔNG HỖ TRỢ TRÊN TRÌNH DUYỆT CŨ) ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if(targetId === '#') return;
            
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            
            if(targetElement) {
                const navHeight = navbar.offsetHeight;
                window.scrollTo({
                    top: targetElement.offsetTop - navHeight + 20,
                    behavior: 'smooth'
                });
            }
        });
    });
});
