#!/bin/sh

echo "========================================================================"
echo "iWEB Marketing Agent - Starting Services..."
echo "========================================================================"

# Asegurar que los directorios de persistencia existen
mkdir -p /app/leads /app/reports /app/logs

# Iniciar el servidor Next.js en segundo plano
echo "Starting Next.js Server on port 3000..."
pnpm start &

# Iniciar el planificador cron de TypeScript en primer plano
# Esto mantiene el contenedor corriendo y registra las ejecuciones del agente.
echo "Starting Cron Scheduler..."
npx tsx scripts/cron.ts
