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
                console.log('Проверьте:');
                console.log('1. Настроены ли RLS политики?');
                console.log('2. Существует ли таблица bookings?');
                return false;
            }
            
            console.log('✅ Подключение успешно! В таблице записей:', count || 0);
            return true;
        } catch (err) {
            console.error('❌ Критическая ошибка:', err);
            return false;
        }
    }
    
    // Вызов после создания supabaseClient
    testSupabaseConnection().then(success => {
        if (success) {
            loadAvailableTimeSlots(today);
            cleanupOldBookings();
        }
    });
    
    // ==================== ПОЛУЧЕНИЕ DOM-ЭЛЕМЕНТОВ ====================
    
    const tables = document.querySelectorAll('.table.free'); // доступные столы
    const tablesCount = document.getElementById('tablesCount'); // количество столов
    const seatsCount = document.getElementById('seatsCount'); // количество мест
    const bookingInfo = document.getElementById('bookingInfo'); // блок информации
    const bookingForm = document.getElementById('bookingForm'); // форма бронирования
    const bookingFormContainer = document.getElementById('bookingFormContainer');
    const submitBtn = document.getElementById('submitBooking');
    const timeSlots = document.getElementById('timeSlots'); // временные слоты
    const dateInput = document.getElementById('bookingDate'); // выбор даты
    const phoneInput = document.getElementById('phone'); // телефон пользователя
    
    // ==================== СОСТОЯНИЕ ПРИЛОЖЕНИЯ ====================
    
    let selectedTables = []; // выбранные столы
    let selectedDate = null; // выбранная дата
    let selectedTime = null; // выбранное время
    let busyTables = [];     // занятые столы
    
    // ==================== НАСТРОЙКА ДАТЫ ====================
    
    // Установка минимальной даты (сегодня)
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    dateInput.value = today;
    selectedDate = today;
    
    // ==================== ВАЛИДАЦИЯ И МАСКИ ====================
    
    // Маска ввода телефона (если подключена библиотека Inputmask)
    if (phoneInput && typeof Inputmask !== 'undefined') {
        Inputmask("+7 (999) 999-99-99").mask(phoneInput);
    }
    
    // ==================== ЗАГРУЗКА ДОСТУПНОГО ВРЕМЕНИ ====================
    
    /**
     * Загружает доступные временные слоты для выбранной даты
     * @param {string} date - дата бронирования
     */
    async function loadAvailableTimeSlots(date) {
        const allTimeSlots = ['12:00','13:00','14:00','15:00','16:00','17:00',
                             '18:00','19:00','20:00','21:00','22:00'];
        
        try {
            // Получение занятых временных слотов из базы данных
            const { data: bookings } = await supabaseClient
                .from('bookings')
                .select('booking_time')
                .eq('booking_date', date);

            const busyTimeSlots = bookings.map(b => b.booking_time);
            
            timeSlots.innerHTML = '';

            // Генерация кнопок времени
            allTimeSlots.forEach(time => {
                const btn = document.createElement('button');
                btn.textContent = time;

                // Блокировка занятых слотов
                if (busyTimeSlots.includes(time)) {
                    btn.disabled = true;
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
        selectedTime = time;

        // Загрузка занятых столов на выбранное время
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

            // Формирование списка занятых столов
            busyTables = bookings.flatMap(b => b.table_ids);
            
            updateTablesStatus();
        } catch (error) {
            console.error('Ошибка загрузки столов:', error);
        }
    }
    
    // ==================== ОТПРАВКА ФОРМЫ ====================
    
    if (bookingForm) {
        bookingForm.onsubmit = async (e) => {
            e.preventDefault();

            // Формирование объекта бронирования
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
                // Отправка данных в Supabase
                const { error } = await supabaseClient
                    .from('bookings')
                    .insert([bookingData]);

                if (error) throw error;

                alert('Бронирование успешно создано!');
            } catch (error) {
                console.error('Ошибка бронирования:', error);
            }
        };
    }

    // ==================== ОЧИСТКА СТАРЫХ БРОНЕЙ ====================
    
    async function cleanupOldBookings() {
        const today = new Date().toISOString().split('T')[0];
        
        await supabaseClient
            .from('bookings')
            .delete()
            .lt('booking_date', today);
    }

    loadAvailableTimeSlots(today);
    cleanupOldBookings();
});

