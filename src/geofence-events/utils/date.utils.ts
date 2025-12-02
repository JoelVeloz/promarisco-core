// eslint-disable-next-line @typescript-eslint/no-require-imports
const dayjs = require('dayjs');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const customParseFormat = require('dayjs/plugin/customParseFormat');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const utc = require('dayjs/plugin/utc');

dayjs.extend(customParseFormat);
dayjs.extend(utc);

/**
 * Convierte una fecha en formato DD.MM.YYYY HH:mm:ss a UTC ISO string
 */
export function convertToUTC(dateString: string): string | undefined {
  try {
    // Formato: "02.12.2025 08:15:07"
    const parsedDate = dayjs(dateString, 'DD.MM.YYYY HH:mm:ss', true);

    if (!parsedDate.isValid()) {
      return undefined;
    }

    // Retornar en formato UTC ISO
    return parsedDate.utc().toISOString();
  } catch (error) {
    return undefined;
  }
}
