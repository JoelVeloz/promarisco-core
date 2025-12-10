import * as fs from 'fs';
import * as path from 'path';

const geocercasJsonPath = './src/common/geocercas.json';
const geocercasData = JSON.parse(fs.readFileSync(geocercasJsonPath, 'utf-8'));

export const GEOCERCAS_POR_ZONA: Record<string, string[]> = geocercasData as Record<string, string[]>;

const uniqueData = new Set();

export function obtenerZonaPorGeocerca(nombreGeocerca: string): string | null {
  const nombreNormalizado = nombreGeocerca;

  for (const [zona, geocercas] of Object.entries(GEOCERCAS_POR_ZONA)) {
    if (geocercas.some(g => g.toUpperCase() === nombreNormalizado)) {
      return zona;
    }
  }

  // console.log(nombreNormalizado);
  uniqueData.add(nombreNormalizado);

  console.log(uniqueData);

  return 'SIN GRUPO';
}

// por organizar
// {
//   'PUENTE UNIDAD NACIONAL IDA',
//   'Autopista-Narcisa-de-Jesús',
//   'KM-10-VIA-SAMBORONDON',
//   'PUENTE-UNIDAD-NACIONAL-RETORNO',
//   'M22',
//   'M34',
//   '37',
//   'M23',
//   'M21',
//   'M20',
//   '19',
//   'INGRESO-VIA-SALITRE',
//   'M1',
//   'JARDINES DEL SALADO',
//   'M12',
//   'M10',
//   '13',
//   '14',
//   'M11',
//   'INGRESO-A-DURAN-CITY-P',
//   'M15',
//   '25',
//   'M31',
//   '3',
//   '4',
//   '5',
//   'INGRESO-ORELLANA',
//   'Entrada-la-8',
//   'M16',
//   'M24',
//   'Av-Carlos-Julio-Arosemena',
//   'M38',
//   '1',
//   '6',
//   'M37',
//   'M44',
//   'M18',
//   '2',
//   '11',
//   'M25',
//   'M29',
//   '27',
//   '26',
//   '28',
//   '12',
//   '38',
//   'M9',
//   'M45',
//   'M46',
//   'M13',
//   'M32',
//   'M48',
//   'M47',
//   '40',
//   'PUERTO-INCA-LA-TRONCAL',
//   'M43',
//   'M30',
//   '20',
//   '22'
// }
