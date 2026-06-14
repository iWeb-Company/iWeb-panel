import { NextResponse } from 'next/server';
import { runAgentWorkflow } from '../../../agents/workflow';
import { logger } from '../../../lib/logger';

// Cierre de exclusión mutua para evitar múltiples ejecuciones concurrentes
let isRunning = false;

export async function POST(request: Request) {
  if (isRunning) {
    return NextResponse.json(
      { error: 'El agente ya se encuentra ejecutando una búsqueda.' },
      { status: 409 }
    );
  }

  let manualCategory: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.category === 'string' && body.category.trim() !== '') {
      manualCategory = body.category.trim();
    }
  } catch (e) {
    // Ignorar si no hay cuerpo JSON o es inválido
  }

  isRunning = true;
  if (manualCategory) {
    logger.info(`[API] Ejecución manual del agente solicitada para la categoría: "${manualCategory}".`);
  } else {
    logger.info('[API] Ejecución manual del agente solicitada desde el Dashboard (rotación automática).');
  }

  // Iniciar la ejecución en segundo plano de manera asíncrona
  runAgentWorkflow(manualCategory)
    .catch((error) => {
      logger.error('[API] Error crítico en ejecución asíncrona iniciada por API:', error);
    })
    .finally(() => {
      isRunning = false;
      logger.info('[API] Estado del agente restablecido a "Inactivo".');
    });

  return NextResponse.json({ 
    status: 'started',
    message: manualCategory
      ? `El agente ha comenzado la búsqueda para "${manualCategory}" en segundo plano.`
      : 'El agente ha comenzado la búsqueda en segundo plano.'
  });
}

export async function GET() {
  return NextResponse.json({ isRunning });
}
