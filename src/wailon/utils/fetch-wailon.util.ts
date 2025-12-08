/**
 * Función utilitaria para hacer peticiones a la API de Wialon
 */
export async function fetchWailon(svc: string, params: Record<string, unknown>, eid: string, host: string = 'hst-api.wialon.eu'): Promise<unknown> {
  const url = `https://${host}/wialon/ajax.html`;
  const body = new URLSearchParams({
    svc,
    params: JSON.stringify(params),
    sid: eid,
  });

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Error en petición a Wialon: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();

  // Wialon retorna errores en el campo "error"
  if (result.error) {
    throw new Error(`Error de Wialon: ${JSON.stringify(result)}`);
  }

  return result;
}
