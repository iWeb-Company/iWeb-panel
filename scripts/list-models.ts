import 'dotenv/config';

async function test() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error('[TEST] No GEMINI_API_KEY found in .env');
    return;
  }
  
  const versions = ['v1', 'v1beta'];
  
  for (const ver of versions) {
    const url = `https://generativelanguage.googleapis.com/${ver}/models?key=${apiKey}`;
    console.log(`\n========================================================================`);
    console.log(`[TEST] Consultando modelos en versión: ${ver}`);
    console.log(`========================================================================`);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        console.error(`[${ver}] Error HTTP ${res.status}: ${await res.text()}`);
        continue;
      }
      const data = await res.json();
      console.log(`[${ver}] Modelos soportados y habilitados:`);
      const models = data.models || [];
      if (models.length === 0) {
        console.log(`  (Ninguno retornado)`);
      } else {
        models.forEach((m: any) => {
          console.log(`  - ${m.name} (Soporta generateContent: ${m.supportedGenerationMethods?.includes('generateContent') ? 'Sí' : 'No'})`);
        });
      }
    } catch (e: any) {
      console.error(`[${ver}] Error de red:`, e.message);
    }
  }
}

test();
