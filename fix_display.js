const fs = require('fs');
let content = fs.readFileSync('index.html', 'utf8');

// Change onerror from opacity:0 to display:none so the image truly disappears
// and the gradient fallback shows properly
content = content.replace(
  /onerror=\"this\\.style\\.opacity='0';this\\.parentElement\\.querySelector\\('.fallback-bg'\\)\\.style\\.display='flex';\"/g,
  'onerror=\"this.style.display=\\'none\\';this.parentElement.querySelector(\\\".fallback-bg\\\").style.display=\\'flex\\';\"'
);

fs.writeFileSync('index.html', content);
console.log('Fixed onerror to use display:none');