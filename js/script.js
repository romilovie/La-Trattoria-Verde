// =====================================================
// МОДУЛЬ УПРАВЛЕНИЯ БУРГЕР-МЕНЮ НАВИГАЦИИ
// =====================================================

// Получение ссылок на основные элементы интерфейса
const burgerBtn = document.getElementById("burger-btn");
const navMenu = document.getElementById("nav-menu");
const body = document.body;

// -----------------------------------------------------
// ОБРАБОТКА НАЖАТИЯ НА КНОПКУ БУРГЕР-МЕНЮ
// -----------------------------------------------------
burgerBtn.addEventListener("click", function () {

    // Переключение состояния меню (открыто / закрыто)
    navMenu.classList.toggle("active");
    body.classList.toggle("menu-open");

    // -------------------------------------------------
    // ИЗМЕНЕНИЕ ВНЕШНЕГО ВИДА КНОПКИ (ИКОНКИ)
    // -------------------------------------------------
    if (navMenu.classList.contains("active")) {
        // Состояние: меню открыто
        burgerBtn.textContent = "✖";
        burgerBtn.style.fontSize = "24px";
        burgerBtn.style.lineHeight = "1";
    } else {
        // Состояние: меню закрыто
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});

// -----------------------------------------------------
// ЗАКРЫТИЕ МЕНЮ ПРИ КЛИКЕ НА ПУНКТ НАВИГАЦИИ
// -----------------------------------------------------
const navLinks = document.querySelectorAll('.nav__list a');
navLinks.forEach(link => {
    link.addEventListener('click', () => {

        // Сброс состояния меню
        navMenu.classList.remove("active");
        body.classList.remove("menu-open");

        // Возврат кнопки в исходное состояние
        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    });
});

// -----------------------------------------------------
// ЗАКРЫТИЕ МЕНЮ ПРИ КЛИКЕ ВНЕ ЕГО ОБЛАСТИ
// -----------------------------------------------------
document.addEventListener('click', (e) => {

    // Проверка, что клик произошёл вне меню и кнопки
    if (!navMenu.contains(e.target) && 
        !burgerBtn.contains(e.target) && 
        navMenu.classList.contains('active')) {

        navMenu.classList.remove("active");
        body.classList.remove("menu-open");

        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});

// -----------------------------------------------------
// ЗАКРЫТИЕ МЕНЮ ПРИ ИЗМЕНЕНИИ РАЗМЕРА ЭКРАНА
// -----------------------------------------------------
window.addEventListener('resize', () => {

    // Автоматическое закрытие меню при переходе на десктопное разрешение
    if (window.innerWidth > 900) {
        navMenu.classList.remove("active");
        body.classList.remove("menu-open");

        burgerBtn.textContent = "☰";
        burgerBtn.style.fontSize = "28px";
    }
});


