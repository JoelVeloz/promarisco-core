import * as fs from 'fs';

import { join } from 'path';

// Cache del archivo para evitar leerlo múltiples veces
let idToNameCache: { [key: string]: string } | null = null;

/**
 * Convierte un ID de unidad a su nombre correspondiente
 * @param id - ID de la unidad (string)
 * @returns Nombre de la unidad o string vacío si no se encuentra
 */
export function iToNm(id: string): string {
  try {
    // Cargar el cache si no está cargado
    if (!idToNameCache) {
      const filePath = join(process.cwd(), 'extracted-i-nm.json');
      const data = fs.readFileSync(filePath, 'utf8');
      idToNameCache = JSON.parse(data) as { [key: string]: string };
    }

    // Buscar el ID en el objeto y retornar el nombre correspondiente
    return idToNameCache[id] || '';
  } catch (error) {
    console.error(`Error leyendo extracted-i-nm.json: ${error.message}`);
    return '';
  }
}
