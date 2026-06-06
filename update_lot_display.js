const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Replace the simple lot dot with one that shows price info for available lots
const oldCode = `<div class='lot-dot \\\\${lot.status === 'available' ? 'lot-available' : 'lot-sold'}'>\\\\${lot.id}</div>`;
const newCode = `<div class='lot-dot \\\\${lot.status === 'available' ? 'lot-available' : 'lot-sold'}'>
  \\\\${lot.id}
  \\\\${lot.status === 'available' && lot.price ? \\\\\\\"<div class='lot-price'>\\\\\\\".concat(lot.price).concat(\"</div><div class='lot-terms'>\\\\\\\").concat(lot.terms).concat(\"</div>\\\\\\") : ''}
</div>`;

// Find the lot indicators section and replace it
content = content.replace(
  /<div class='lot-dot \\\\${lot.status === 'available' \\? 'lot-available' : 'lot-sold'}'>\\\\${lot.id}<\\/div>/g,
  `<div class='lot-dot \\\\${lot.status === 'available' ? 'lot-available' : 'lot-sold'}'>
  \\\\${lot.id}\\\\${lot.status === 'available' && lot.price ? \\\\\\\"<span class='lot-price'>\\\\\\\".concat(lot.price).concat(\" - \").concat(lot.terms).concat(\"</span>\\\\\\\") : ''}
</div>`
);

fs.writeFileSync('index.html', content);
console.log('Updated lot display code');