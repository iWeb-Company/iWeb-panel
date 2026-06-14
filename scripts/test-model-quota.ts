import 'dotenv/config';

async function testModel(modelName: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[TEST] No GEMINI_API_KEY found in .env');
    return;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
  console.log(`[TEST] Probando modelo: ${modelName}...`);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: 'Di "hola"' }]
        }]
      })
    });

    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log(`[TEST] ¡Éxito! Respuesta de ${modelName}: "${text}"`);
      return true;
    } else {
      const errorText = await res.text();
      console.error(`[TEST] Error con ${modelName} (HTTP ${res.status}):`);
      console.error(errorText);
      return false;
    }
  } catch (error: any) {
    console.error(`[TEST] Error de red probando ${modelName}:`, error.message);
    return false;
  }
}

async function run() {
  const modelsToTest = [
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-pro-latest',
  ];

  for (const model of modelsToTest) {
    await testModel(model);
    console.log('--------------------------------------------------');
  }
}

run();
