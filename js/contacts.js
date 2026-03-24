// Конфигурация Supabase
const SUPABASE_URL = 'https://yygbwpfckmwwuiudpiif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4'; 

// Создаем клиент Supabase (используем другое имя переменной)
const supabaseClient = window.supabase?.createClient 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

if (!supabaseClient) {
    console.warn('Supabase client not initialized. Make sure to include the Supabase library.');
}

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const charCounter = document.getElementById('charCounter');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // Маска для телефона
    function phoneMask(value) {
        if (!value) return value;
        
        // Удаляем все нецифровые символы
        let phone = value.replace(/\D/g, '');
        
        // Если номер начинается с 7 или 8, убираем первую цифру для форматирования
        if (phone.startsWith('7') || phone.startsWith('8')) {
            phone = phone.substring(1);
        }
        
        // Ограничиваем длину
        phone = phone.substring(0, 10);
        
        // Применяем маску +7 (999) 999-99-99
        let result = '+7';
        
        if (phone.length > 0) {
            result += ' (';
            result += phone.substring(0, Math.min(3, phone.length));
            
            if (phone.length >= 4) {
                result += ') ';
                result += phone.substring(3, Math.min(6, phone.length));
                
                if (phone.length >= 7) {
                    result += '-';
                    result += phone.substring(6, Math.min(8, phone.length));
                    
                    if (phone.length >= 9) {
                        result += '-';
                        result += phone.substring(8, Math.min(10, phone.length));
                    }
                }
            }
        }
        
        return result;
    }

    // Валидация email
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Валидация телефона (полный номер)
    function isValidPhone(phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        // Должно быть 11 цифр (включая 7 в начале)
        return phoneDigits.length === 11 && (phoneDigits.startsWith('7') || phoneDigits.startsWith('8'));
    }

    // Обновление счетчика символов
    function updateCharCounter() {
        const currentLength = messageInput.value.length;
        const maxLength = messageInput.maxLength;
        charCounter.textContent = `${currentLength}/${maxLength}`;
        
        // Меняем классы в зависимости от заполненности
        charCounter.classList.remove('warning', 'danger');
        
        if (currentLength >= maxLength * 0.9) {
            charCounter.classList.add('danger');
        } else if (currentLength >= maxLength * 0.7) {
            charCounter.classList.add('warning');
        }
    }

    // Очистка полей от классов ошибок
    function clearErrors() {
        [nameInput, phoneInput, emailInput, messageInput].forEach(input => {
            input.classList.remove('error');
            input.style.borderColor = '#8b5e52';
        });
    }

    // Показать сообщение
    function showMessage(text, type = 'info') {
        formStatus.textContent = text;
        formStatus.className = `form-status ${type}`;
        
        // Автоматически скрываем успешное сообщение через 5 секунд
        if (type === 'success') {
            setTimeout(() => {
                formStatus.style.opacity = '0';
                setTimeout(() => {
                    formStatus.textContent = '';
                    formStatus.className = 'form-status';
                    formStatus.style.opacity = '1';
                }, 300);
            }, 5000);
        }
    }

    // Обработка ввода телефона
    phoneInput.addEventListener('input', function(e) {
        let cursorPos = e.target.selectionStart;
        let oldLength = e.target.value.length;
        
        e.target.value = phoneMask(e.target.value);
        
        // Корректируем позицию курсора
        let newLength = e.target.value.length;
        cursorPos += newLength - oldLength;
        e.target.setSelectionRange(cursorPos, cursorPos);
        
        // Убираем ошибку при вводе
        e.target.classList.remove('error');
    });

    // Валидация при потере фокуса
    phoneInput.addEventListener('blur', function() {
        if (this.value && !isValidPhone(this.value)) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Обработка ввода email
    emailInput.addEventListener('input', function(e) {
        this.classList.remove('error');
    });

    emailInput.addEventListener('blur', function() {
        if (this.value && !isValidEmail(this.value)) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Обработка имени
    nameInput.addEventListener('input', function() {
        this.classList.remove('error');
    });

    nameInput.addEventListener('blur', function() {
        if (this.value && this.value.trim().length < 2) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Обновление счетчика символов
    messageInput.addEventListener('input', function() {
        updateCharCounter();
        this.classList.remove('error');
    });

    messageInput.addEventListener('blur', function() {
        if (this.value && this.value.trim().length < 10) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Инициализация счетчика
    updateCharCounter();

    // Валидация формы перед отправкой
    function validateForm() {
        let isValid = true;
        clearErrors();

        // Проверка имени
        if (!nameInput.value.trim()) {
            nameInput.classList.add('error');
            showMessage('Введите имя', 'error');
            isValid = false;
        }
        else if (nameInput.value.trim().length < 2) {
            nameInput.classList.add('error');
            showMessage('Имя должно содержать минимум 2 символа', 'error');
            isValid = false;
        }
        // Проверка телефона
        else if (!isValidPhone(phoneInput.value)) {
            phoneInput.classList.add('error');
            showMessage('Введите корректный номер телефона (например: +7 (999) 999-99-99)', 'error');
            isValid = false;
        }
        // Проверка email
        else if (!isValidEmail(emailInput.value)) {
            emailInput.classList.add('error');
            showMessage('Введите корректный email адрес (например: name@domain.com)', 'error');
            isValid = false;
        }
        // Проверка сообщения
        else if (!messageInput.value.trim()) {
            messageInput.classList.add('error');
            showMessage('Введите сообщение', 'error');
            isValid = false;
        }
        else if (messageInput.value.trim().length < 10) {
            messageInput.classList.add('error');
            showMessage('Сообщение должно содержать минимум 10 символов', 'error');
            isValid = false;
        }

        return isValid;
    }

    // Сохранение в Supabase
    async function saveToDatabase(formData) {
        if (!supabaseClient) {
            throw new Error('Supabase client not initialized');
        }

        console.log('Attempting to save to Supabase:', formData);

        const { data, error } = await supabaseClient
            .from('feedback_messages')
            .insert([
                {
                    name: formData.name,
                    phone: formData.phone,
                    email: formData.email,
                    message: formData.message,
                    ip_address: formData.ip_address,
                    user_agent: formData.user_agent,
                    created_at: new Date().toISOString()
                }
            ]);

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }
        
        console.log('Successfully saved to Supabase:', data);
        return data;
    }

    // Получение IP адреса (через бесплатный сервис)
    async function getIpAddress() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.warn('Could not get IP address:', error);
            return null;
        }
    }

    // Обработка отправки формы
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Блокируем кнопку
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '';
        submitBtn.classList.add('sending');
        submitBtn.disabled = true;
        
        showMessage('Отправка данных...', 'info');

        try {
            // Получаем IP адрес
            const ipAddress = await getIpAddress();

            // Подготавливаем данные
            const formData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value,
                email: emailInput.value,
                message: messageInput.value.trim(),
                ip_address: ipAddress,
                user_agent: navigator.userAgent
            };

            console.log('Form data prepared:', formData);

            // Сохраняем в Supabase
            if (supabaseClient) {
                await saveToDatabase(formData);
                
                // Показываем сообщение об успехе
                showMessage('Спасибо за вопрос! Мы ответим вам в ближайшее время.', 'success');
                
                // Очищаем форму
                form.reset();
                updateCharCounter();
                
                // Очищаем поля от подсветки ошибок
                clearErrors();
                
            } else {
                throw new Error('Supabase client not available. Проверьте подключение к Supabase.');
            }

        } catch (error) {
            console.error('Detailed error:', error);
            
            // Более информативное сообщение об ошибке
            let errorMessage = 'Произошла ошибка при отправке. ';
            
            if (error.message.includes('relation') || error.message.includes('does not exist')) {
                errorMessage += 'Таблица в базе данных не найдена. Проверьте название таблицы "feedback_messages".';
            } else if (error.message.includes('permission')) {
                errorMessage += 'Ошибка прав доступа. Проверьте настройки RLS в Supabase.';
            } else if (error.message.includes('network')) {
                errorMessage += 'Проблема с сетью. Проверьте подключение к интернету.';
            } else {
                errorMessage += 'Пожалуйста, попробуйте позже или свяжитесь с нами по телефону.';
            }
            
            showMessage(errorMessage, 'error');
        } finally {
            // Разблокируем кнопку
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('sending');
            submitBtn.disabled = false;
        }
    });
});


