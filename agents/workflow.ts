import { discoverLeads, Lead } from './leadDiscovery';
import { analyzeLeads, AnalyzedLead } from './analyzer';
import { generateReport } from './reporter';
import { sendOpportunityEmail } from '../lib/email';
import { logger } from '../lib/logger';
import fs from 'fs';
import path from 'path';

/**
 * Orchestrates the full agent pipeline:
 * 1. Discovers leads for the configured business category.
 * 2. Analyzes their digital presence, maturity, and potential software requirements.
 * 3. Generates a comprehensive markdown report.
 * 4. Sends the report via Resend email.
 */
export async function runAgentWorkflow(manualCategory?: string): Promise<void> {
  logger.info('========================================================================');
  logger.info('Iniciando ejecución del agente de marketing y ventas...');
  logger.info('========================================================================');

  const hasKeys = !!process.env.GEMINI_API_KEY;

  if (!hasKeys) {
    logger.warn('[MODO SIMULACIÓN] GEMINI_API_KEY no configurado en el archivo .env.');
    logger.warn('[MODO SIMULACIÓN] Ejecutando simulación con datos de prueba realistas...');
    await runSimulation();
    return;
  }

  try {
    const now = new Date();
    const baseDate = new Date(2026, 0, 1);
    const startOfNow = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const diffTime = Math.abs(startOfNow.getTime() - baseDate.getTime());
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    let location: string | undefined;

    // Cargar lista de ciudades para rotación
    let cities: string[] = [];
    try {
      const citiesPath = path.join(process.cwd(), 'config', 'cities.json');
      if (fs.existsSync(citiesPath)) {
        cities = JSON.parse(fs.readFileSync(citiesPath, 'utf-8'));
      }
    } catch (err: any) {
      logger.warn(`No se pudo leer config/cities.json: ${err.message}`);
    }

    // Determinar categoría
    let category = manualCategory || process.env.DEFAULT_SEARCH_CATEGORY;

    if (!category) {
      try {
        const industriesPath = path.join(process.cwd(), 'config', 'industries.json');
        if (fs.existsSync(industriesPath)) {
          const industries = JSON.parse(fs.readFileSync(industriesPath, 'utf-8'));
          if (Array.isArray(industries) && industries.length > 0) {
            const index = diffDays % industries.length;
            category = industries[index];
            logger.info(`[Fase 2] DEFAULT_SEARCH_CATEGORY no configurado en .env. Seleccionando rubro rotativo automático: "${category}" (Día ${diffDays}, Índice ${index})`);
          }
        }
      } catch (err: any) {
        logger.warn(`No se pudo leer config/industries.json: ${err.message}. Usando fallback.`);
      }
    }

    if (!category) {
      category = 'clinica medica';
    }

    // Determinar ubicación si hay ciudades disponibles
    if (Array.isArray(cities) && cities.length > 0) {
      const cityIndex = diffDays % cities.length;
      location = cities[cityIndex];
      logger.info(`[Fase 2] Seleccionando ubicación rotativa automática: "${location}" (Día ${diffDays}, Índice ${cityIndex})`);
    }

    const limit = parseInt(process.env.LEAD_DAILY_LIMIT || '8', 10);

    // 1. Fase 2: Lead Discovery
    logger.info(`[Fase 2] Iniciando Lead Discovery para la categoría: "${category}"${location ? ` en "${location}"` : ''}...`);
    const leads = await discoverLeads(category, limit, location);
    logger.info(`[Fase 2] Lead Discovery completado. Se obtuvieron ${leads.length} leads.`);

    // 2. Fase 3: Analyzer
    logger.info('[Fase 3] Iniciando Análisis de madurez digital e identificación de oportunidades...');
    const analyzedLeads = await analyzeLeads(leads);
    
    // Guardar los leads enriquecidos con su análisis (incluyendo email drafts y scores) en disco
    if (analyzedLeads.length > 0) {
      const today = new Date().toISOString().split('T')[0];
      const leadsDir = path.join(process.cwd(), 'leads');
      const filePath = path.join(leadsDir, `${today}.json`);
      fs.writeFileSync(filePath, JSON.stringify(analyzedLeads, null, 2), 'utf-8');
      logger.info(`[Fase 3] Se guardaron los leads analizados (con scores y borradores) en: ${filePath}`);
    }
    
    logger.info('[Fase 3] Análisis completado con éxito.');

    // 3. Fase 4: Reportes
    logger.info('[Fase 4] Generando archivo de reporte diario en formato Markdown...');
    const markdownReport = await generateReport(analyzedLeads);
    logger.info('[Fase 4] Reporte generado y guardado en la carpeta /reports.');

    // 4. Fase 5: Email
    logger.info('[Fase 5] Enviando reporte de oportunidades por email a través de Resend...');
    
    if (process.env.RESEND_API_KEY) {
      await sendOpportunityEmail(analyzedLeads, markdownReport);
      logger.info('[Fase 5] Envío de email finalizado.');
    } else {
      logger.warn('[Fase 5] RESEND_API_KEY no configurada. Se omitió el envío de email real.');
    }

    logger.info('========================================================================');
    logger.info('Ejecución del agente de marketing finalizada de forma exitosa.');
    logger.info('========================================================================');
  } catch (error: any) {
    logger.error('Error crítico durante el flujo de trabajo del agente:', error);
  }
}

/**
 * Runs a simulated agent run with realistic data when API keys are missing.
 */
async function runSimulation(): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --- 1. SIMULAR BÚSQUEDA ---
  logger.info('[Fase 2] [Simulación] Buscando empresas en Google/DuckDuckGo para: "desarrollo de software"...');
  await delay(2000);
  
  const mockLeads: Lead[] = [
    {
      name: 'Estudio Contable ContaSurg',
      web: 'https://contasurg-mock.com.ar',
      email: 'contacto@contasurg-mock.com.ar',
      phone: '+54 11 4982-1200',
      category: 'Contabilidad y Finanzas',
      description: 'Estudio contable dedicado al asesoramiento de PyMEs y liquidación de impuestos en Buenos Aires.'
    },
    {
      name: 'Centro Médico Vía Salud',
      web: 'https://viasalud-mock.com.ar',
      email: 'consultas@viasalud-mock.com.ar',
      phone: '+54 11 5521-9343',
      category: 'Salud y Clínicas',
      description: 'Clínica médica privada con atención ambulatoria y múltiples especialidades médicas.'
    },
    {
      name: 'Logística TransRápido',
      web: 'https://transrapido-mock.com',
      email: '',
      phone: '+54 11 3921-9988',
      category: 'Logística y Distribución',
      description: 'Empresa familiar de transporte y distribución de mercaderías de media y larga distancia.'
    },
    {
      name: 'Hotel Boutique Claridge',
      web: 'https://claridgeboutique-mock.com',
      email: 'reservas@claridgeboutique-mock.com',
      phone: '',
      category: 'Hotelería y Turismo',
      description: 'Hotel boutique céntrico que ofrece habitaciones de lujo y servicios de spa.'
    }
  ];

  // Guardar leads de prueba
  const leadsDir = path.join(process.cwd(), 'leads');
  if (!fs.existsSync(leadsDir)) fs.mkdirSync(leadsDir, { recursive: true });
  fs.writeFileSync(path.join(leadsDir, `${today}.json`), JSON.stringify(mockLeads, null, 2), 'utf-8');
  logger.info(`[Fase 2] [Simulación] Se obtuvieron 4 leads de prueba. Guardados en leads/${today}.json`);

  // --- 2. SIMULAR ANÁLISIS ---
  logger.info('[Fase 3] [Simulación] Iniciando análisis tecnológico de los leads...');
  await delay(2500);

  const analyzedLeads: AnalyzedLead[] = [
    {
      ...mockLeads[1], // Centro Médico Vía Salud (Score alto)
      analysis: {
        score: 92,
        problemas: [
          'La reserva de turnos se hace obligatoriamente llamando por teléfono o vía mensaje de WhatsApp manual.',
          'No cuenta con pasarela de pagos para abonar consultas particulares o copagos online.',
          'Página web institucional lenta y no optimizada para visualización en teléfonos móviles.'
        ],
        oportunidades: [
          'Digitalizar el proceso de reserva implementando una agenda interactiva de turnos.',
          'Integrar pasarela de pagos (MercadoPago/Webpay) para cobro de consultas.',
          'Crear una plataforma de visualización de estudios médicos para pacientes.'
        ],
        software_sugerido: [
          'Sistema de Gestión de Turnos Médicos iWEB (Software a Medida)',
          'Portal de Pacientes con descarga de estudios (SaaS)',
          'Rediseño Web Corporativo Moderno (Desarrollo Web)'
        ]
      }
    },
    {
      ...mockLeads[0], // Estudio Contable ContaSurg (Score medio-alto)
      analysis: {
        score: 78,
        problemas: [
          'El envío de facturas y documentación mensual a clientes se realiza mediante correos manuales uno por uno.',
          'No disponen de un portal unificado de clientes donde subir liquidaciones e impuestos.',
          'Pérdida de tiempo operativa en tareas repetitivas de carga de planillas Excel.'
        ],
        oportunidades: [
          'Desarrollar un portal privado de autogestión para clientes del estudio contable.',
          'Automatizar el envío de alertas de vencimiento mediante flujos automatizados.',
          'Crear un cotizador web automático de abonos contables para nuevos prospectos.'
        ],
        software_sugerido: [
          'Portal del Cliente ContaSurg (SaaS / Software a Medida)',
          'Sistema de Automatización de Alertas e Impuestos iWEB (Automatizaciones)',
          'Cotizador de Servicios Online Integrado (Desarrollo Web)'
        ]
      }
    },
    {
      ...mockLeads[2], // Logística TransRápido (Score medio)
      analysis: {
        score: 65,
        problemas: [
          'Los clientes llaman por teléfono constantemente para consultar el estado y ubicación de sus envíos.',
          'No cuentan con un formulario digitalizado de solicitud de cotización de fletes.'
        ],
        oportunidades: [
          'Implementar un sistema web público de seguimiento (Tracking) de envíos por número de guía.',
          'Formulario inteligente y dinámico de cotización de cargas.'
        ],
        software_sugerido: [
          'Sistema de Seguimiento de Envíos en tiempo real (Software a Medida)',
          'Dashboard de Control de Choferes y Viajes (Dashboards)'
        ]
      }
    },
    {
      ...mockLeads[3], // Hotel Boutique Claridge (Score bajo)
      analysis: {
        score: 35,
        problemas: [
          'El sitio web cuenta con un motor de reservas moderno, pero no se integra bien con el sistema de limpieza.'
        ],
        oportunidades: [
          'Mejorar la integración de APIs del motor de reservas externo con una app interna para mucamas.'
        ],
        software_sugerido: [
          'Aplicación móvil interna de control de limpieza de habitaciones (Sistemas de Gestión)'
        ]
      }
    }
  ];

  // Ordenar por score descendente
  analyzedLeads.sort((a, b) => b.analysis.score - a.analysis.score);
  logger.info('[Fase 3] [Simulación] Análisis finalizado. Se determinaron las puntuaciones de oportunidad.');

  // --- 3. SIMULAR REPORTES ---
  logger.info('[Fase 4] [Simulación] Generando reporte diario...');
  await delay(1500);

  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const reportMarkdown = `# Reporte Diario de Oportunidades iWEB - ${today} (Simulación)

## 📊 Resumen Ejecutivo
Se ejecutó la búsqueda automatizada para empresas de la categoría general de servicios comerciales e infraestructura. La madurez tecnológica promedio encontrada indica una alta necesidad de digitalización de procesos, especialmente en la reserva de citas y gestión de portales de clientes.

### 📈 Métricas del Día
- **Leads Totales Procesados:** 4
- **Puntuación de Oportunidad Promedio:** 68/100
- **Oportunidades de Alta Prioridad (Score ≥ 70):** 2
- **Oportunidades de Prioridad Media (Score 40-69):** 1

## 📋 Listado General de Leads

| Empresa | Categoría | Sitio Web | Email | Teléfono | Score | Prioridad |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **Centro Médico Vía Salud** | Salud y Clínicas | [Visitar Web](https://viasalud-mock.com.ar) | consultas@viasalud-mock.com.ar | +54 11 5521-9343 | **92** | 🔴 Alta |
| **Estudio Contable ContaSurg** | Contabilidad y Finanzas | [Visitar Web](https://contasurg-mock.com.ar) | contacto@contasurg-mock.com.ar | +54 11 4982-1200 | **78** | 🔴 Alta |
| **Logística TransRápido** | Logística y Distribución | [Visitar Web](https://transrapido-mock.com) | *No disponible* | +54 11 3921-9988 | **65** | 🟡 Media |
| **Hotel Boutique Claridge** | Hotelería y Turismo | [Visitar Web](https://claridgeboutique-mock.com) | reservas@claridgeboutique-mock.com | *No disponible* | **35** | 🟢 Baja |

## 💡 Análisis de Oportunidades Clave

### 1. Centro Médico Vía Salud (Score: 92/100)
- **Sitio Web:** [https://viasalud-mock.com.ar](https://viasalud-mock.com.ar)
- **Email:** consultas@viasalud-mock.com.ar
- **Teléfono:** +54 11 5521-9343
- **Descripción:** Clínica médica privada con atención ambulatoria y múltiples especialidades médicas.

#### 🔍 Problemas Operativos Detectados:
- La reserva de turnos se hace obligatoriamente llamando por teléfono o vía mensaje de WhatsApp manual.
- No cuenta con pasarela de pagos para abonar consultas particulares o copagos online.
- Página web institucional lenta y no optimizada para visualización en teléfonos móviles.

#### ⚡ Oportunidades de Digitalización:
- Digitalizar el proceso de reserva implementando una agenda interactiva de turnos.
- Integrar pasarela de pagos (MercadoPago/Webpay) para cobro de consultas.
- Crear una plataforma de visualización de estudios médicos para pacientes.

#### 🛠️ Propuesta de Software Sugerida (iWEB):
- Sistema de Gestión de Turnos Médicos iWEB (Software a Medida)
- Portal de Pacientes con descarga de estudios (SaaS)
- Rediseño Web Corporativo Moderno (Desarrollo Web)

---

### 2. Estudio Contable ContaSurg (Score: 78/100)
- **Sitio Web:** [https://contasurg-mock.com.ar](https://contasurg-mock.com.ar)
- **Email:** contacto@contasurg-mock.com.ar
- **Teléfono:** +54 11 4982-1200
- **Descripción:** Estudio contable dedicado al asesoramiento de PyMEs y liquidación de impuestos en Buenos Aires.

#### 🔍 Problemas Operativos Detectados:
- El envío de facturas y documentación mensual a clientes se realiza mediante correos manuales uno por uno.
- No disponen de un portal unificado de clientes donde subir liquidaciones e impuestos.

#### ⚡ Oportunidades de Digitalización:
- Desarrollar un portal privado de autogestión para clientes del estudio contable.
- Automatizar el envío de alertas de vencimiento mediante flujos automatizados.

#### 🛠️ Propuesta de Software Sugerida (iWEB):
- Portal del Cliente ContaSurg (SaaS / Software a Medida)
- Sistema de Automatización de Alertas e Impuestos iWEB (Automatizaciones)

---

## 🎯 Conclusiones y Próximos Pasos
- **Outreach Inmediato:** Priorizar contacto con *Centro Médico Vía Salud*, ofreciendo puntualmente el sistema de turnos online y pasarela de pago.
- **Campañas Especializadas:** Se detecta una constante necesidad de Portales de Clientes / Autogestión en estudios contables.

---
*Reporte generado de manera autónoma en Modo Simulación por el Agente de Marketing iWEB el ${new Date().toLocaleString('es-AR')}.*`;

  fs.writeFileSync(path.join(reportsDir, `${today}.md`), reportMarkdown, 'utf-8');
  logger.info(`[Fase 4] [Simulación] Reporte de simulación guardado en reports/${today}.md`);

  // --- 4. SIMULAR EMAIL ---
  logger.info('[Fase 5] [Simulación] Enviando reporte por email...');
  await delay(1000);
  
  if (process.env.RESEND_API_KEY) {
    try {
      await sendOpportunityEmail(analyzedLeads, reportMarkdown);
      logger.info('[Fase 5] [Simulación] Email real enviado (API Key de Resend detectada).');
    } catch (err: any) {
      logger.error('[Fase 5] [Simulación] Error intentando enviar email real en simulación:', err);
    }
  } else {
    logger.info(`[Fase 5] [Simulación] Correo simulado exitosamente de "onboarding@resend.dev" a "iweb.contacto@gmail.com".`);
    logger.info(`[Fase 5] [Simulación] Para habilitar envíos reales de email, ingresa tu RESEND_API_KEY en el archivo .env.`);
  }

  logger.info('========================================================================');
  logger.info('[Simulación] Flujo de simulación del agente finalizado con éxito.');
  logger.info('========================================================================');
}
