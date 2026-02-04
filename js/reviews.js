// ===== СЛАЙДЕР =====
const track = document.getElementById('reviewsList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let index = 0;

function updateSlider() {
  track.style.transform = `translateX(-${index * 340}px)`;
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
};
