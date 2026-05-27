const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// 1. Add data-price to property-card div
content = content.replace(
  /<div class='property-card (.*?)' style='animation-delay:/,
  function(match, classes) {
    return `<div class='property-card' data-price='\n          \\${p.price}\n        ' style='animation-delay:`;
  }
);

// Actually let me just add data-price after the first property-card match
const oldDiv = `<div class='property-card ${isHouse ? 'is-house' : ''}`;
const newDiv = `<div class='property-card' data-price='${p.price}' ${isHouse ? 'is-house' : ''}`;
content = content.replace(oldDiv, newDiv);

// 2. Add sort functions before the DOMContentLoaded
const sortCode = `
// Sort by price
function sortLowHigh() {
  const container = document.getElementById('propertiesContainer');
  const cards = Array.from(container.querySelectorAll('.property-card'));
  cards.sort((a, b) => parseInt(a.dataset.price) - parseInt(b.dataset.price));
  cards.forEach(c => container.appendChild(c));
}

function sortHighLow() {
  const container = document.getElementById('propertiesContainer');
  const cards = Array.from(container.querySelectorAll('.property-card'));
  cards.sort((a, b) => parseInt(b.dataset.price) - parseInt(a.dataset.price));
  cards.forEach(c => container.appendChild(c));
}

`;

// Find DOMContentLoaded and insert before it
const domIdx = content.indexOf('document.addEventListener');
if (domIdx > -1) {
  content = content.slice(0, domIdx) + sortCode + content.slice(domIdx);
}

fs.writeFileSync('index.html', content);
console.log('Done');