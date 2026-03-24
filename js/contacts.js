// ==================== ИНИЦИАЛИЗАЦИЯ SUPABASE ====================

const SUPABASE_URL = 'https://...';
const SUPABASE_ANON_KEY = 'YOUR_KEY';

// Создание клиента Supabase (если библиотека подключена)
const supabaseClient = window.supabase?.createClient 
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    : null;

// ==================== ОСНОВНОЙ КОД ====================

document.addEventListener('DOMContentLoaded', function() {

    // ==================== ВАЛИДАЦИЯ ДАННЫХ ====================
    
    // Проверка email
    function isValidEmail(email) {
        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        return emailRegex.test(email);
    }

    // Проверка телефона
    function isValidPhone(phone) {
        const phoneDigits = phone.replace(/\D/g, '');
        return phoneDigits.length === 11;
    }

    // ==================== СОХРАНЕНИЕ В БАЗУ ====================
    
    /**
     * Сохраняет сообщение пользователя в таблицу feedback_messages
     * @param {Object} formData - данные формы
     */
    async function saveToDatabase(formData) {
        const { data, error } = await supabaseClient
            .from('feedback_messages')
            .insert([{
                name: formData.name,
                phone: formData.phone,
                email: formData.email,
                message: formData.message,
                ip_address: formData.ip_address,
                user_agent: formData.user_agent,
                created_at: new Date().toISOString()
            }]);

        if (error) throw error;
        return data;
    }
});

