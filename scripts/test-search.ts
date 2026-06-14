import 'dotenv/config';
import { searchWeb } from '../lib/search';

async function test() {
  const query = 'empresas de desarrollo de software Argentina';
  console.log(`[TEST] Buscando: "${query}"`);
  console.log(`[TEST] SEARCH_API_KEY configurada: ${process.env.SEARCH_API_KEY ? 'Sí' : 'No'}`);
  
  try {
    const results = await searchWeb(query, 5);
    console.log('[TEST] Resultados de la búsqueda:');
    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error('[TEST] Falla en la búsqueda:', error);
  }
}

test();
