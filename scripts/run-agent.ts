import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno (.env.local tiene prioridad sobre .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import { runAgentWorkflow } from '../agents/workflow';
import { logger } from '../lib/logger';

// Cargar variables de entorno y ejecutar el workflow
(async () => {
  logger.info('Iniciando ejecución manual del agente de marketing...');
  await runAgentWorkflow();
  process.exit(0);
})().catch(err => {
  logger.error('Falla catastrófica en la ejecución manual:', err);
  process.exit(1);
});
