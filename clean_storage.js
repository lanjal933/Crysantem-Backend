const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'myia-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar patrones duplicados de localStorage
content = content.replace(/updatePreview\(\);\s+localStorage\.set\('builderConfig', JSON\.stringify\(builderConfig\)\);/g, 'saveAndUpdatePreview();');
content = content.replace(/updatePreview\(\);\s+localStorage\.setItem\('builderConfig', JSON\.stringify\(builderConfig\)\);/g, 'saveAndUpdatePreview();');

fs.writeFileSync(filePath, content, 'utf8');
console.log('Cleaned duplicate localStorage calls');
