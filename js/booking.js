// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('booking.js загружен и готов к работе');
    
    // Конфигурация Supabase - ВСТАВЬТЕ СВОИ ДАННЫЕ!
    const SUPABASE_URL = 'https://yygbwpfckmwwuiudpiif.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4';
    
    // Создаем клиент Supabase с уникальным именем
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    // Элементы DOM
    const tables = document.querySelectorAll('.table.free');
    const tablesCount = document.getElementById('tablesCount');
    const seatsCount = document.getElementById('seatsCount');
    const bookingInfo = document.getElementById('bookingInfo');
    const bookingForm = document.getElementById('bookingForm');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const submitBtn = document.getElementById('submitBooking');
    const timeSlots = document.getElementById('timeSlots');
    const dateInput = document.getElementById('bookingDate');
    const phoneInput = document.getElementById('phone');
    
    // Проверка наличия всех элементов
    console.log('Найдено элементов:', {
        tables: tables.length,
        tablesCount: !!tablesCount,
        seatsCount: !!seatsCount,
        bookingInfo: !!bookingInfo,
        bookingForm: !!bookingForm,
        bookingFormContainer: !!bookingFormContainer,
        submitBtn: !!submitBtn,
        timeSlots: !!timeSlots,
        dateInput: !!dateInput,
        phoneInput: !!phoneInput
    });
    
    // Состояние приложения
    let selectedTables = [];
    let selectedDate = null;
    let selectedTime = null;
    let busyTables = [];
    
    // Если нет dateInput, выходим
    if (!dateInput) {
        console.error('Элемент bookingDate не найден! Проверьте HTML');
        return;
    }
    
    // Устанавливаем минимальную дату - сегодня
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    selectedDate = today;
    
    // Маска для телефона
    if (phoneInput && typeof Inputmask !== 'undefined') {
        Inputmask("+7 (999) 999-99-99").mask(phoneInput);
    } else {
        console.warn('Inputmask не загружен');
    }
    
    // Валидация email
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('input', function(e) {
            const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
            if (this.value && !emailPattern.test(this.value)) {
                this.setCustomValidity('Введите корректный email');
            } else {
                this.setCustomValidity('');
            }
            validateForm();
        });
    }
    
    // Слушатель изменения даты
    dateInput.addEventListener('change', function(e) {
        selectedDate = e.target.value;
        console.log('Выбрана дата:', selectedDate);
        
        // Сбрасываем выбранное время и столы
        selectedTime = null;
        selectedTables = [];
        document.querySelectorAll('.time.selected').forEach(el => el.classList.remove('selected'));
        document.querySelectorAll('.table.selected').forEach(el => el.classList.remove('selected'));
        updateSummary();
        checkFormVisibility();
        
        // Загружаем доступное время для выбранной даты
        loadAvailableTimeSlots(selectedDate);
    });
    
    // Загрузка доступного времени
    async function loadAvailableTimeSlots(date) {
        if (!timeSlots) return;
        
        timeSlots.innerHTML = '<div class="loading">Загрузка...</div>';
        
        // Все возможные временные слоты
        const allTimeSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
                              '18:00', '19:00', '20:00', '21:00', '22:00'];
        
        try {
            // Получаем занятые слоты из базы данных
            const { data: bookings, error } = await supabaseClient
                .from('bookings')
                .select('booking_time')
                .eq('booking_date', date);
    
            if (error) throw error;
    
            const busyTimeSlots = bookings.map(b => b.booking_time);
            
            // Проверка на прошедшее время для сегодняшней даты
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinutes = now.getMinutes();
            const isToday = date === today;
    
            // Очищаем и заполняем слоты
            timeSlots.innerHTML = '';
            
            allTimeSlots.forEach(time => {
                const [hours, minutes] = time.split(':').map(Number);
                const timeButton = document.createElement('button');
                timeButton.className = 'time';
                timeButton.textContent = time;
                
                // Проверка на прошедшее время для сегодняшней даты
                if (isToday && (hours < currentHour || (hours === currentHour && minutes <= currentMinutes))) {
                    timeButton.classList.add('past');
                    timeButton.disabled = true;
                }
                // Проверка на занятые слоты
                else if (busyTimeSlots.includes(time)) {
                    timeButton.classList.add('busy');
                    timeButton.disabled = true;
                }
                else {
                    timeButton.addEventListener('click', () => selectTime(timeButton, time));
                }
                
                timeSlots.appendChild(timeButton);
            });
            
        } catch (error) {
            console.error('Ошибка загрузки времени:', error);
            timeSlots.innerHTML = '<div class="error">Ошибка загрузки</div>';
        }
    }
    
    // Выбор времени
    function selectTime(button, time) {
        document.querySelectorAll('.time').forEach(b => b.classList.remove('selected'));
        button.classList.add('selected');
        selectedTime = time;
        console.log('Выбрано время:', time);
        
        // Загружаем занятые столы для выбранной даты и времени
        loadBusyTables(selectedDate, selectedTime);
    }
    
    // Загрузка занятых столов
    async function loadBusyTables(date, time) {
        try {
            const { data: bookings, error } = await supabaseClient
                .from('bookings')
                .select('table_ids')
                .eq('booking_date', date)
                .eq('booking_time', time);
    
            if (error) throw error;
    
            // Собираем все ID занятых столов
            busyTables = bookings.flatMap(b => b.table_ids);
            
            // Обновляем отображение столов
            updateTablesStatus();
            
        } catch (error) {
            console.error('Ошибка загрузки занятых столов:', error);
        }
    }
    
    // Обновление статуса столов
    function updateTablesStatus() {
        tables.forEach(table => {
            const tableId = parseInt(table.dataset.id);
            if (busyTables.includes(tableId)) {
                table.classList.remove('free', 'selected');
                table.classList.add('busy');
            } else {
                table.classList.remove('busy');
                table.classList.add('free');
            }
        });
        
        // Сбрасываем выбранные столы
        selectedTables = [];
        updateSummary();
        checkFormVisibility();
    }
    
    // Выбор столов
    tables.forEach(table => {
        table.addEventListener('click', () => {
            if (!selectedDate || !selectedTime) {
                alert('Сначала выберите дату и время');
                return;
            }
            
            if (table.classList.contains('busy')) {
                alert('Этот столик уже занят');
                return;
            }
            
            if (selectedTables.includes(table)) {
                table.classList.remove('selected');
                selectedTables = selectedTables.filter(t => t !== table);
            } else {
                table.classList.add('selected');
                selectedTables.push(table);
            }
            
            updateSummary();
            checkFormVisibility();
        });
    });
    
    function updateSummary() {
        if (tablesCount) tablesCount.textContent = selectedTables.length;
        if (seatsCount) {
            seatsCount.textContent = selectedTables.reduce((sum, t) => sum + Number(t.dataset.seats), 0);
        }
    }
    
    function checkFormVisibility() {
        if (bookingFormContainer) {
            if (selectedTables.length > 0 && selectedDate && selectedTime) {
                bookingFormContainer.style.display = 'block';
                updateBookingInfo();
            } else {
                bookingFormContainer.style.display = 'none';
            }
        }
    }
    
    function updateBookingInfo() {
        if (!bookingInfo) return;
        
        bookingInfo.innerHTML = `
            <strong>Детали бронирования:</strong><br>
            Дата: ${selectedDate}<br>
            Время: ${selectedTime}<br>
            Столики: ${selectedTables.map(t => '№' + t.dataset.id).join(', ')}<br>
            Мест: ${seatsCount ? seatsCount.textContent : '0'}
        `;
    }
    
    // Валидация формы
    function validateForm() {
        const name = document.getElementById('name');
        const phone = document.getElementById('phone');
        const email = document.getElementById('email');
        
        if (!name || !phone || !submitBtn) return;
        
        const nameValid = name.value.length >= 2;
        const phoneValid = phone.value && phone.value.match(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/);
        const emailValid = !email.value || (email.value && email.value.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/));
        
        submitBtn.disabled = !(nameValid && phoneValid && emailValid && selectedTables.length > 0);
    }
    
    // События ввода для валидации
    const nameInput = document.getElementById('name');
    if (nameInput) nameInput.addEventListener('input', validateForm);
    if (phoneInput) phoneInput.addEventListener('input', validateForm);
    if (emailInput) emailInput.addEventListener('input', validateForm);
    
    // Отправка формы
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (submitBtn && submitBtn.disabled) return;
            
            const nameInput = document.getElementById('name');
            const phoneInput = document.getElementById('phone');
            const emailInput = document.getElementById('email');
            const commentsInput = document.getElementById('comments');
            
            if (!nameInput || !phoneInput) {
                alert('Ошибка: не найдены поля формы');
                return;
            }
            
            const bookingData = {
                booking_date: selectedDate,
                booking_time: selectedTime,
                table_ids: selectedTables.map(t => parseInt(t.dataset.id)),
                customer_name: nameInput.value,
                customer_phone: phoneInput.value,
                customer_email: emailInput ? emailInput.value || null : null,
                comments: commentsInput ? commentsInput.value || null : null,
                created_at: new Date().toISOString()
            };
            
            console.log('Отправка данных:', bookingData);
            
            try {
                const { data, error } = await supabaseClient
                    .from('bookings')
                    .insert([bookingData]);
    
                if (error) throw error;
                
                alert('Бронирование успешно создано!');
                window.location.href = 'booking-success.html';
                
            } catch (error) {
                console.error('Ошибка при бронировании:', error);
                alert('Произошла ошибка при бронировании: ' + error.message);
            }
        };
    }
    
    // Очистка устаревших броней
    async function cleanupOldBookings() {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const { error } = await supabaseClient
                .from('bookings')
                .delete()
                .lt('booking_date', today);
    
            if (error) throw error;
            console.log('Старые брони удалены');
        } catch (error) {
            console.error('Ошибка при очистке старых броней:', error);
        }
    }
    
    // Загружаем временные слоты для сегодняшней даты
    loadAvailableTimeSlots(today);
    
    // Очищаем старые брони
    cleanupOldBookings();
    
    console.log('Инициализация завершена');
});






