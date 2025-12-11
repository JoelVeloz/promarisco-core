import { DateTime } from 'luxon';

/**
 * Convierte una fecha en formato DD.MM.YYYY HH:mm:ss (hora de Ecuador) a UTC Date
 * Ecuador está en UTC-5 (America/Guayaquil)
 */
export function convertToUTC(dateString: string): Date | undefined {
  try {
    const parsedDate = DateTime.fromFormat(dateString, 'dd.MM.yyyy HH:mm:ss', {
      zone: 'America/Guayaquil',
    });

    if (!parsedDate.isValid) {
      return undefined;
    }

    return parsedDate.toUTC().toJSDate();
  } catch (error) {
    return undefined;
  }
}


