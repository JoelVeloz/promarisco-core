const fs = require('fs');
const path = require('path');

/**
 * Genera el texto de entrada según el formato:
 * "%UNIT% entró en %ZONE% el %POS_TIME% con una velocidad de %SPEED% cerca de '%LOCATION%'. %FUENTE%"
 */
function generarEntroTexto(evento) {
  if (!evento.horaEntrada) {
    return null;
  }

  const unit = evento.unidad || 'N/A';
  const zone = evento.geocerca || 'N/A';
  const posTime = evento.horaEntrada;
  const speed = '0 km/h'; // Valor por defecto ya que no tenemos velocidad en los datos originales
  const location = evento.descripcion || 'N/A';
  const fuente = evento.fuente || '';

  const textoBase = `${unit} entró en ${zone} el ${posTime} con una velocidad de ${speed} cerca de '${location}'.`;
  return fuente ? `${textoBase} ${fuente}` : textoBase;
}

/**
 * Genera el texto de salida según el formato:
 * "%UNIT% salió de %ZONE% el %POS_TIME% con una velocidad de %SPEED% cerca de '%LOCATION%'. %FUENTE%"
 */
function generarSalioTexto(evento) {
  if (!evento.horaSalida) {
    return null;
  }

  const unit = evento.unidad || 'N/A';
  const zone = evento.geocerca || 'N/A';
  const posTime = evento.horaSalida;
  const speed = '0 km/h'; // Valor por defecto ya que no tenemos velocidad en los datos originales
  const location = evento.descripcion || 'N/A';
  const fuente = evento.fuente || '';

  const textoBase = `${unit} salió de ${zone} el ${posTime} con una velocidad de ${speed} cerca de '${location}'.`;
  return fuente ? `${textoBase} ${fuente}` : textoBase;
}

/**
 * Procesa el archivo general.json y añade los campos entróTexto y salióTexto
 */
function addTextFields() {
  const generalPath = path.join(__dirname, 'files', 'general.json');
  const outputPath = path.join(__dirname, 'files', 'general_text.json');

  if (!fs.existsSync(generalPath)) {
    console.error(`❌ Archivo no encontrado: ${generalPath}`);
    return;
  }

  console.log(`📄 Leyendo archivo: ${generalPath}`);

  try {
    const jsonContent = fs.readFileSync(generalPath, 'utf-8');
    const eventos = JSON.parse(jsonContent);

    if (!Array.isArray(eventos)) {
      console.error('❌ El archivo JSON no contiene un array válido');
      return;
    }

    console.log(`📊 Procesando ${eventos.length} eventos...`);

    // Procesar cada evento añadiendo los campos de texto
    const eventosConTexto = eventos.map((evento, index) => {
      const nuevoEvento = {
        ...evento,
        entróTexto: generarEntroTexto(evento),
        salióTexto: generarSalioTexto(evento),
      };

      // Mostrar progreso cada 500 eventos
      if ((index + 1) % 500 === 0) {
        console.log(`   Procesados: ${index + 1}/${eventos.length}`);
      }

      return nuevoEvento;
    });

    // Guardar el archivo con los textos añadidos
    fs.writeFileSync(outputPath, JSON.stringify(eventosConTexto, null, 2), 'utf-8');

    // Estadísticas
    const conEntroTexto = eventosConTexto.filter((e) => e.entróTexto !== null).length;
    const conSalioTexto = eventosConTexto.filter((e) => e.salióTexto !== null).length;

    console.log(`\n✅ Proceso completado`);
    console.log(`   - Total de eventos: ${eventosConTexto.length}`);
    console.log(`   - Eventos con entróTexto: ${conEntroTexto}`);
    console.log(`   - Eventos con salióTexto: ${conSalioTexto}`);
    console.log(`📄 Archivo guardado en: ${outputPath}`);
  } catch (error) {
    console.error(`❌ Error procesando el archivo:`, error.message);
    console.error(error);
  }
}

// Ejecutar
addTextFields();
