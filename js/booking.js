// Конфигурация Supabase - ВСТАВЬТЕ СВОИ ДАННЫЕ!
//const supabaseUrl = 'https://yygbwpfckmwwuiudpiif.supabase.co';
//const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4';
//const supabase = supabase.createClient(supabaseUrl, supabaseKey);

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

// Состояние приложения
let selectedTables = [];
let selectedDate = null;
let selectedTime = null;
let busyTables = [];

// Устанавливаем минимальную дату - сегодня
const today = new Date().toISOString().split('T')[0];
dateInput.min = today;
dateInput.value = today; // Устанавливаем сегодня как значение по умолчанию
selectedDate = today;

// Маска для телефона
if (phoneInput) {
    Inputmask("+7 (999) 999-99-99").mask(phoneInput);
}

// Валидация email
document.getElementById('email').addEventListener('input', function(e) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.value && !emailPattern.test(this.value)) {
        this.setCustomValidity('Введите корректный email');
    } else {
        this.setCustomValidity('');
    }
    validateForm();
});

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
    
    // Загружаем доступное время для выбранной даты
    loadAvailableTimeSlots(selectedDate);
});

// Загрузка доступного времени
async function loadAvailableTimeSlots(date) {
    timeSlots.innerHTML = '<div class="loading">Загрузка...</div>';
    
    // Все возможные временные слоты
    const allTimeSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
                          '18:00', '19:00', '20:00', '21:00', '22:00'];
    
    try {
        // Получаем занятые слоты из базы данных
        const { data: bookings, error } = await supabase
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
        const { data: bookings, error } = await supabase
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
    tablesCount.textContent = selectedTables.length;
    seatsCount.textContent = selectedTables.reduce((sum, t) => sum + Number(t.dataset.seats), 0);
}

function checkFormVisibility() {
    if (selectedTables.length > 0 && selectedDate && selectedTime) {
        bookingFormContainer.style.display = 'block';
        updateBookingInfo();
    } else {
        bookingFormContainer.style.display = 'none';
    }
}

function updateBookingInfo() {
    bookingInfo.innerHTML = `
        <strong>Детали бронирования:</strong><br>
        Дата: ${selectedDate}<br>
        Время: ${selectedTime}<br>
        Столики: ${selectedTables.map(t => '№' + t.dataset.id).join(', ')}<br>
        Мест: ${seatsCount.textContent}
    `;
}

// Валидация формы
function validateForm() {
    const name = document.getElementById('name').value;
    const phone = document.getElementById('phone').value;
    const email = document.getElementById('email').value;
    
    const nameValid = name.length >= 2;
    const phoneValid = phone && phone.match(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/);
    const emailValid = !email || email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    
    if (submitBtn) {
        submitBtn.disabled = !(nameValid && phoneValid && emailValid && selectedTables.length > 0);
    }
}

// События ввода для валидации
document.getElementById('name').addEventListener('input', validateForm);
document.getElementById('phone').addEventListener('input', validateForm);
document.getElementById('email').addEventListener('input', validateForm);

// Отправка формы
if (bookingForm) {
    bookingForm.onsubmit = async (e) => {
        e.preventDefault();
        
        if (submitBtn.disabled) return;
        
        const bookingData = {
            booking_date: selectedDate,
            booking_time: selectedTime,
            table_ids: selectedTables.map(t => parseInt(t.dataset.id)),
            customer_name: document.getElementById('name').value,
            customer_phone: document.getElementById('phone').value,
            customer_email: document.getElementById('email').value || null,
            comments: document.getElementById('comments').value || null,
            created_at: new Date().toISOString()
        };
        
        console.log('Отправка данных:', bookingData);
        
        try {
            const { data, error } = await supabase
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
        const { error } = await supabase
            .from('bookings')
            .delete()
            .lt('booking_date', today);

        if (error) throw error;
        console.log('Старые брони удалены');
    } catch (error) {
        console.error('Ошибка при очистке старых броней:', error);
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', function() {
    console.log('Страница загружена');
    
    // Загружаем временные слоты для сегодняшней даты
    loadAvailableTimeSlots(today);
    
    // Очищаем старые брони
    cleanupOldBookings();
});





