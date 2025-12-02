import { DateTime } from 'luxon';

/**
 * Convierte una fecha en formato DD.MM.YYYY HH:mm:ss a UTC ISO string
 */
export function convertToUTC(dateString: string): string | undefined {
  try {
    // Formato: "02.12.2025 08:15:07"
    const parsedDate = DateTime.fromFormat(dateString, 'dd.MM.yyyy HH:mm:ss', { zone: 'utc' });

    if (!parsedDate.isValid) {
      return undefined;
    }

    // Retornar en formato UTC ISO
    return parsedDate.toISO();
  } catch (error) {
    return undefined;
  }
}
