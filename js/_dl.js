const https = require('https');
const fs = require('fs');
const url = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
const out = 'C:/Users/29347/WorkBuddy/teacher Job/prototype/js/xlsx.full.min.js';
https.get(url, res => {
  if (res.statusCode !== 200) { console.error('HTTP', res.statusCode); process.exit(1); }
  const f = fs.createWriteStream(out);
  res.pipe(f);
  f.on('finish', () => { f.close(); console.log('saved', fs.statSync(out).size, 'bytes'); });
}).on('error', e => { console.error('ERR', e.message); process.exit(1); });
