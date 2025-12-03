const fs = require('fs');
const path = require('path');

// Función para parsear una línea CSV con delimitador punto y coma
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Agregar el último campo
  result.push(current.trim());
  
  return result;
}

// Función para convertir el CSV a JSON
function convertCSVToJSON(csvPath, outputPath) {
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim() !== '');
  
  if (lines.length === 0) {
    console.error('El archivo CSV está vacío');
    return;
  }

  // Leer encabezados
  const headers = parseCSVLine(lines[0]);
  console.log('Encabezados:', headers);

  const result = [];
  let currentGroup = null;

  // Procesar cada línea (empezando desde la línea 1, después de los encabezados)
  for (let i = 1; i < lines.length; i++) {
    const fields = parseCSVLine(lines[i]);
    
    if (fields.length < headers.length) {
      continue; // Saltar líneas incompletas
    }

    const agrupacion = fields[0]?.replace(/"/g, '') || '';
    const unidad = fields[1]?.replace(/"/g, '') || '';
    const geocerca = fields[2]?.replace(/"/g, '') || '';
    const horaEntrada = fields[3]?.replace(/"/g, '') || '';
    const horaSalida = fields[4]?.replace(/"/g, '') || '';
    const descripcion = fields[5]?.replace(/"/g, '') || '';

    // Si la unidad y geocerca son "----", es una fila de resumen de grupo
    if (unidad === '----' && geocerca === '----') {
      // Si hay un grupo anterior, guardarlo
      if (currentGroup) {
        result.push(currentGroup);
      }
      
      // Crear nuevo grupo
      currentGroup = {
        agrupacion: agrupacion,
        horaEntradaInicial: horaEntrada,
        horaSalidaFinal: horaSalida,
        eventos: []
      };
    } else {
      // Es una fila de detalle
      if (!currentGroup) {
        // Si no hay grupo actual, crear uno con el nombre de la agrupación
        currentGroup = {
          agrupacion: agrupacion || 'SIN_AGRUPACION',
          horaEntradaInicial: horaEntrada,
          horaSalidaFinal: horaSalida,
          eventos: []
        };
      }

      // Agregar evento al grupo actual
      currentGroup.eventos.push({
        horaEntrada: horaEntrada,
        unidad: unidad,
        geocerca: geocerca,
        horaSalida: horaSalida,
        descripcion: descripcion
      });

      // Actualizar horas del grupo si es necesario
      if (horaEntrada && (!currentGroup.horaEntradaInicial || horaEntrada < currentGroup.horaEntradaInicial)) {
        currentGroup.horaEntradaInicial = horaEntrada;
      }
      if (horaSalida && (!currentGroup.horaSalidaFinal || horaSalida > currentGroup.horaSalidaFinal)) {
        currentGroup.horaSalidaFinal = horaSalida;
      }
    }
  }

  // Agregar el último grupo si existe
  if (currentGroup) {
    result.push(currentGroup);
  }

  // Guardar el JSON
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
  
  console.log(`✅ CSV convertido a JSON exitosamente`);
  console.log(`   - Total de grupos: ${result.length}`);
  console.log(`   - Total de eventos: ${result.reduce((sum, group) => sum + group.eventos.length, 0)}`);
  console.log(`📄 Archivo guardado en: ${outputPath}`);
}

// Convertir todos los archivos CSV
const filesToConvert = [
  'CAMARONERAS.csv',
  'HIELERAS.csv',
  'MANFRISCO.csv',
  'PROHIBICIONES.csv',
  'GEOREFERENCIAL.csv',
  'GABARRAS.csv'
];

const csvDir = path.join(__dirname, 'files', 'csv');
const jsonDir = path.join(__dirname, 'files', 'json');

filesToConvert.forEach(fileName => {
  const csvPath = path.join(csvDir, fileName);
  const jsonFileName = fileName.replace('.csv', '.json');
  const jsonPath = path.join(jsonDir, jsonFileName);
  
  if (fs.existsSync(csvPath)) {
    console.log(`\n📄 Procesando: ${fileName}`);
    convertCSVToJSON(csvPath, jsonPath);
  } else {
    console.log(`\n⚠️  Archivo no encontrado: ${csvPath}`);
  }
});

