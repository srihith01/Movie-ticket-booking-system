module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  try {
    const seatParam = req.query?.seat || req.url?.split('seat=')[1];
    const idx = Number.parseInt(seatParam, 10);
    
    if (Number.isNaN(idx) || idx < 0 || idx >= 24) {
      return res.status(400).json({ success: false, message: 'Invalid seat number' });
    }
    
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error booking seat:', err);
    res.status(500).json({ success: false, message: 'Server error: ' + (err?.message || 'Unknown') });
  }
};
