import * as fs from 'fs';
import * as path from 'path';

// const geocercasJsonPath = './src/common/geocercas.json';
const geocercasData = {
  CAMARONERAS: [
    'ACUICOLA-CARRIZAL',
    'ALGARROBOCORP',
    'BELLITEC',
    'CAMAJOSE',
    'COPACKING-COMUMAP',
    'COPACKING-PRORIOSA',
    'CORP-COSTANERA',
    'CORPLANEC',
    'CRISTALMAR',
    'DARSACOM',
    'ENGUNGAMAR',
    'FERASA',
    'FIMASA 3',
    'FINCAS-MARINAS',
    'GREENTRAILCORP',
    'HARAUTE-S.A.',
    'IPYCA',
    'ISLA-BELLAVISTA',
    'ISLA-ESCALANTE',
    'ISLA-QUIÑONEZ',
    'ISLA-SANTA-CECILIA',
    'JESUS-DEL-GRAN-PODER',
    'JOPISA',
    'LIMBOMAR',
    'LIMBOMAR-CHURUTE',
    'LINGLE-S.A',
    'LIVELIBERTY',
    'LUKMAR',
    'MARFRISCO',
    'PANTRUSKO-2',
    'PANTRUSKO-S.A.',
    'PISCICOLA-MALECON',
    'PRODUMAR',
    'PRODUMAR-DURAN',
    'RECORCHOLIS-1',
    'RECORCHOLIS-2',
    'ROLESA-1',
    'ROLESA-2',
  ],
  HIELERAS: ['HIELERA-ECUAHIELO', 'HIELERA-FLAKES-ICE', 'HIELERA-FRIGOLOGISTICA', 'HIELERA-FRIO-PACIFICO', 'HIELERA-LOG-ECUATORIANA', 'HIELERA-OCEANICE', 'HIELERA-REFRISTORE'],
  PISCINAS_MARFRISCO: ['24'],
  PISCINAS: ['24', '29', 'M2', 'M3', 'M4', 'M5', 'M6', 'M7', 'M8', 'M17', 'M19', 'M26', 'M27', 'M33', 'M35', 'M39', 'M40', 'M41', 'M42'],
  PROHIBICIONES: ['INGRESO-AL-CENTRO', 'PEAJE-YAGUACHI', 'PEDRO-J-MONTERO', 'VIRGEN-DE-FATIMA-P2'],
};

export const GEOCERCAS_POR_ZONA: Record<string, string[]> = geocercasData as Record<string, string[]>;

const uniqueData = new Set();

export function obtenerZonaPorGeocerca(nombreGeocerca: string): string | null {
  const nombreNormalizado = nombreGeocerca;

  for (const [zona, geocercas] of Object.entries(GEOCERCAS_POR_ZONA)) {
    if (geocercas.some(g => g.toUpperCase() === nombreNormalizado)) {
      return zona;
    }
  }
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
