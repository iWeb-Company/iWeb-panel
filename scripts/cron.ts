import dotenv from 'dotenv';
import path from 'path';

// Cargar variables de entorno (.env.local tiene prioridad sobre .env)
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
import cron from 'node-cron';
import { runAgentWorkflow } from '../agents/workflow';
import { logger } from '../lib/logger';

const schedule = process.env.CRON_SCHEDULE || '0 8 * * *';

logger.info('========================================================================');
logger.info(`Iniciando demonio de automatización 24/7 para el Agente iWEB`);
logger.info(`Planificación configurada (Cron): "${schedule}"`);
logger.info('========================================================================');

// Validar que la expresión cron sea correcta
if (!cron.validate(schedule)) {
  logger.error(`Error: La expresión cron "${schedule}" no es válida. Deteniendo servicio.`);
  process.exit(1);
}

// Programar la ejecución recurrente
cron.schedule(schedule, async () => {
  logger.info(`[Cron] Se ha activado la tarea programada ("${schedule}"). Ejecutando agente...`);
  try {
    await runAgentWorkflow();
    logger.info('[Cron] Tarea programada completada. Esperando siguiente ciclo...');
  } catch (error: any) {
    logger.error('[Cron] Error al ejecutar la tarea programada:', error);
  }
});

// Mantener el proceso activo y registrar eventos de señal
process.on('SIGTERM', () => {
  logger.info('[Cron] Señal SIGTERM recibida. Cerrando planificador de tareas...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('[Cron] Señal SIGINT recibida. Cerrando planificador de tareas...');
  process.exit(0);
});
