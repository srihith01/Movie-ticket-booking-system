const fs = require('fs');
const path = require('path');

const FILE = path.join(process.cwd(), 'seats.json');

function readSeats() {
  try {
    const raw = fs.readFileSync(FILE, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    const arr = Array(24).fill(false);
    fs.writeFileSync(FILE, JSON.stringify(arr));
    return arr;
  }
}

function writeSeats(seats) {
  fs.writeFileSync(FILE, JSON.stringify(seats));
}

module.exports = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const seatParam = url.searchParams.get('seat');
    const idx = Number.parseInt(seatParam, 10);
    if (Number.isNaN(idx)) return res.status(400).json({ success: false, message: 'Invalid seat' });

    const seats = readSeats();
    if (idx < 0 || idx >= seats.length) return res.status(400).json({ success: false, message: 'Invalid seat number' });
    if (!seats[idx]) return res.status(400).json({ success: false, message: 'Seat is not booked' });

    seats[idx] = false;
    writeSeats(seats);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error cancelling seat:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
