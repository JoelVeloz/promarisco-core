const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuración
const CONFIG = {
  baseUrl: 'http://localhost:4000',
  chunkSize: parseInt(process.env.CHUNK_SIZE || '50', 10), // Eventos por chunk
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT || '50', 10), // Chunks concurrentes
  maxRetries: 2, // Intentos por evento
  checkpointFile: path.join(__dirname, 'files', 'webhook-checkpoint.json'),
  generalTextFile: path.join(__dirname, 'files', 'general_text.json'),
};

/**
 * Realiza una petición HTTP
 */
function makeRequest(url, options, data) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const client = isHttps ? https : http;

    const timeout = 30000; // 30 segundos de timeout

    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      timeout: timeout,
    };

    const req = client.request(requestOptions, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : null });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error(`Request timeout after ${timeout}ms`));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

/**
 * Envía un evento al webhook
 */
async function sendWebhookEvent(eventType, payload, retryCount = 0) {
  const url = `${CONFIG.baseUrl}/webhooks/on-track/${encodeURIComponent(eventType)}`;

  try {
    await makeRequest(url, { method: 'POST' }, payload);
    return { success: true };
  } catch (error) {
    if (retryCount < CONFIG.maxRetries) {
      // Esperar un poco antes de reintentar
      await new Promise((resolve) => setTimeout(resolve, 1000 * (retryCount + 1)));
      return sendWebhookEvent(eventType, payload, retryCount + 1);
    }
    return { success: false, error: error.message };
  }
}

/**
 * Carga el checkpoint
 */
function loadCheckpoint() {
  if (!fs.existsSync(CONFIG.checkpointFile)) {
    return {
      processedIndices: [],
      processedEvents: [],
      errors: [],
      startTime: new Date().toISOString(),
    };
  }

  try {
    const content = fs.readFileSync(CONFIG.checkpointFile, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error cargando checkpoint, iniciando desde cero:', error.message);
    return {
      processedIndices: [],
      processedEvents: [],
      errors: [],
      startTime: new Date().toISOString(),
    };
  }
}

/**
 * Guarda el checkpoint
 */
function saveCheckpoint(checkpoint) {
  try {
    checkpoint.lastUpdate = new Date().toISOString();
    fs.writeFileSync(CONFIG.checkpointFile, JSON.stringify(checkpoint, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error guardando checkpoint:', error.message);
  }
}

/**
 * Procesa un evento (2 inserciones: entrada y salida)
 */
async function processEvent(evento, index) {
  const results = {
    index,
    entrada: null,
    salida: null,
    errors: [],
  };

  // Procesar entrada
  if (evento.entróTexto) {
    try {
      const entradaPayload = { [evento.entróTexto]: true };
      results.entrada = await sendWebhookEvent('ENTRADA_GEOCERCA', entradaPayload);
      if (!results.entrada.success) {
        results.errors.push(`Entrada: ${results.entrada.error || 'Error desconocido'}`);
      }
    } catch (error) {
      results.entrada = { success: false, error: error.message };
      results.errors.push(`Entrada: ${error.message}`);
    }
  } else {
    results.errors.push('Entrada: No hay texto de entrada disponible');
  }

  // Procesar salida
  if (evento.salióTexto) {
    try {
      const salidaPayload = { [evento.salióTexto]: true };
      results.salida = await sendWebhookEvent('SALIDA_GEOCERCA', salidaPayload);
      if (!results.salida.success) {
        results.errors.push(`Salida: ${results.salida.error || 'Error desconocido'}`);
      }
    } catch (error) {
      results.salida = { success: false, error: error.message };
      results.errors.push(`Salida: ${error.message}`);
    }
  } else {
    results.errors.push('Salida: No hay texto de salida disponible');
  }

  return results;
}

/**
 * Procesa un chunk de eventos
 */
async function processChunk(chunk, checkpoint) {
  const results = [];

  for (const { evento, index } of chunk) {
    // Verificar si ya fue procesado
    if (checkpoint.processedIndices.includes(index)) {
      continue;
    }

    try {
      const result = await processEvent(evento, index);
      results.push(result);

      // Verificar si hubo errores
      const hasErrors = result.errors && result.errors.length > 0;
      const entradaOk = result.entrada?.success === true;
      const salidaOk = result.salida?.success === true;

      // Solo marcar como procesado si al menos una inserción fue exitosa
      if (entradaOk || salidaOk) {
        checkpoint.processedIndices.push(index);
        checkpoint.processedEvents.push({
          index,
          agrupacion: evento.agrupacion,
          unidad: evento.unidad,
          geocerca: evento.geocerca,
          entradaOk,
          salidaOk,
          timestamp: new Date().toISOString(),
        });
      }

      // Registrar errores si los hay
      if (hasErrors) {
        checkpoint.errors.push({
          index,
          errors: result.errors,
          entradaOk,
          salidaOk,
          timestamp: new Date().toISOString(),
        });
      }

      // Mostrar progreso cada evento
      const processed = checkpoint.processedIndices.length;
      if (processed % 5 === 0 || hasErrors) {
        const status = entradaOk && salidaOk ? '✅' : entradaOk || salidaOk ? '⚠️' : '❌';
        console.log(`   ${status} Evento ${index + 1}/${chunk.length + checkpoint.processedIndices.length} | Entrada: ${entradaOk ? 'OK' : 'FAIL'} | Salida: ${salidaOk ? 'OK' : 'FAIL'}`);
        if (hasErrors) {
          console.log(`      Errores: ${result.errors.join(', ')}`);
        }
      }

      // Guardar checkpoint cada 10 eventos procesados
      if (checkpoint.processedIndices.length % 10 === 0) {
        saveCheckpoint(checkpoint);
      }
    } catch (error) {
      checkpoint.errors.push({
        index,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
      results.push({ index, error: error.message });
      console.log(`   ❌ Error procesando evento ${index + 1}: ${error.message}`);
    }
  }

  return results;
}

/**
 * Función principal
 */
async function main() {
  console.log('🚀 Iniciando proceso de inserción de eventos al webhook\n');
  console.log(`📋 Configuración:`);
  console.log(`   - URL Base: ${CONFIG.baseUrl}`);
  console.log(`   - Tamaño de chunk: ${CONFIG.chunkSize}`);
  console.log(`   - Chunks concurrentes: ${CONFIG.maxConcurrent}`);
  console.log(`   - Reintentos: ${CONFIG.maxRetries}`);
  console.log(`   - Archivo checkpoint: ${CONFIG.checkpointFile}\n`);

  // Cargar datos
  if (!fs.existsSync(CONFIG.generalTextFile)) {
    console.error(`❌ Archivo no encontrado: ${CONFIG.generalTextFile}`);
    process.exit(1);
  }

  console.log(`📄 Leyendo archivo: ${CONFIG.generalTextFile}`);
  const eventos = JSON.parse(fs.readFileSync(CONFIG.generalTextFile, 'utf-8'));

  if (!Array.isArray(eventos)) {
    console.error('❌ El archivo JSON no contiene un array válido');
    process.exit(1);
  }

  const totalEventos = eventos.length;
  // Verificar cuántos eventos tienen entrada y salida
  const eventosConEntrada = eventos.filter((e) => e.entróTexto).length;
  const eventosConSalida = eventos.filter((e) => e.salióTexto).length;
  const totalInserciones = eventosConEntrada + eventosConSalida; // Total real de inserciones a intentar

  console.log(`📊 Estadísticas del archivo:`);
  console.log(`   - Total de eventos en JSON: ${totalEventos}`);
  console.log(`   - Eventos con entrada: ${eventosConEntrada}`);
  console.log(`   - Eventos con salida: ${eventosConSalida}`);
  console.log(`   - Total de inserciones a intentar: ${totalInserciones} (${eventosConEntrada} entradas + ${eventosConSalida} salidas)\n`);

  // Cargar checkpoint
  const checkpoint = loadCheckpoint();
  const processedCount = checkpoint.processedIndices.length;
  const remainingCount = eventos.length - processedCount;

  console.log(`📌 Checkpoint cargado:`);
  console.log(`   - Eventos ya procesados: ${processedCount}`);
  console.log(`   - Eventos faltantes: ${remainingCount}`);
  console.log(`   - Errores anteriores: ${checkpoint.errors.length}\n`);

  if (remainingCount === 0) {
    console.log('✅ Todos los eventos ya han sido procesados');
    return;
  }

  // Filtrar eventos no procesados
  const eventosPendientes = eventos.map((evento, index) => ({ evento, index })).filter(({ index }) => !checkpoint.processedIndices.includes(index));

  console.log(`🔄 Procesando ${eventosPendientes.length} eventos pendientes...\n`);

  // Dividir en chunks
  const chunks = [];
  for (let i = 0; i < eventosPendientes.length; i += CONFIG.chunkSize) {
    chunks.push(eventosPendientes.slice(i, i + CONFIG.chunkSize));
  }

  console.log(`📦 Total de chunks: ${chunks.length}\n`);

  let totalProcessed = 0;
  let totalErrors = 0;
  const startTime = Date.now();

  // Procesar chunks en paralelo
  for (let i = 0; i < chunks.length; i += CONFIG.maxConcurrent) {
    const batch = chunks.slice(i, i + CONFIG.maxConcurrent);
    const batchNumber = Math.floor(i / CONFIG.maxConcurrent) + 1;
    const totalBatches = Math.ceil(chunks.length / CONFIG.maxConcurrent);

    console.log(`\n🔄 Procesando batch ${batchNumber}/${totalBatches} (${batch.length} chunks)...`);

    const batchPromises = batch.map((chunk) => processChunk(chunk, checkpoint));

    const batchResults = await Promise.all(batchPromises);

    // Contar resultados
    batchResults.forEach((results) => {
      results.forEach((result) => {
        if (result.error) {
          totalErrors++;
        } else {
          // Contar inserciones exitosas (entrada y salida son 2 inserciones por evento)
          // Nota: Se intentan 2 inserciones por evento, pero solo se cuentan las exitosas
          if (result.entrada?.success) totalProcessed++;
          if (result.salida?.success) totalProcessed++;
          // Contar intentos fallidos como errores
          if (result.entrada && !result.entrada.success) totalErrors++;
          if (result.salida && !result.salida.success) totalErrors++;
        }
      });
    });

    // Guardar checkpoint después de cada batch
    saveCheckpoint(checkpoint);

    const processed = checkpoint.processedIndices.length;
    const remaining = eventos.length - processed;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    const rate = processed > 0 ? (processed / (elapsed / 60)).toFixed(2) : 0;

    console.log(
      `✅ Batch ${batchNumber}/${totalBatches} completado | ` +
        `📊 Progreso: ${processed}/${eventos.length} eventos (${((processed / eventos.length) * 100).toFixed(1)}%) | ` +
        `Faltantes: ${remaining} | ` +
        `Tiempo: ${elapsed}s | ` +
        `Velocidad: ${rate} eventos/min`,
    );
  }

  // Guardar checkpoint final
  saveCheckpoint(checkpoint);

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const finalProcessed = checkpoint.processedIndices.length;
  const finalRemaining = eventos.length - finalProcessed;
  const totalInsercionesExitosas = totalProcessed; // Total de inserciones exitosas (entrada + salida)
  const eventosCompletos = checkpoint.processedEvents.filter((e) => e.entradaOk && e.salidaOk).length;

  console.log(`\n✅ Proceso completado`);
  console.log(`   - Eventos procesados: ${finalProcessed}/${eventos.length}`);
  console.log(`   - Eventos completos (entrada + salida): ${eventosCompletos}`);
  console.log(`   - Inserciones exitosas: ${totalInsercionesExitosas}/${totalInserciones} (${((totalInsercionesExitosas / totalInserciones) * 100).toFixed(1)}%)`);
  console.log(`   - Eventos faltantes: ${finalRemaining}`);
  console.log(`   - Errores: ${checkpoint.errors.length}`);
  console.log(`   - Tiempo total: ${totalTime}s`);
  console.log(`   - Checkpoint guardado en: ${CONFIG.checkpointFile}`);

  if (checkpoint.errors.length > 0) {
    console.log(`\n⚠️  Errores encontrados (primeros 10):`);
    checkpoint.errors.slice(0, 10).forEach((err) => {
      console.log(`   - Índice ${err.index}: ${err.error}`);
    });
  }
}

// Ejecutar
main().catch((error) => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
