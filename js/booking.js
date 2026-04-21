// ==================== ИНИЦИАЛИЗАЦИЯ ====================

// Ожидание полной загрузки DOM-дерева перед запуском скрипта
document.addEventListener('DOMContentLoaded', function() {
    console.log('booking.js загружен и готов к работе');
    
    // ==================== КОНФИГУРАЦИЯ SUPABASE ====================
    
    // URL и публичный ключ проекта Supabase
    const SUPABASE_URL = 'https://yygbwpfckmwwuiudpiif.supabase.co';
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5Z2J3cGZja213d3VpdWRwaWlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIzODA4MzAsImV4cCI6MjA4Nzk1NjgzMH0.fodKHJqCzT6VJryALAIGojmzZJdGoOTnNaNjqEusQZ4';

    // ==================== ТЕСТИРОВАНИЕ SUPABASE ====================
    
    // Создание клиента для взаимодействия с базой данных
    const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    
    async function testSupabaseConnection() {
        console.log('Тестируем подключение к Supabase...');
        
        try {
            const { data, error, count } = await supabaseClient
                .from('bookings')
                .select('*', { count: 'exact', head: true });
            
            if (error) {
                console.error('❌ Ошибка подключения:', error.message);
                return false;
            }
            
            console.log('✅ Подключение успешно! В таблице записей:', count || 0);
            return true;
        } catch (err) {
            console.error('❌ Критическая ошибка:', err);
            return false;
        }
    }
    
    // ==================== ПОЛУЧЕНИЕ DOM-ЭЛЕМЕНТОВ ====================
    
    let tables = []; // Будет заполнено позже
    const tablesCount = document.getElementById('tablesCount');
    const seatsCount = document.getElementById('seatsCount');
    const bookingInfo = document.getElementById('bookingInfo');
    const bookingForm = document.getElementById('bookingForm');
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const submitBtn = document.getElementById('submitBooking');
    const timeSlots = document.getElementById('timeSlots');
    const dateInput = document.getElementById('bookingDate');
    const phoneInput = document.getElementById('phone');
    
    // ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
    
    let selectedTables = [];
    let selectedDate = null;
    let selectedTime = null;
    let busyTables = [];
    
    // ==================== НАСТРОЙКА ДАТЫ ====================
    
    // Установка минимальной даты (сегодня)
    const today = new Date().toISOString().split('T')[0];
    if (dateInput) {
        dateInput.min = today;
        dateInput.value = today;
        selectedDate = today;
    }
    
    // Обработчик изменения даты
    if (dateInput) {
        dateInput.addEventListener('change', function(e) {
            selectedDate = e.target.value;
            selectedTime = null;
            selectedTables = [];
            updateSelectionSummary();
            hideBookingForm();
            loadAvailableTimeSlots(selectedDate);
        });
    }
    
    // ==================== ВАЛИДАЦИЯ И МАСКИ ====================
    
    // Маска ввода телефона (если подключена библиотека Inputmask)
    if (phoneInput && typeof Inputmask !== 'undefined') {
        Inputmask("+7 (999) 999-99-99").mask(phoneInput);
    }
    
    // ==================== ЗАГРУЗКА ДОСТУПНОГО ВРЕМЕНИ ====================
    
    async function loadAvailableTimeSlots(date) {
        const allTimeSlots = ['12:00','13:00','14:00','15:00','16:00','17:00',
                             '18:00','19:00','20:00','21:00','22:00'];
        
        if (!timeSlots) return;
        
        try {
            const { data: bookings } = await supabaseClient
                .from('bookings')
                .select('booking_time')
                .eq('booking_date', date);

            const busyTimeSlots = bookings ? bookings.map(b => b.booking_time) : [];
            
            timeSlots.innerHTML = '';

            allTimeSlots.forEach(time => {
                const btn = document.createElement('button');
                btn.textContent = time;
                btn.className = 'time-slot-btn';

                if (busyTimeSlots.includes(time)) {
                    btn.disabled = true;
                    btn.classList.add('disabled');
                } else {
                    btn.addEventListener('click', () => selectTime(btn, time));
                }

                timeSlots.appendChild(btn);
            });
        } catch (error) {
            console.error('Ошибка загрузки времени:', error);
        }
    }
    
    // ==================== ВЫБОР ВРЕМЕНИ ====================
    
    function selectTime(button, time) {
        document.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.classList.remove('selected');
        });
        
        button.classList.add('selected');
        selectedTime = time;
        
        selectedTables = [];
        updateSelectionSummary();
        hideBookingForm();
        
        loadBusyTables(selectedDate, selectedTime);
    }
    
    // ==================== ЗАГРУЗКА ЗАНЯТЫХ СТОЛОВ ====================
    
    async function loadBusyTables(date, time) {
        try {
            const { data: bookings } = await supabaseClient
                .from('bookings')
                .select('table_ids')
                .eq('booking_date', date)
                .eq('booking_time', time);

            busyTables = bookings ? bookings.flatMap(b => b.table_ids) : [];
            
            updateTablesStatus();
        } catch (error) {
            console.error('Ошибка загрузки столов:', error);
        }
    }
    
    // ==================== ОБНОВЛЕНИЕ СТАТУСА СТОЛОВ ====================
    
    function updateTablesStatus() {
        // Получаем свежие ссылки на столы
        tables = document.querySelectorAll('.table');
        
        tables.forEach(table => {
            const tableId = parseInt(table.dataset.id);
            
            // Сбрасываем классы
            table.classList.remove('busy', 'selected');
            
            // Добавляем класс в зависимости от статуса
            if (busyTables.includes(tableId)) {
                table.classList.add('busy');
                table.classList.remove('free');
            } else {
                table.classList.add('free');
            }
            
            // Проверяем, выбран ли стол
            if (selectedTables.includes(table)) {
                table.classList.add('selected');
            }
        });
    }
    
    // ==================== ВЫБОР СТОЛА ====================
    
    function toggleTableSelection(tableElement) {
        const index = selectedTables.indexOf(tableElement);
        
        if (index === -1) {
            selectedTables.push(tableElement);
            tableElement.classList.add('selected');
        } else {
            selectedTables.splice(index, 1);
            tableElement.classList.remove('selected');
        }
        
        updateSelectionSummary();
        
        if (selectedTables.length > 0 && selectedTime) {
            showBookingForm();
        } else {
            hideBookingForm();
        }
    }
    
    // ==================== ОБНОВЛЕНИЕ ИНФОРМАЦИИ ====================
    
    function updateSelectionSummary() {
        if (!tablesCount || !seatsCount) return;
        
        const count = selectedTables.length;
        tablesCount.textContent = count;
        
        let totalSeats = 0;
        selectedTables.forEach(table => {
            const seats = parseInt(table.dataset.seats);
            totalSeats += seats;
        });
        seatsCount.textContent = totalSeats;
        
        if (bookingInfo) {
            if (selectedTables.length > 0 && selectedTime && selectedDate) {
                bookingInfo.innerHTML = `
                    <p>Вы выбрали:</p>
                    <ul>
                        <li><strong>Дата:</strong> ${formatDate(selectedDate)}</li>
                        <li><strong>Время:</strong> ${selectedTime}</li>
                        <li><strong>Столов:</strong> ${selectedTables.length}</li>
                        <li><strong>Мест:</strong> ${totalSeats}</li>
                        <li><strong>Номера столов:</strong> ${selectedTables.map(t => t.dataset.id).join(', ')}</li>
                    </ul>
                `;
            } else {
                bookingInfo.innerHTML = '';
            }
        }
    }
    
    function formatDate(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}.${month}.${year}`;
    }
    
    // ==================== УПРАВЛЕНИЕ ФОРМОЙ ====================
    
    function showBookingForm() {
        if (bookingFormContainer) {
            bookingFormContainer.style.display = 'block';
        }
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }
    
    function hideBookingForm() {
        if (bookingFormContainer) {
            bookingFormContainer.style.display = 'none';
        }
        if (submitBtn) {
            submitBtn.disabled = true;
        }
        if (bookingForm) {
            bookingForm.reset();
        }
        if (bookingInfo) {
            bookingInfo.innerHTML = '';
        }
    }
    
    // ==================== ОТПРАВКА ФОРМЫ ====================
    
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();
            
            if (!selectedDate || !selectedTime || selectedTables.length === 0) {
                alert('Пожалуйста, выберите дату, время и столики');
                return;
            }
            
            const nameInput = document.getElementById('name');
            const phoneInputField = document.getElementById('phone');
            
            if (!nameInput || !phoneInputField || !nameInput.value || !phoneInputField.value) {
                alert('Пожалуйста, заполните имя и телефон');
                return;
            }
            
            const bookingData = {
                booking_date: selectedDate,
                booking_time: selectedTime,
                table_ids: selectedTables.map(t => parseInt(t.dataset.id)),
                customer_name: nameInput.value,
                customer_phone: phoneInputField.value,
                customer_email: document.getElementById('email')?.value || null,
                comments: document.getElementById('comments')?.value || null,
                created_at: new Date().toISOString()
            };
            
            const submitButton = document.getElementById('submitBooking');
            if (submitButton) {
                submitButton.disabled = true;
                submitButton.textContent = 'Отправка...';
            }
            
            try {
                const { error } = await supabaseClient
                    .from('bookings')
                    .insert([bookingData]);
                
                if (error) throw error;
                
                alert('Бронирование успешно создано!');
                
                if (bookingForm) bookingForm.reset();
                selectedTables = [];
                selectedTime = null;
                updateSelectionSummary();
                hideBookingForm();
                loadAvailableTimeSlots(selectedDate);
                
                document.querySelectorAll('.time-slot-btn').forEach(btn => {
                    btn.classList.remove('selected');
                });
                
            } catch (error) {
                console.error('Ошибка бронирования:', error);
                alert('Ошибка при бронировании: ' + error.message);
            } finally {
                if (submitButton) {
                    submitButton.disabled = false;
                    submitButton.textContent = 'Забронировать';
                }
            }
        };
    }
    
    // ==================== ОЧИСТКА СТАРЫХ БРОНЕЙ ====================
    
    async function cleanupOldBookings() {
        const today = new Date().toISOString().split('T')[0];
        
        try {
            const { error } = await supabaseClient
                .from('bookings')
                .delete()
                .lt('booking_date', today);
            
            if (error) {
                console.error('Ошибка очистки старых броней:', error);
            }
        } catch (error) {
            console.error('Ошибка при очистке:', error);
        }
    }
    
    // ==================== ИНИЦИАЛИЗАЦИЯ ====================
    
    function initTableHandlers() {
        tables = document.querySelectorAll('.table');
        
        tables.forEach(table => {
            // Удаляем старые обработчики, если есть
            const newTable = table.cloneNode(true);
            table.parentNode?.replaceChild(newTable, table);
            
            newTable.addEventListener('click', (e) => {
                e.stopPropagation();
                const tableId = parseInt(newTable.dataset.id);
                
                if (!selectedTime) {
                    alert('Сначала выберите дату и время');
                    return;
                }
                
                if (busyTables.includes(tableId)) {
                    alert('Этот стол уже забронирован на выбранное время');
                    return;
                }
                
                toggleTableSelection(newTable);
            });
        });
        
        // Обновляем глобальную переменную tables
        tables = document.querySelectorAll('.table');
    }
    
    // Запуск
    testSupabaseConnection().then(success => {
        if (success) {
            loadAvailableTimeSlots(today);
            cleanupOldBookings();
            initTableHandlers();
        }
    });
});
