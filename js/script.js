// Бургер-меню
const burgerBtn = document.getElementById("burger-btn");
const navMenu = document.getElementById("nav-menu");
const body = document.body;

burgerBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");
    body.classList.toggle("menu-open");

    // Меняем иконку ☰ / ✖
    if (navMenu.classList.contains("active")) {
        burgerBtn.textContent = "✖";
        burgerBtn.style.fontSize = "24px";
        burgerBtn.style.lineHeight = "1";
    } else {
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});

// Закрытие меню при клике на ссылку
const navLinks = document.querySelectorAll('.nav__list a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        navMenu.classList.remove("active");
        body.classList.remove("menu-open");
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    });
});

// Закрытие меню при клике вне его
document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && 
        !burgerBtn.contains(e.target) && 
        navMenu.classList.contains('active')) {
        navMenu.classList.remove("active");
        body.classList.remove("menu-open");
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});

// Закрытие меню при изменении ориентации или размера
window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
        navMenu.classList.remove("active");
        body.classList.remove("menu-open");
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});

