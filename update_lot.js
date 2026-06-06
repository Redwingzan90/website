const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Find and replace the lot dot line to add price display for available lots
const oldLine = "                    <div class='lot-dot ${lot.status === 'available' ? 'lot-available' : 'lot-sold'}'>${lot.id}</div>";
const newLine = `                    <div class='lot-dot ${lot.status === 'available' ? 'lot-available' : 'lot-sold'}'>
                      ${lot.id}${lot.status === 'available' && lot.price ? `<br><span class='lot-info'>${lot.price}<br>${lot.terms}</span>` : ''}
                    </div>`;

content = content.replace(oldLine, newLine);

fs.writeFileSync('index.html', content);
console.log('Updated lot display with prices');