const seatingArea = document.getElementById('seatingArea');
const availableCount = document.getElementById('availableCount');
const bookedCount = document.getElementById('bookedCount');
const toast = document.getElementById('toast');
const selectedSeatsLabel = document.getElementById('selectedSeatsLabel');
const totalPriceLabel = document.getElementById('totalPriceLabel');
const bookBtn = document.getElementById('bookBtn');
const receiptModal = document.getElementById('receiptModal');
const receiptSeats = document.getElementById('receiptSeats');
const receiptPrice = document.getElementById('receiptPrice');
const receiptId = document.getElementById('receiptId');
const closeReceiptBtn = document.getElementById('closeReceiptBtn');
const statusBadge = document.getElementById('statusBadge');
const TICKET_PRICE = 12.50;
let selectedSeats = [];
let allSeats = []; // Cache of the seat states
let isLocalMockMode = false;
const API_BASE = (window.location.hostname === 'localhost' || window.location.protocol === 'file:')
    ? 'http://127.0.0.1:8085'
    : '';
function showToast(message, type = 'info') {
    toast.textContent = message;
    toast.style.borderLeftColor = type === 'error' ? '#ef4444' : '#8b5cf6';
    toast.classList.add('show');
    if (window.toastTimeout) clearTimeout(window.toastTimeout);
    window.toastTimeout = setTimeout(() => toast.classList.remove('show'), 3000);
}
function updateStatus(state) {
    if (!statusBadge) return;
    statusBadge.className = 'status-badge';
    if (state === 'live') {
        statusBadge.classList.add('status-live');
        statusBadge.textContent = '● Live: C++ Server Connected';
    }
     else if (state === 'mock') {
        statusBadge.classList.add('status-mock');
        statusBadge.textContent = '● Mock Mode: Local Server';
    } 
    else {
        statusBadge.classList.add('status-offline');
        statusBadge.textContent = '● Connecting...';
    }
}
function loadMockSeats() {
    const saved = localStorage.getItem('aura_cineplex_seats');
    if (saved) {
        allSeats = JSON.parse(saved);
    } else {
        allSeats = Array(24).fill(false);
        // Seed a few booked seats for demonstration
        allSeats[2] = true;
        allSeats[5] = true;
        allSeats[13] = true;
        localStorage.setItem('aura_cineplex_seats', JSON.stringify(allSeats));
    }
    renderSeats();
}
async function loadSeats() {
    if (isLocalMockMode) {
        loadMockSeats();
        return;
    }
    try {
        const response = await fetch(`${API_BASE}/api/seats`);
        if (!response.ok) throw new Error('API response not ok');
        allSeats = await response.json();
        isLocalMockMode = false;
        updateStatus('live');
        renderSeats();
    } catch (error) {
        console.warn('Backend server offline. Switching to mock storage demo mode.');
        isLocalMockMode = true;
        updateStatus('mock');
        showToast('Backend offline. Running in Mock Mode.', 'info');
        loadMockSeats();
    }
}
function getSeatLabel(idx) {
    const row = String.fromCharCode(65 + Math.floor(idx / 6));
    const col = (idx % 6) + 1;
    return `${row}${col}`;
}
function renderSeats() {
    seatingArea.innerHTML = '';
    let available = 0, booked = 0;
    allSeats.forEach((isBooked, idx) => {
        const seat = document.createElement('div');
        const isSelected = selectedSeats.includes(idx);
        
        seat.className = `seat ${isBooked ? 'booked' : (isSelected ? 'selected' : 'available')}`;
        seat.textContent = getSeatLabel(idx);
        
        if (isBooked) {
            booked++;
            seat.addEventListener('click', () => handleCancel(idx, getSeatLabel(idx)));
        } else {
            available++;
            seat.addEventListener('click', () => toggleSelectSeat(idx));
        }
        seatingArea.appendChild(seat);
    });
    availableCount.textContent = available;
    bookedCount.textContent = booked;
}
function toggleSelectSeat(idx) {
    const seatPos = selectedSeats.indexOf(idx);
    if (seatPos > -1) {
        selectedSeats.splice(seatPos, 1);
    } else {
        selectedSeats.push(idx);
    }
    renderSeats();
    updateCheckout();
}
function updateCheckout() {
    if (selectedSeats.length === 0) {
        selectedSeatsLabel.textContent = 'None';
        totalPriceLabel.textContent = '$0.00';
        bookBtn.disabled = true;
    } else {
        selectedSeatsLabel.textContent = selectedSeats.map(getSeatLabel).join(', ');
        totalPriceLabel.textContent = `$${(selectedSeats.length * TICKET_PRICE).toFixed(2)}`;
        bookBtn.disabled = false;
    }
}
function showReceipt() {
    receiptSeats.textContent = selectedSeats.map(getSeatLabel).join(', ');
    receiptPrice.textContent = `$${(selectedSeats.length * TICKET_PRICE).toFixed(2)}`;
    receiptId.textContent = 'TXN-' + Math.random().toString(36).substr(2, 9).toUpperCase();
    receiptModal.classList.add('show');
    
    selectedSeats = [];
    updateCheckout();
    loadSeats();
}
bookBtn.addEventListener('click', async () => {
    if (selectedSeats.length === 0) return;
    
    bookBtn.disabled = true;
    bookBtn.textContent = 'Booking...';
    
    if (isLocalMockMode) {
        setTimeout(() => {
            selectedSeats.forEach(idx => {
                allSeats[idx] = true;
            });
            localStorage.setItem('aura_cineplex_seats', JSON.stringify(allSeats));
            showReceipt();
            bookBtn.textContent = 'Confirm Booking';
        }, 500);
        return;
    }
    
    try {
        // Book all selected seats in parallel
        const promises = selectedSeats.map(idx => 
            fetch(`${API_BASE}/api/book?seat=${idx}`).then(res => res.json())
        );
        const results = await Promise.all(promises);
        const allSuccessful = results.every(res => res.success);
        
        if (allSuccessful) {
            showReceipt();
        } else {
            showToast('Some seat bookings failed. Please try again.', 'error');
            loadSeats();
        }
    } catch (err) {
        showToast('Error sending booking request.', 'error');
    } finally {
        bookBtn.textContent = 'Confirm Booking';
    }
});
async function handleCancel(index, label) {
    if (confirm(`Do you want to cancel booking for seat ${label}?`)) {
        if (isLocalMockMode) {
            allSeats[index] = false;
            localStorage.setItem('aura_cineplex_seats', JSON.stringify(allSeats));
            showToast(`Seat ${label} booking cancelled.`);
            const selIdx = selectedSeats.indexOf(index);
            if (selIdx > -1) selectedSeats.splice(selIdx, 1);
            updateCheckout();
            loadSeats();
            return;
        }
        try {
            const response = await fetch(`${API_BASE}/api/cancel?seat=${index}`);
            const result = await response.json();
            if (result.success) {
                showToast(`Seat ${label} booking cancelled.`);
                // If the cancelled seat was selected, remove it
                const selIdx = selectedSeats.indexOf(index);
                if (selIdx > -1) selectedSeats.splice(selIdx, 1);
                
                updateCheckout();
                loadSeats();
            } else {
                showToast(result.message || 'Cancellation failed.', 'error');
            }
        } catch (error) {
            showToast('Error sending cancellation request.', 'error');
        }
    }
}
closeReceiptBtn.addEventListener('click', () => {
    receiptModal.classList.remove('show');
});
// Initial load
loadSeats();
