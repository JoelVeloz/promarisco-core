const fs = require('fs');
const path = require('path');

// Función para aplanar un JSON agrupado
function flattenJSON(jsonData, sourceName) {
  const flattened = [];
  
  for (const group of jsonData) {
    const agrupacion = group.agrupacion;
    
    // Aplanar cada evento añadiendo el campo agrupacion
    for (const evento of group.eventos) {
      flattened.push({
        agrupacion: agrupacion,
        horaEntrada: evento.horaEntrada,
        unidad: evento.unidad,
        geocerca: evento.geocerca,
        horaSalida: evento.horaSalida,
        descripcion: evento.descripcion,
        fuente: sourceName // Añadir el nombre del archivo fuente
      });
    }
  }
  
  return flattened;
}

// Función principal
function flattenAndMerge() {
  const oldDataDir = path.join(__dirname, 'files', 'old-data');
  const outputDir = path.join(__dirname, 'files');
  
  // Archivos a procesar
  const filesToProcess = [
    { jsonFile: 'CAMARONERAS.json', sourceName: 'CAMARONERAS' },
    { jsonFile: 'HIELERAS.json', sourceName: 'HIELERAS' },
    { jsonFile: 'MANFRISCO.json', sourceName: 'MANFRISCO' },
    { jsonFile: 'PROHIBICIONES.json', sourceName: 'PROHIBICIONES' }
  ];
  
  const allEvents = [];
  
  // Procesar cada archivo JSON
  filesToProcess.forEach(({ jsonFile, sourceName }) => {
    const jsonPath = path.join(oldDataDir, jsonFile);
    
    if (!fs.existsSync(jsonPath)) {
      console.log(`⚠️  Archivo no encontrado: ${jsonFile}`);
      return;
    }
    
    console.log(`\n📄 Procesando: ${jsonFile}`);
    
    try {
      const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
      const jsonData = JSON.parse(jsonContent);
      
      // Aplanar el JSON
      const flattened = flattenJSON(jsonData, sourceName);
      
      // Guardar el JSON aplanado individual
      const flattenedPath = path.join(oldDataDir, jsonFile.replace('.json', '-flat.json'));
      fs.writeFileSync(flattenedPath, JSON.stringify(flattened, null, 2), 'utf-8');
      
      console.log(`   ✅ Aplanado: ${flattened.length} eventos`);
      
      // Agregar al array lal
      allEvents.push(...flattened);
      
    } catch (error) {
      console.error(`   ❌ Error procesando ${jsonFile}:`, error.message);
    }
  });
  
  // Guardar el archivo alal.json
  const generalPath = path.join(outputDir, 'general.json');
  fs.writeFileSync(generalPath, JSON.stringify(allEvents, null, 2), 'utf-8');
  
  console.log(`\n✅ Proceso completado`);
  console.log(`   - Total de eventos en general.json: ${allEvents.length}`);
  console.log(`📄 Archivo general.json guardado en: ${generalPath}`);
  
  // Mostrar estadísticas por fuente
  const stats = {};
  allEvents.forEach(event => {
    const fuente = event.fuente;
    stats[fuente] = (stats[fuente] || 0) + 1;
  });
  
  console.log(`\n📊 Estadísticas por fuente:`);
  Object.entries(stats).forEach(([fuente, count]) => {
    console.log(`   - ${fuente}: ${count} eventos`);
  });
}

// Ejecutar
flattenAndMerge();



