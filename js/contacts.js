// URL вашего веб-приложения (ЗАМЕНИТЕ НА СВОЙ)
const GOOGLE_SCRIPT_URL = 'https://script.google.com/u/0/home/projects/1GDltj924AXZlfdM36dkC7SSucMCSLll2p3MBSFrE5hdSeUDD1TUJ7KQP/edit';

document.getElementById('contactForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    
    // Получаем данные формы
    const formData = {
        name: this.querySelector('input[type="text"]').value,
        email: this.querySelector('input[type="email"]').value,
        message: this.querySelector('textarea').value
    };
    
    // Показываем индикатор загрузки
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Отправка...';
    submitBtn.disabled = true;
    
    try {
        // Отправляем данные в Google Sheets
        const response = await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Важно для работы с Google Apps Script
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(formData)
        });
        
        // Показываем успешное сообщение
        alert('Спасибо! Ваше сообщение отправлено.');
        this.reset();
        
    } catch (error) {
        console.error('Error:', error);
        alert('Произошла ошибка при отправке. Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.');
    } finally {
        // Возвращаем кнопку в исходное состояние
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});

// Добавим валидацию формы для улучшения UX
document.getElementById('contactForm').addEventListener('input', function(e) {
    const inputs = this.querySelectorAll('input[required], textarea[required]');
    const submitBtn = this.querySelector('button[type="submit"]');
    
    let allFilled = true;
    inputs.forEach(input => {
        if (!input.value.trim()) {
            allFilled = false;
        }
    });
    
    submitBtn.disabled = !allFilled;
});


