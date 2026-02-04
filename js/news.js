document.querySelectorAll('.news-btn').forEach(button => {
    button.addEventListener('click', () => {
        const card = button.closest('.news-card');
        card.classList.toggle('open');
        button.textContent = card.classList.contains('open')
            ? 'Свернуть'
            : 'Подробнее';
    });
});
