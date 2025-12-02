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
  const fullPattern = /^(.+?)\s+(?:entró en|salió de)\s+(.+?)\s+el\s+(.+?)\s+con una velocidad de\s+(.+?)\s+cerca de\s+'(.+?)'\.?$/;
  const fullMatch = payloadKey.match(fullPattern);

  if (fullMatch) {
    const posTime = fullMatch[3]?.trim();
    const posTimeUTC = posTime ? convertToUTC(posTime) : undefined;

    return {
      UNIT: fullMatch[1]?.trim(),
      ZONE: fullMatch[2]?.trim(),
      POS_TIME: posTime,
      POS_TIME_UTC: posTimeUTC,
      SPEED: fullMatch[4]?.trim(),
      LOCATION: fullMatch[5]?.trim(),
    };
  }

  // Regex para formato de parada no autorizada (sin ZONE ni SPEED)
  const stopPattern = /^ATENCION!\s+(.+?)\s+realizó una parada no autorizada el\s+(.+?)\s+cerca de\s+'(.+?)'\.?$/;
  const stopMatch = payloadKey.match(stopPattern);

  if (stopMatch) {
    const posTime = stopMatch[2]?.trim();
    const posTimeUTC = posTime ? convertToUTC(posTime) : undefined;

    return {
      UNIT: stopMatch[1]?.trim(),
      POS_TIME: posTime,
      POS_TIME_UTC: posTimeUTC,
      LOCATION: stopMatch[3]?.trim(),
    };
  }

  return {};
}
