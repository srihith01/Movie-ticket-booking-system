module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  
  try {
    // Use in-memory storage for now (will reset on redeploy)
    // For persistent state, use Vercel KV or a database
    if (!global.seats) {
      global.seats = Array(24).fill(false);
      global.seats[2] = true;
      global.seats[5] = true;
      global.seats[13] = true;
    }
    res.status(200).json(global.seats);
  } catch (err) {
    console.error('Error reading seats:', err);
    res.status(500).json({ error: 'Failed to read seats' });
  }
};
