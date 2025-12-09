import * as fs from 'fs';
import * as path from 'path';

const geocercasJsonPath = './src/common/geocercas.json';
console.log(path.resolve(geocercasJsonPath));
const geocercasData = JSON.parse(fs.readFileSync(geocercasJsonPath, 'utf-8'));

export const GEOCERCAS_POR_ZONA: Record<string, string[]> = geocercasData as Record<string, string[]>;

export function obtenerZonaPorGeocerca(nombreGeocerca: string): string | null {
  const nombreNormalizado = nombreGeocerca.trim().toUpperCase();

  for (const [zona, geocercas] of Object.entries(GEOCERCAS_POR_ZONA)) {
    if (geocercas.some(g => g.toUpperCase() === nombreNormalizado)) {
      return zona;
    }
  }

  return null;
}
