// ===== СЛАЙДЕР =====
const track = document.getElementById('reviewsList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let index = 0;
let cardWidth = 340; // стандартная ширина на десктопе

// Функция для определения ширины карточки в зависимости от экрана
function getCardWidth() {
    if (window.innerWidth <= 360) {
        return 220; // для очень маленьких экранов (ширина карточки + отступы)
    } else if (window.innerWidth <= 480) {
        return 260; // для маленьких экранов
    } else if (window.innerWidth <= 768) {
        return 300; // для планшетов
    } else {
        return 340; // для десктопов
    }
}

function updateSlider() {
    // Обновляем ширину карточки при каждом сдвиге
    cardWidth = getCardWidth();
    track.style.transform = `translateX(-${index * cardWidth}px)`;
}

nextBtn.onclick = () => {
    const maxIndex = track.children.length - 1;
    if (index < maxIndex) {
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
    // Пересчитываем позицию при изменении размера
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
};
