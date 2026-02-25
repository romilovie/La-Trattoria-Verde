// ===== СЛАЙДЕР =====
const track = document.getElementById('reviewsList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sliderWindow = document.querySelector('.slider-window');

let index = 0;

// Функция для получения ширины одной карточки с учетом отступов
function getCardWidth() {
    if (track.children.length === 0) return 0;
    const firstCard = track.children[0];
    // Получаем полную ширину карточки включая margin
    return firstCard.offsetWidth + 
           parseInt(getComputedStyle(firstCard).marginLeft) + 
           parseInt(getComputedStyle(firstCard).marginRight);
}

// Функция для получения ширины окна слайдера
function getWindowWidth() {
    return sliderWindow.offsetWidth;
}

function updateSlider() {
    const cardWidth = getCardWidth();
    const windowWidth = getWindowWidth();
    
    // Проверяем, чтобы индекс не уходил за пределы
    const maxIndex = Math.max(0, track.children.length - 1);
    if (index > maxIndex) {
        index = maxIndex;
    }
    
    // Сдвигаем ровно на ширину карточки
    track.style.transform = `translateX(-${index * cardWidth}px)`;
}

nextBtn.onclick = () => {
    if (index < track.children.length - 1) {
        index++;
        updateSlider();
    }
};

prevBtn.onclick = () => {
    if (index > 0) {
        index--;
        updateSlider();
    }
};

// Обновляем при изменении размера окна
window.addEventListener('resize', () => {
    updateSlider();
});

// Вызываем после загрузки страницы
window.addEventListener('load', () => {
    updateSlider();
});

// ===== МОДАЛКА =====
const modal = document.getElementById('modal');
document.getElementById('openModal').onclick = () => modal.style.display = 'flex';
document.getElementById('closeModal').onclick = () => modal.style.display = 'none';

// ===== ЗВЁЗДЫ =====
let rating = 5;
const stars = document.querySelectorAll('.stars span');

stars.forEach(star => {
    star.onclick = () => {
        rating = star.dataset.value;
        stars.forEach(s => s.classList.remove('active'));
        for (let i = 0; i < rating; i++) {
            stars[i].classList.add('active');
        }
    };
});

// Устанавливаем начальное состояние звёзд (5 звезд по умолчанию)
for (let i = 0; i < rating; i++) {
    stars[i].classList.add('active');
}

// ===== ДОБАВЛЕНИЕ ОТЗЫВА =====
document.getElementById('submitReview').onclick = () => {
    const name = document.getElementById('nameInput').value;
    const text = document.getElementById('textInput').value;
    if (!name || !text) return;

    const card = document.createElement('div');
    card.className = 'review-card';
    card.innerHTML = `
        <div class="rating">${'★'.repeat(rating)}</div>
        <h3>${name}</h3>
        <p class="text">${text}</p>
        <span class="date">${new Date().toLocaleDateString()}</span>
    `;

    track.prepend(card);
    modal.style.display = 'none';
    
    // Очищаем форму
    document.getElementById('nameInput').value = '';
    document.getElementById('textInput').value = '';
    
    // Сбрасываем индекс и обновляем слайдер
    index = 0;
    updateSlider();
};
