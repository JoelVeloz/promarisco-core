const fs = require('fs');
const cheerio = require('cheerio');

// Leer el archivo HTML
const html = fs.readFileSync('./files/geocercas.html', 'utf-8');
const $ = cheerio.load(html);

// Eliminar elementos no deseados
$('svg').remove();
$('button').remove();
$('input').remove();
$('img').remove();

// Función para limpiar texto
function cleanText(text) {
  return text ? text.trim().replace(/\s+/g, ' ') : '';
}

// Función principal para convertir HTML a JSON
function htmlToJson(element) {
  // Si es texto, retornar el texto limpio
  if (element.type === 'text') {
    const text = cleanText(element.data);
    return text || null;
  }

  // Si no es un elemento tag, retornar null
  if (element.type !== 'tag') {
    return null;
  }

  const tagName = element.tagName;

  // Saltar elementos no deseados
  if (['svg', 'button', 'input', 'img'].includes(tagName)) {
    return null;
  }

  // Procesar hijos
  const children = [];
  if (element.children) {
    for (const child of element.children) {
      const childJson = htmlToJson(child);
      if (childJson !== null && childJson !== undefined) {
        // Si el hijo es un string vacío, omitirlo
        if (typeof childJson === 'string' && !childJson.trim()) {
          continue;
        }
        children.push(childJson);
      }
    }
  }

  // Si no tiene hijos, retornar null
  if (children.length === 0) {
    return null;
  }

  // Si solo tiene un hijo, retornar directamente el hijo
  if (children.length === 1) {
    return children[0];
  }

  // Retornar array de hijos
  return children;
}

// Convertir el HTML a JSON
const rootElement = $('body > *').first()[0] || $.root().children().first()[0];
let json = htmlToJson(rootElement);

// Función para limpiar y simplificar el JSON
function cleanJson(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Si es un array, procesar cada elemento
  if (Array.isArray(obj)) {
    const cleaned = obj.map(cleanJson).filter((item) => {
      // Eliminar null, undefined, strings vacíos
      if (item === null || item === undefined) {
        return false;
      }
      if (typeof item === 'string' && !item.trim()) {
        return false;
      }
      // Eliminar objetos vacíos
      if (typeof item === 'object' && !Array.isArray(item) && Object.keys(item).length === 0) {
        return false;
      }
      // Eliminar arrays vacíos
      if (Array.isArray(item) && item.length === 0) {
        return false;
      }
      return true;
    });

    // Si después de limpiar solo queda un elemento, retornar ese elemento
    if (cleaned.length === 1) {
      return cleaned[0];
    }

    return cleaned;
  }

  // Si es un objeto, procesar recursivamente
  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanedValue = cleanJson(value);
    if (cleanedValue !== null && cleanedValue !== undefined) {
      if (typeof cleanedValue === 'string' && !cleanedValue.trim()) {
        continue;
      }
      if (typeof cleanedValue === 'object' && !Array.isArray(cleanedValue) && Object.keys(cleanedValue).length === 0) {
        continue;
      }
      if (Array.isArray(cleanedValue) && cleanedValue.length === 0) {
        continue;
      }
      result[key] = cleanedValue;
    }
  }

  // Si el objeto resultante está vacío, retornar null
  if (Object.keys(result).length === 0) {
    return null;
  }

  return result;
}

// Limpiar el JSON
json = cleanJson(json);

// Función para eliminar elementos específicos no deseados
function removeUnwantedElements(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(removeUnwantedElements).filter((item) => {
      // Eliminar strings que son solo "?"
      if (typeof item === 'string' && item.trim() === '?') {
        return false;
      }
      return item !== null && item !== undefined;
    });
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    const cleanedValue = removeUnwantedElements(value);
    if (cleanedValue !== null && cleanedValue !== undefined) {
      result[key] = cleanedValue;
    }
  }

  return Object.keys(result).length === 0 ? null : result;
}

// Eliminar elementos no deseados
json = removeUnwantedElements(json);

// Guardar el JSON
fs.writeFileSync('./files/geocercas.json', JSON.stringify(json, null, 2), 'utf-8');

console.log('✅ HTML convertido a JSON exitosamente');
console.log('   - Eliminados: svg, button, input, img');
console.log('   - Sin atributos');
console.log('   - Estructura simplificada');
console.log('   - Elementos vacíos y no deseados eliminados');
console.log('📄 Archivo guardado en: ./files/geocercas.json');
