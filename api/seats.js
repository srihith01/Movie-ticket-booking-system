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

module.exports = (req, res) => {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  const seats = readSeats();
  res.status(200).json(seats);
};
