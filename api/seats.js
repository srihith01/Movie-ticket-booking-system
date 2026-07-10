module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  // Return a default state; client uses localStorage
  const defaultSeats = Array(24).fill(false);
  defaultSeats[2] = true;
  defaultSeats[5] = true;
  defaultSeats[13] = true;
  
  res.status(200).json(defaultSeats);
};
