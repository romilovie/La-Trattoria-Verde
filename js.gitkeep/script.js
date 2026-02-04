// Бургер-меню

const burgerBtn = document.getElementById("burger-btn");
const navMenu = document.getElementById("nav-menu");

burgerBtn.addEventListener("click", function () {
    navMenu.classList.toggle("active");

    // Меняем иконку ☰ / ✖
    if (navMenu.classList.contains("active")) {
        burgerBtn.textContent = "✖";
    } else {
        burgerBtn.textContent = "☰";
    }
});
