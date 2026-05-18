const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const CSV_FILE = path.join(__dirname, 'rsvps.csv');
const PHOTOS_DIR = path.join(__dirname, 'photos');

app.use(express.json());
app.use(express.static(__dirname));

// Serve photos directory
if (!fs.existsSync(PHOTOS_DIR)) fs.mkdirSync(PHOTOS_DIR);
app.use('/photos', express.static(PHOTOS_DIR));

// Return list of photo filenames for the gallery
app.get('/photos', (req, res) => {
  const files = fs.readdirSync(PHOTOS_DIR)
    .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
    .map(f => `/photos/${f}`);
  res.json(files);
});

// Save RSVP to CSV
app.post('/rsvp', (req, res) => {
  const { name, attending, guests, guestNames, note } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const timestamp = new Date().toLocaleString('en-CA', { timeZone: 'America/Edmonton' });
  const guestNamesStr = Array.isArray(guestNames) ? guestNames.join('; ') : '';
  const row = [timestamp, name, attending || '', guests || '1', guestNamesStr, note || '']
    .map(v => `"${String(v).replace(/"/g, '""')}"`)
    .join(',') + '\n';

  if (!fs.existsSync(CSV_FILE)) {
    fs.writeFileSync(CSV_FILE, '"Timestamp","Name","Attending","Guests","Guest Names","Note"\n');
  }
  fs.appendFileSync(CSV_FILE, row);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`\n  Vruti & Ravneet Wedding Site`);
  console.log(`  → http://localhost:${PORT}\n`);
  console.log(`  RSVPs save to: rsvps.csv`);
  console.log(`  Add photos to: photos/\n`);
});
