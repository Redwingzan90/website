const fs = require('fs');
const content = fs.readFileSync('index.html', 'utf8');

// Find and replace the property-card div line
// Original: <div class='property-card ${isHouse ? 'is-house' : ''} ${hasImages...
// New: <div class='property-card' data-price='${p.price}' ${isHouse ? 'is-house' : ''} ${hasImages...

const searchStr = `class='property-card \\${isHouse ? 'is-house' : ''}`;
const replaceStr = `class='property-card' data-price='\\${p.price}' \\${isHouse ? 'is-house' : ''}`;

const newContent = content.split(searchStr).join(replaceStr);

fs.writeFileSync('index.html', newContent);
console.log('Done - added data-price to property cards');