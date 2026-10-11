const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend', 'js', 'myia-builder.js');
let content = fs.readFileSync(filePath, 'utf8');

// Agregar localStorage.setItem después de cada updatePreview() en event listeners
const lines = content.split('\n');
const result = [];

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  result.push(line);

  // Si la línea tiene updatePreview() y está dentro de un event listener
  if (line.includes('updatePreview()') && !line.includes('//')) {
    // Verificar si no es la última línea de una función
    const nextLine = lines[i + 1] || '';
    if (nextLine.trim() === '});' || nextLine.trim() === '};') {
      // Ya estamos al final, insertar antes
      result.pop();
      result.push(line.replace('updatePreview();', 'updatePreview();\n      localStorage.setItem(\'builderConfig\', JSON.stringify(builderConfig));'));
    } else if (nextLine.trim() === '' && lines[i + 2]?.trim() === '});') {
      // Hay una línea vacía antes del cierre
      result.push('');
      result.push('      localStorage.setItem(\'builderConfig\', JSON.stringify(builderConfig));');
    }
  }
}

fs.writeFileSync(filePath, result.join('\n'), 'utf8');
console.log('Done');
