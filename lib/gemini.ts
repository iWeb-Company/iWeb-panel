/**
 * iWEB Marketing Agent - Gemini REST API Wrapper with Rate Limit Retries
 */

/**
 * Realiza una petición fetch a la API de Gemini con manejo de reintentos
 * automático si se recibe un código de estado 429 (Límite de Cuota Excedido).
 */
async function fetchGeminiWithRetry(
  url: string,
  options: any,
  retries: number = 3,
  baseDelayMs: number = 5000
): Promise<Response> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const response = await fetch(url, options);
    
    if (response.status === 429) {
      console.warn(`[Gemini] Cuota excedida (429). Reintento ${attempt} de ${retries} en ${baseDelayMs / 1000} segundos...`);
      await new Promise(resolve => setTimeout(resolve, baseDelayMs * attempt)); // Exponencial básico
      continue;
    }
    
    return response;
  }
  
  // Último intento de respaldo si los reintentos de cuota se agotaron
  return fetch(url, options);
}

/**
 * Llama a Google Gemini vía REST y asegura que la respuesta sea un JSON válido.
 */
export async function callGeminiJSON<T = any>(prompt: string): Promise<T> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.');
  }

  const modelName = process.env.AI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetchGeminiWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`La API de Gemini retornó un error HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error('La respuesta de Gemini fue vacía.');
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    // Si contiene markdown o bloques de código, limpiar el JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (innerError) {
        throw new Error(`Error al parsear el JSON extraído: ${text}`);
      }
    }
    throw new Error(`La respuesta no es un JSON válido: ${text}`);
  }
}

/**
 * Llama a Google Gemini para obtener texto plano (ej: reportes en Markdown).
 */
export async function callGeminiText(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('La variable de entorno GEMINI_API_KEY no está configurada.');
  }

  const modelName = process.env.AI_MODEL || 'gemini-flash-latest';
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const response = await fetchGeminiWithRetry(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`La API de Gemini retornó un error HTTP ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
