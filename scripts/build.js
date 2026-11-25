// Wraps index.html in a full HTML document so it can be hosted anywhere (Netlify, GitHub Pages, Vercel).
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), out = path.join(root, 'dist');
fs.mkdirSync(path.join(out, 'adapters'), { recursive: true });
const body = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
fs.writeFileSync(path.join(out, 'index.html'), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<style>:root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}[hidden]{display:none!important}img{max-width:100%}</style>
</head><body>
${body}
</body></html>
`);
for (const f of ['reliefs.js', 'engine.js', 'app.js']) fs.copyFileSync(path.join(root, f), path.join(out, f));
fs.cpSync(path.join(root, 'vendor'), path.join(out, 'vendor'), { recursive: true });
console.log('Built dist/');
