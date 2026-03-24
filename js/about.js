// =====================================================
// АНИМАЦИЯ ПОЯВЛЕНИЯ СЕКЦИЙ ПРИ ПРОКРУТКЕ СТРАНИЦЫ
// =====================================================

// Получение списка всех секций страницы
const sections = document.querySelectorAll('.section');

// -----------------------------------------------------
// СОЗДАНИЕ OBSERVER ДЛЯ ОТСЛЕЖИВАНИЯ ВИДИМОСТИ ЭЛЕМЕНТОВ
// -----------------------------------------------------
const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        // Проверка попадания элемента в область видимости
        if (entry.isIntersecting) {
            // Применение конечных стилей (появление элемента)
            entry.target.style.opacity = 1;
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, { threshold: 0.2 });

// -----------------------------------------------------
// ИНИЦИАЛИЗАЦИЯ НАЧАЛЬНЫХ СТИЛЕЙ И ПОДКЛЮЧЕНИЕ OBSERVER
// -----------------------------------------------------
sections.forEach(section => {
    // Установка начального состояния (скрыто и смещено вниз)
    section.style.opacity = 0;
    section.style.transform = 'translateY(40px)';
    
    // Настройка анимации перехода
    section.style.transition = '0.8s ease';
    
    // Подключение элемента к observer
    observer.observe(section);
});


