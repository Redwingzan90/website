const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Remove the Image not found text from fallback divs
content = content.replace(/<div style='text-align:center;color:rgba255,255,255,0.5);font-size:11px;'>Image not found<\/div>/g, '<div></div>');
content = content.replace(/<div style='text-align:center;color:rgba255,255,255,0.5);font-size:12px;'>Image not found<\/div>/g, '<div></div>');

fs.writeFileSync('index.html', content);
console.log('Fixed');