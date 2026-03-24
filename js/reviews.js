// =====================================================
// ИНИЦИАЛИЗАЦИЯ КЛИЕНТА SUPABASE
// =====================================================
const SUPABASE_URL = 'https://yygbwpfckmwwuiudpiif.supabase.co'; 
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4'; 

// Создание экземпляра клиента Supabase
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// -----------------------------------------------------
// ФУНКЦИЯ ПРОВЕРКИ ПОДКЛЮЧЕНИЯ К БАЗЕ ДАННЫХ
// -----------------------------------------------------
async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        const { data, error } = await supabaseClient
            .from('reviews')
            .select('count', { count: 'exact', head: true });
        
        if (error) {
            console.error('Connection test failed:', error);
            return false;
        }
        console.log('Connection test successful!');
        return true;
    } catch (error) {
        console.error('Connection test error:', error);
        return false;
    }
}

// Вызов функции проверки при инициализации страницы
testConnection();

// =====================================================
// ПОЛУЧЕНИЕ ССЫЛОК НА DOM-ЭЛЕМЕНТЫ
// =====================================================
const track = document.getElementById('reviewsList');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sliderWindow = document.getElementById('sliderWindow');
const toggleFormBtn = document.getElementById('toggleFormBtn');
const formContainer = document.getElementById('formContainer');
const nameInput = document.getElementById('nameInput');
const textInput = document.getElementById('textInput');
const charCounter = document.getElementById('charCounter');
const submitBtn = document.getElementById('submitReview');
const thankYouMessage = document.getElementById('thankYouMessage');
const stars = document.querySelectorAll('.stars span');

// -----------------------------------------------------
// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ СОСТОЯНИЯ
// -----------------------------------------------------
let currentIndex = 0;
let touchStartX = 0;
let touchEndX = 0;
let rating = 5;

// =====================================================
// ЗАГРУЗКА И ОТОБРАЖЕНИЕ ОТЗЫВОВ
// =====================================================
async function loadReviews() {
    try {
        // Проверка корректности инициализации клиента Supabase
        if (!supabaseClient || !supabaseClient.from) {
            console.error('Supabase client not initialized properly');
            
            // Отображение только фиктивных данных при ошибке
            track.innerHTML = '';
            addDummyReviews();
            updateSlider();
            updateButtons();
            return;
        }

        const { data, error } = await supabaseClient
            .from('reviews')
            .select('*')
            .order('created_at', { ascending: true });

        if (error) throw error;

        // Очистка контейнера перед повторным заполнением
        track.innerHTML = '';

        // Добавление фиктивных отзывов (отображаются всегда первыми)
        addDummyReviews();

        // Добавление отзывов, полученных из базы данных
        if (data && data.length > 0) {
            data.forEach(review => {
                addReviewCard(review.name, review.text, review.rating, review.created_at);
            });
        }

        updateSlider();
        updateButtons();
    } catch (error) {
        console.error('Ошибка загрузки отзывов:', error);
        
        // Резервное отображение фиктивных отзывов
        track.innerHTML = '';
        addDummyReviews();
        updateSlider();
        updateButtons();
    }
}

// =====================================================
// ФИКТИВНЫЕ (ТЕСТОВЫЕ) ОТЗЫВЫ
// =====================================================
function addDummyReviews() {
    const dummyReviews = [
        { name: 'Марк', text: 'Обожаю это место! Атмосфера — чистая Италия. Карбонара здесь просто божественная, а тирамису — лучший в городе. Уже рекомендовал всем друзьям!', rating: 5, date: '2026-05-21' },
        { name: 'Катя и команда', text: 'Отметили здесь день рождения отделом — всё было идеально! Заказ на 12 человек выполнили безупречно, все в восторге от пиццы и стейка тунца. Обслуживание на высшем уровне.', rating: 5, date: '2026-06-10' },
        { name: 'Алексей', text: 'Наконец-то нашёл в городе ресторан, где умеют готовить по-настоящему. Прошутто э руккола, лавендер сауэр — всё с душой.', rating: 5, date: '2026-07-05' }
    ];

    dummyReviews.forEach(review => {
        addReviewCard(review.name, review.text, review.rating, review.date);
    });
}

// =====================================================
// ФОРМИРОВАНИЕ HTML-КАРТОЧКИ ОТЗЫВА
// =====================================================
function addReviewCard(name, text, ratingValue, date) {
    const card = document.createElement('div');
    card.className = 'review-card';
    
    const stars = '★'.repeat(ratingValue) + '☆'.repeat(5 - ratingValue);
    const formattedDate = new Date(date).toLocaleDateString('ru-RU');
    
    card.innerHTML = `
        <h3>${escapeHtml(name)}</h3>
        <p class="text">${escapeHtml(text)}</p>
        <div class="card-footer">
            <span class="rating">${stars}</span>
            <span class="date">${formattedDate}</span>
        </div>
    `;
    
    track.appendChild(card);
}

// =====================================================
// ЗАЩИТА ОТ XSS-АТАК (ЭКРАНИРОВАНИЕ HTML)
// =====================================================
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// =====================================================
// ЛОГИКА РАБОТЫ СЛАЙДЕРА
// =====================================================
function getCardWidth() {
    if (track.children.length === 0) return 0;
    const firstCard = track.children[0];
    return firstCard.offsetWidth + 
           parseInt(getComputedStyle(firstCard).marginLeft) + 
           parseInt(getComputedStyle(firstCard).marginRight);
}

function getWindowWidth() {
    return sliderWindow.offsetWidth;
}

function updateSlider() {
    const cardWidth = getCardWidth();
    const maxIndex = Math.max(0, track.children.length - 1);
    
    if (currentIndex > maxIndex) {
        currentIndex = maxIndex;
    }
    
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
}

function updateButtons() {
    const maxIndex = track.children.length - 1;
    if (prevBtn && nextBtn) {
        prevBtn.disabled = currentIndex <= 0;
        nextBtn.disabled = currentIndex >= maxIndex;
    }
}

// =====================================================
// ОБРАБОТЧИКИ КНОПОК СЛАЙДЕРА
// =====================================================
if (nextBtn) {
    nextBtn.addEventListener('click', () => {
        if (currentIndex < track.children.length - 1) {
            currentIndex++;
            updateSlider();
            updateButtons();
        }
    });
}

if (prevBtn) {
    prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
            currentIndex--;
            updateSlider();
            updateButtons();
        }
    });
}

// =====================================================
// ОБРАБОТКА СЕНСОРНЫХ ЖЕСТОВ (СВАЙП)
// =====================================================
if (sliderWindow) {
    sliderWindow.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });

    sliderWindow.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
}

function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;
    
    if (Math.abs(diff) > swipeThreshold) {
        if (diff > 0 && currentIndex < track.children.length - 1) {
            currentIndex++;
        } else if (diff < 0 && currentIndex > 0) {
            currentIndex--;
        }
        updateSlider();
        updateButtons();
    }
}

// =====================================================
// ВЫБОР РЕЙТИНГА (ЗВЁЗДЫ)
// =====================================================
if (stars.length > 0) {
    stars.forEach(star => {
        star.addEventListener('click', () => {
            rating = parseInt(star.dataset.value);
            stars.forEach(s => s.classList.remove('active'));
            for (let i = 0; i < rating; i++) {
                stars[i].classList.add('active');
            }
        });
    });

    // Установка начального значения рейтинга
    for (let i = 0; i < rating; i++) {
        stars[i].classList.add('active');
    }
}

// =====================================================
// СЧЁТЧИК СИМВОЛОВ В ПОЛЕ ВВОДА
// =====================================================
if (textInput) {
    textInput.addEventListener('input', () => {
        const length = textInput.value.length;
        charCounter.textContent = `${length}/500`;
        if (length >= 500) {
            charCounter.style.color = '#ff0000';
        } else {
            charCounter.style.color = '#1f3627';
        }
    });
}

// =====================================================
// УПРАВЛЕНИЕ ОТОБРАЖЕНИЕМ ФОРМЫ
// =====================================================
if (toggleFormBtn) {
    toggleFormBtn.addEventListener('click', () => {
        formContainer.classList.toggle('hidden');
        if (formContainer.classList.contains('hidden')) {
            toggleFormBtn.textContent = 'Оставить отзыв';
        } else {
            toggleFormBtn.textContent = 'Скрыть форму';
        }
    });
}

// =====================================================
// ОТПРАВКА ОТЗЫВА В БАЗУ ДАННЫХ
// =====================================================
if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const text = textInput.value.trim();
        
        if (!name || !text) {
            alert('Пожалуйста, заполните все поля');
            return;
        }
        
        if (name.length > 50) {
            alert('Имя не должно превышать 50 символов');
            return;
        }
        
        if (text.length > 500) {
            alert('Текст отзыва не должен превышать 500 символов');
            return;
        }
        
        try {
            // Проверка корректности клиента перед отправкой данных
            if (!supabaseClient || !supabaseClient.from) {
                throw new Error('Supabase client not initialized');
            }

            console.log('Sending review:', { name, rating, text });

            const { data, error } = await supabaseClient
                .from('reviews')
                .insert([
                    { 
                        name: name, 
                        rating: rating, 
                        text: text 
                    }
                ])
                .select();

            if (error) {
                console.error('Supabase insert error:', error);
                throw error;
            }

            console.log('Review saved:', data);

            // Добавление нового отзыва в интерфейс
            if (data && data[0]) {
                addReviewCard(data[0].name, data[0].text, data[0].rating, data[0].created_at);
            }

            // Очистка формы ввода
            nameInput.value = '';
            textInput.value = '';
            charCounter.textContent = '0/500';
            
            // Отображение уведомления пользователю
            thankYouMessage.classList.remove('hidden');
            setTimeout(() => {
                thankYouMessage.classList.add('hidden');
            }, 3000);

            // Переключение на последний элемент слайдера
            currentIndex = track.children.length - 1;
            updateSlider();
            updateButtons();

        } catch (error) {
            console.error('Ошибка сохранения отзыва:', error);
            alert(`Ошибка: ${error.message || 'Произошла ошибка при сохранении отзыва'}`);
        }
    });
}

// =====================================================
// ОБРАБОТКА ИЗМЕНЕНИЯ РАЗМЕРА ОКНА
// =====================================================
window.addEventListener('resize', () => {
    updateSlider();
    updateButtons();
});

// =====================================================
// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// =====================================================
window.addEventListener('load', () => {
    loadReviews();
});

