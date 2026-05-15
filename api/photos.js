const fs = require('fs');
const path = require('path');

module.exports = function handler(req, res) {
  const photosDir = path.join(process.cwd(), 'photos');
  if (!fs.existsSync(photosDir)) return res.json([]);
  const files = fs.readdirSync(photosDir)
    .filter(f => /\.(jpe?g|png|webp|gif|avif)$/i.test(f))
    .map(f => `/photos/${f}`);
  res.json(files);
};
