const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Find and replace the modal lot display code
const oldCode = `<div class='modal-lot \\${lot.status === 'available' ? 'modal-lot-available' : 'modal-lot-sold'}'>
                    \\${lot.id}
                    <span class=modal-lot-status>\\${lot.status}</span>
                  </div>`;

const newCode = `<div class='modal-lot \\${lot.status === 'available' ? 'modal-lot-available' : 'modal-lot-sold'}'>
                    <div class=modal-lot-id>\\${lot.id}</div>
                    \\${lot.status === 'available' && lot.price ? `
                      <div class=modal-lot-price>\\${lot.price}</div>
                      <div class=modal-lot-terms>\\${lot.terms}</div>
                    ` : `<span class=modal-lot-status>\\${lot.status}</span>`}
                  </div>`;

content = content.replace(oldCode, newCode);
fs.writeFileSync('index.html', content);
console.log('Modal lot display updated');