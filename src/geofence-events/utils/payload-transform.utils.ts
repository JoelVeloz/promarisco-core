import * as fs from 'fs';

import { TransformedPayload } from '../types/geofence-event.types';
import { convertToUTC } from './date.utils';

/**
 * Transforma el payload extrayendo las variables según los formatos:
 * "%UNIT% entró en %ZONE% el %POS_TIME% con una velocidad de %SPEED% cerca de '%LOCATION%'."
 * "%UNIT% salió de %ZONE% el %POS_TIME% con una velocidad de %SPEED% cerca de '%LOCATION%'."
 * "ATENCION! %UNIT% realizó una parada no autorizada el %POS_TIME% cerca de '%LOCATION%'."
 */
export function transformPayload(payload: any): TransformedPayload {
  if (!payload || typeof payload !== 'object') {
    return {};
  }

  // Obtener la clave del objeto (el string con las variables)
  const payloadKey = Object.keys(payload)[0];
  if (!payloadKey) {
    return {};
  }

  // Regex para formato completo: "entró en" o "salió de" (con ZONE y SPEED)
  // También captura GRUPO_GEOCERCA después del punto
  const fullPattern = /^(.+?)\s+(?:entró en|salió de)\s+(.+?)\s+el\s+(.+?)\s+con una velocidad de\s+(.+?)\s+cerca de\s+'(.+?)'\.\s*(.*)$/;
  const fullMatch = payloadKey.match(fullPattern);

  if (fullMatch) {
    const posTime = fullMatch[3]?.trim();
    const posTimeUTCDate = posTime ? convertToUTC(posTime) : undefined;
    const posTimeUTC = posTimeUTCDate ? posTimeUTCDate.toISOString() : undefined;

    return {
      UNIT: fullMatch[1]?.trim(),
      ZONE: fullMatch[2]?.trim(),
      POS_TIME: posTime,
      POS_TIME_UTC: posTimeUTC,
      SPEED: fullMatch[4]?.trim(),
      LOCATION: fullMatch[5]?.trim(),
      GRUPO_GEOCERCA: getAgrupacionDeGeocerca(fullMatch[2]?.trim()),
    };
  }

  // Regex para formato de parada no autorizada (sin ZONE ni SPEED)
  const stopPattern = /^ATENCION!\s+(.+?)\s+realizó una parada no autorizada el\s+(.+?)\s+cerca de\s+'(.+?)'\.?$/;
  const stopMatch = payloadKey.match(stopPattern);

  if (stopMatch) {
    const posTime = stopMatch[2]?.trim();
    const posTimeUTCDate = posTime ? convertToUTC(posTime) : undefined;
    const posTimeUTC = posTimeUTCDate ? posTimeUTCDate.toISOString() : undefined;

    return {
      UNIT: stopMatch[1]?.trim(),
      POS_TIME: posTime,
      POS_TIME_UTC: posTimeUTC,
      LOCATION: stopMatch[3]?.trim(),
    };
  }

  return {};
}

export function getAgrupacionDeGeocerca(geocerca: string): string {
  // LEE ARCHIVO AGREGACIONES_FINALES.JSON
  const agrupacionesData = [
    {
      fuente: 'CAMARONERAS',
      geocercas: [
        'ACUICOLA-CARRIZAL',
        'ALGARROBOCORP',
        'BELLITEC',
        'COMUMAP',
        'COPACKING-PRORIOSA',
        'CORP-COSTANERA',
        'CORPLANEC',
        'CRISTALMAR',
        'DARSACOM',
        'ENGUNGAMAR',
        'FERASA',
        'FINCAS-MARINAS',
        'GREENTRAILCORP',
        'HARAUTE-S.A.',
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
        'MARFRISCO',
        'PANTRUSKO-2',
        'PISCICOLA-MALECON',
        'PRODUMAR',
        'PRODUMAR-DURAN',
        'RECORCHOLIS-1',
        'RECORCHOLIS-2',
        'ROLESA-1',
        'ROLESA-2',
      ],
    },
    {
      fuente: 'HIELERAS',
      geocercas: ['HIELERA-ECUAHIELO', 'HIELERA-FLAKES-ICE', 'HIELERA-FRIGOLOGISTICA', 'HIELERA-FRIO-PACIFICO', 'HIELERA-LOG-ECUATORIANA', 'HIELERA-OCEANICE', 'HIELERA-REFRISTORE'],
    },
    {
      fuente: 'MANFRISCO',
      geocercas: ['CAMPAMENTO MARFRISCO', 'M17', 'M19', 'M3', 'M33', 'M35', 'M39', 'M4', 'M5', 'M6', 'M7', 'MARFRISCO 2'],
    },
    {
      fuente: 'PROHIBICIONES',
      geocercas: ['INGRESO-AL-CENTRO', 'PEDRO-J-MONTERO', 'VIRGEN-DE-FATIMA-P2'],
    },
  ];
  // BUSCA LA AGRUPACION QUE CONTIENE LA GEOCERCA
  // {
  //   "fuente": "CAMARONERAS",
  //   "geocercas": [
  //     "ACUICOLA-CARRIZAL",
  //     "ALGARROBOCORP",
  //     "BELLITEC"
  //
  // ,

  const agrupacion = agrupacionesData.find((agrupacion: any) => agrupacion.geocercas.includes(geocerca));
  return agrupacion?.fuente || '';
}
