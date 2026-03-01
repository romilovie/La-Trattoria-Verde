// Конфигурация Supabase
const supabaseUrl = 'https://yygbwpfckmwwuiudpiif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4';
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// Элементы DOM
const tables = document.querySelectorAll('.table.free');
const continueBtn = document.getElementById('continueBtn');
const tablesCount = document.getElementById('tablesCount');
const seatsCount = document.getElementById('seatsCount');
const bookingInfo = document.getElementById('bookingInfo');
const bookingForm = document.getElementById('bookingForm');
const bookingFormContainer = document.getElementById('bookingFormContainer');
const submitBtn = document.getElementById('submitBooking');
const timeSlots = document.getElementById('timeSlots');

// Состояние приложения
let selectedTables = [];
let selectedDate = null;
let selectedTime = null;
let availableTimeSlots = [];
let busyTables = [];

// Инициализация Flatpickr для календаря
flatpickr("#datePicker", {
    minDate: "today",
    dateFormat: "Y-m-d",
    onChange: function(selectedDates, dateStr, instance) {
        selectedDate = dateStr;
        loadAvailableTimeSlots(dateStr);
        resetTableSelection();
    }
});

// Маска для телефона
Inputmask("+7 (999) 999-99-99").mask(document.getElementById('phone'));

// Валидация email в реальном времени
document.getElementById('email').addEventListener('input', function(e) {
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (this.value && !emailPattern.test(this.value)) {
        this.setCustomValidity('Введите корректный email');
    } else {
        this.setCustomValidity('');
    }
});

// Загрузка доступного времени с проверкой прошедшего времени
async function loadAvailableTimeSlots(date) {
    const timeSlotsContainer = document.getElementById('timeSlots');
    timeSlotsContainer.innerHTML = '<div class="loading">Загрузка...</div>';
    
    // Базовые временные слоты
    const allTimeSlots = ['12:00', '13:00', '14:00', '15:00', '16:00', '17:00', 
                          '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
    
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
        const isToday = date === new Date().toISOString().split('T')[0];

        // Очищаем и заполняем слоты
        timeSlotsContainer.innerHTML = '';
        
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
            
            timeSlotsContainer.appendChild(timeButton);
        });
        
        availableTimeSlots = allTimeSlots.filter(time => {
            const [hours, minutes] = time.split(':').map(Number);
            return !busyTimeSlots.includes(time) && 
                   (!isToday || hours > currentHour || (hours === currentHour && minutes > currentMinutes));
        });
        
    } catch (error) {
        console.error('Ошибка загрузки времени:', error);
        timeSlotsContainer.innerHTML = '<div class="error">Ошибка загрузки</div>';
    }
}

// Выбор времени
function selectTime(button, time) {
    document.querySelectorAll('.time').forEach(b => b.classList.remove('selected'));
    button.classList.add('selected');
    selectedTime = time;
    
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
        const tableId = table.dataset.id;
        if (busyTables.includes(parseInt(tableId))) {
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
        
        const id = table.dataset.id;
        
        if (selectedTables.includes(table)) {
            table.classList.remove('selected');
            selectedTables = selectedTables.filter(t => t !== table);
        } else {
            table.classList.add('selected');
            selectedTables.push(table);
        }
        
        updateSummary();
    });
});

function updateSummary() {
    tablesCount.textContent = selectedTables.length;
    seatsCount.textContent = selectedTables.reduce((sum, t) => sum + Number(t.dataset.seats), 0);
    
    // Показываем форму, если выбраны столы, дата и время
    if (selectedTables.length > 0 && selectedDate && selectedTime) {
        bookingFormContainer.style.display = 'block';
        updateBookingInfo();
        validateForm();
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
    const phoneValid = phone.match(/^\+7 \(\d{3}\) \d{3}-\d{2}-\d{2}$/);
    const emailValid = !email || email.match(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/);
    
    submitBtn.disabled = !(nameValid && phoneValid && emailValid && selectedTables.length > 0);
}

// События ввода для валидации
document.getElementById('name').addEventListener('input', validateForm);
document.getElementById('phone').addEventListener('input', validateForm);
document.getElementById('email').addEventListener('input', validateForm);

// Отправка формы
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
    
    try {
        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData]);

        if (error) throw error;
        
        alert('Бронирование успешно создано!');
        window.location.href = 'booking-success.html';
        
    } catch (error) {
        console.error('Ошибка при бронировании:', error);
        alert('Произошла ошибка при бронировании. Пожалуйста, попробуйте снова.');
    }
};

function resetTableSelection() {
    selectedTables = [];
    selectedTime = null;
    document.querySelectorAll('.table.selected').forEach(t => t.classList.remove('selected'));
    document.querySelectorAll('.time.selected').forEach(t => t.classList.remove('selected'));
    updateSummary();
}

// Очистка устаревших броней (запускается при загрузке страницы)
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

// Запускаем очистку при загрузке
cleanupOldBookings();


