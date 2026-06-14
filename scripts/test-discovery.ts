import 'dotenv/config';
import { discoverLeads } from '../agents/leadDiscovery';

async function test() {
  console.log('[TEST] Iniciando Lead Discovery completo...');
  try {
    const leads = await discoverLeads('agencia de viajes', 5);
    console.log('[TEST] Leads resultantes:', JSON.stringify(leads, null, 2));
  } catch (error) {
    console.error('[TEST] Error en Discovery:', error);
  }
}

test();
