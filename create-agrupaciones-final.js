const fs = require('fs');
const path = require('path');

/**
 * Crea el archivo agrupaciones_final.json agrupando fuentes únicas con sus geocercas únicas
 */
function createAgrupacionesFinal() {
  const inputPath = path.join(__dirname, 'files', 'general.json');
  const outputPath = path.join(__dirname, 'files', 'agrupaciones_final.json');

  if (!fs.existsSync(inputPath)) {
    console.error(`❌ Archivo no encontrado: ${inputPath}`);
    return;
  }

  console.log(`📄 Leyendo archivo: ${inputPath}`);

  try {
    const eventos = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

    if (!Array.isArray(eventos)) {
      console.error('❌ El archivo JSON no contiene un array válido');
      return;
    }

    console.log(`📊 Procesando ${eventos.length} eventos...`);

    // Agrupar por fuente y recopilar geocercas únicas
    const fuentes = {};

    eventos.forEach((evento) => {
      const fuente = evento.fuente || 'SIN_FUENTE';
      const geocerca = evento.geocerca || 'SIN_GEOCERCA';

      if (!fuentes[fuente]) {
        fuentes[fuente] = new Set();
      }

      fuentes[fuente].add(geocerca);
    });

    // Convertir a array con geocercas ordenadas
    const resultado = Object.keys(fuentes)
      .sort()
      .map((fuente) => ({
        fuente,
        geocercas: Array.from(fuentes[fuente]).sort(),
      }));

    // Guardar el archivo
    fs.writeFileSync(outputPath, JSON.stringify(resultado, null, 2), 'utf-8');

    console.log(`\n✅ Archivo creado: ${outputPath}`);
    console.log(`📊 Estadísticas:`);
    console.log(`   - Total de fuentes: ${resultado.length}`);
    console.log(`   - Total de geocercas únicas: ${new Set(eventos.map((e) => e.geocerca)).size}`);

    resultado.forEach((f) => {
      console.log(`   - ${f.fuente}: ${f.geocercas.length} geocercas`);
    });
  } catch (error) {
    console.error(`❌ Error procesando el archivo:`, error.message);
    console.error(error);
  }
}

// Ejecutar
createAgrupacionesFinal();

