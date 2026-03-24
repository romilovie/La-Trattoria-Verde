// =====================================================
// КОНФИГУРАЦИЯ И ИНИЦИАЛИЗАЦИЯ SUPABASE
// =====================================================
const SUPABASE_URL = 'https://yygbwpfckmwwuiudpiif.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4'; 

// Создание клиента Supabase (с проверкой наличия библиотеки)
const supabaseClient = window.supabase?.createClient 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// Проверка успешности инициализации клиента
if (!supabaseClient) {
    console.warn('Supabase client not initialized. Make sure to include the Supabase library.');
}

// =====================================================
// ИНИЦИАЛИЗАЦИЯ ЛОГИКИ ПОСЛЕ ЗАГРУЗКИ DOM-ДЕРЕВА
// =====================================================
document.addEventListener('DOMContentLoaded', function() {

    // -------------------------------------------------
    // ПОЛУЧЕНИЕ ССЫЛОК НА ЭЛЕМЕНТЫ ФОРМЫ
    // -------------------------------------------------
    const form = document.getElementById('contactForm');
    const nameInput = document.getElementById('name');
    const phoneInput = document.getElementById('phone');
    const emailInput = document.getElementById('email');
    const messageInput = document.getElementById('message');
    const charCounter = document.getElementById('charCounter');
    const submitBtn = document.getElementById('submitBtn');
    const formStatus = document.getElementById('formStatus');

    // =================================================
    // ФУНКЦИИ ОБРАБОТКИ И ВАЛИДАЦИИ ДАННЫХ
    // =================================================

    // -------------------------------------------------
    // ФОРМАТИРОВАНИЕ (МАСКА) НОМЕРА ТЕЛЕФОНА
    // -------------------------------------------------
    function phoneMask(value) {
        if (!value) return value;
        
        // Удаление всех нецифровых символов
        let phone = value.replace(/\D/g, '');
        
        // Удаление ведущей цифры (7 или 8) для форматирования
        if (phone.startsWith('7') || phone.startsWith('8')) {
            phone = phone.substring(1);
        }
        
        // Ограничение длины номера
        phone = phone.substring(0, 10);
        
        // Формирование строки в формате +7 (XXX) XXX-XX-XX
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

    // -------------------------------------------------
    // ПРОВЕРКА КОРРЕКТНОСТИ EMAIL-АДРЕСА
    // -------------------------------------------------
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // -------------------------------------------------
    // ПРОВЕРКА КОРРЕКТНОСТИ НОМЕРА ТЕЛЕФОНА
    // -------------------------------------------------
    function isValidPhone(phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        return phoneDigits.length === 11 && (phoneDigits.startsWith('7') || phoneDigits.startsWith('8'));
    }

    // -------------------------------------------------
    // ОБНОВЛЕНИЕ СЧЁТЧИКА СИМВОЛОВ
    // -------------------------------------------------
    function updateCharCounter() {
        const currentLength = messageInput.value.length;
        const maxLength = messageInput.maxLength;
        charCounter.textContent = `${currentLength}/${maxLength}`;
        
        // Изменение визуального состояния в зависимости от длины текста
        charCounter.classList.remove('warning', 'danger');
        
        if (currentLength >= maxLength * 0.9) {
            charCounter.classList.add('danger');
        } else if (currentLength >= maxLength * 0.7) {
            charCounter.classList.add('warning');
        }
    }

    // -------------------------------------------------
    // СБРОС ОШИБОК ВАЛИДАЦИИ
    // -------------------------------------------------
    function clearErrors() {
        [nameInput, phoneInput, emailInput, messageInput].forEach(input => {
            input.classList.remove('error');
            input.style.borderColor = '#8b5e52';
        });
    }

    // -------------------------------------------------
    // ОТОБРАЖЕНИЕ СООБЩЕНИЙ ПОЛЬЗОВАТЕЛЮ
    // -------------------------------------------------
    function showMessage(text, type = 'info') {
        formStatus.textContent = text;
        formStatus.className = `form-status ${type}`;
        
        // Автоматическое скрытие сообщения об успехе
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

    // =================================================
    // ОБРАБОТЧИКИ СОБЫТИЙ ВВОДА ДАННЫХ
    // =================================================

    // Ввод номера телефона с применением маски
    phoneInput.addEventListener('input', function(e) {
        let cursorPos = e.target.selectionStart;
        let oldLength = e.target.value.length;
        
        e.target.value = phoneMask(e.target.value);
        
        // Корректировка позиции курсора после форматирования
        let newLength = e.target.value.length;
        cursorPos += newLength - oldLength;
        e.target.setSelectionRange(cursorPos, cursorPos);
        
        e.target.classList.remove('error');
    });

    // Проверка телефона при потере фокуса
    phoneInput.addEventListener('blur', function() {
        if (this.value && !isValidPhone(this.value)) {
            this.classList.add('error');
        } else {
            this.classList.remove('error');
        }
    });

    // Обработка email
    emailInput.addEventListener('input', function() {
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

    // Обработка поля сообщения
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

    // Инициализация счётчика символов
    updateCharCounter();

    // =================================================
    // ВАЛИДАЦИЯ ФОРМЫ ПЕРЕД ОТПРАВКОЙ
    // =================================================
    function validateForm() {
        let isValid = true;
        clearErrors();

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
        else if (!isValidPhone(phoneInput.value)) {
            phoneInput.classList.add('error');
            showMessage('Введите корректный номер телефона (например: +7 (999) 999-99-99)', 'error');
            isValid = false;
        }
        else if (!isValidEmail(emailInput.value)) {
            emailInput.classList.add('error');
            showMessage('Введите корректный email адрес (например: name@domain.com)', 'error');
            isValid = false;
        }
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

    // =================================================
    // СОХРАНЕНИЕ ДАННЫХ В БАЗУ SUPABASE
    // =================================================
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

    // -------------------------------------------------
    // ПОЛУЧЕНИЕ IP-АДРЕСА ПОЛЬЗОВАТЕЛЯ
    // -------------------------------------------------
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

    // =================================================
    // ОБРАБОТКА ОТПРАВКИ ФОРМЫ
    // =================================================
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        // Блокировка кнопки отправки
        const originalText = submitBtn.textContent;
        submitBtn.textContent = '';
        submitBtn.classList.add('sending');
        submitBtn.disabled = true;
        
        showMessage('Отправка данных...', 'info');

        try {
            // Получение IP-адреса пользователя
            const ipAddress = await getIpAddress();

            // Формирование объекта данных формы
            const formData = {
                name: nameInput.value.trim(),
                phone: phoneInput.value,
                email: emailInput.value,
                message: messageInput.value.trim(),
                ip_address: ipAddress,
                user_agent: navigator.userAgent
            };

            console.log('Form data prepared:', formData);

            // Сохранение данных в базе данных
            if (supabaseClient) {
                await saveToDatabase(formData);
                
                // Уведомление пользователя об успешной отправке
                showMessage('Спасибо за вопрос! Мы ответим вам в ближайшее время.', 'success');
                
                // Очистка формы
                form.reset();
                updateCharCounter();
                clearErrors();
                
            } else {
                throw new Error('Supabase client not available. Проверьте подключение к Supabase.');
            }

        } catch (error) {
            console.error('Detailed error:', error);
            
            // Формирование сообщения об ошибке
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
            // Разблокировка кнопки отправки
            submitBtn.textContent = originalText;
            submitBtn.classList.remove('sending');
            submitBtn.disabled = false;
        }
    });
});


