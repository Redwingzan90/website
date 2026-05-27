const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add data-price to property-card div
const oldCard = `<div class='property-card ${isHouse ? 'is-house' : ''}`;
const newCard = `<div class='property-card' data-price='${p.price}' ${isHouse ? 'is-house' : ''}`;
content = content.replace(oldCard, newCard);

// 2. Add sort functions before DOMContentLoaded
const sortFunctions = `
// Sort functions
function sortLowHigh() {
  const container = document.getElementById('propertiesContainer');
  const cards = Array.from(container.querySelectorAll('.property-card'));
  cards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
  cards.forEach(card => container.appendChild(card));
}

function sortHighLow() {
  const container = document.getElementById('propertiesContainer');
  const cards = Array.from(container.querySelectorAll('.property-card'));
  cards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
  cards.forEach(card => container.appendChild(card));
}
`;

// Insert before the DOMContentLoaded line
const domReadyIdx = content.indexOf('document.addEventListener(\\'DOMContentLoaded');
if (domReadyIdx !== -1) {
  content = content.slice(0, domReadyIdx) + sortFunctions + '\n' + content.slice(domReadyIdx);
}

fs.writeFileSync('index.html', content);
console.log('Done - added data-price and sort functions');