module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { name, attending, guests, guestNames, note } = req.body;
  if (!name) return res.status(400).json({ error: 'Missing required fields' });

  // Forward to Google Apps Script if configured (set RSVP_SHEET_URL in Vercel env vars)
  const sheetUrl = process.env.RSVP_SHEET_URL;
  if (sheetUrl) {
    try {
      await fetch(sheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp: new Date().toLocaleString('en-CA', { timeZone: 'America/Edmonton' }),
          name, attending, guests,
          guestNames: Array.isArray(guestNames) ? guestNames.join('; ') : '',
          note
        })
      });
    } catch (e) {
      console.error('RSVP sheet error:', e.message);
    }
  }

  res.json({ success: true });
};
