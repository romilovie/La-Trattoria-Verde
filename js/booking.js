const tables = document.querySelectorAll('.table.free');
const continueBtn = document.getElementById('continueBtn');
const tablesCount = document.getElementById('tablesCount');
const seatsCount = document.getElementById('seatsCount');

const timeModal = document.getElementById('timeModal');
const formModal = document.getElementById('formModal');

const confirmTimeBtn = document.getElementById('confirmTime');
const bookingInfo = document.getElementById('bookingInfo');

let selectedTables = [];
let selectedTime = null;

// ===== ВЫБОР СТОЛИКОВ =====
tables.forEach(table => {
    table.addEventListener('click', () => {
        const id = table.dataset.id;
        const seats = Number(table.dataset.seats);

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
    continueBtn.disabled = selectedTables.length === 0;
}

// ===== МОДАЛКА ВРЕМЕНИ =====
continueBtn.onclick = () => timeModal.classList.remove('hidden');

document.getElementById('backToTables').onclick = () =>
    timeModal.classList.add('hidden');

document.querySelectorAll('.time:not(.busy)').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.time').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedTime = btn.textContent;
        confirmTimeBtn.disabled = false;
    };
});

confirmTimeBtn.onclick = () => {
    timeModal.classList.add('hidden');
    formModal.classList.remove('hidden');

    bookingInfo.innerHTML = `
        Дата: ${document.getElementById('bookingDate').value}<br>
        Время: ${selectedTime}<br>
        Столики: ${selectedTables.map(t => '№' + t.dataset.id).join(', ')}<br>
        Мест: ${seatsCount.textContent}
    `;
};

// ===== ФОРМА =====
document.getElementById('backToTime').onclick = () => {
    formModal.classList.add('hidden');
    timeModal.classList.remove('hidden');
};

document.getElementById('bookingForm').onsubmit = e => {
    e.preventDefault();
    window.location.href = 'booking-success.html';
};
