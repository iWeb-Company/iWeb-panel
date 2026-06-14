import { scrapeWebsite } from '../lib/scraper';
import { callGeminiJSON } from '../lib/gemini';
import { Lead } from './leadDiscovery';

export interface AnalysisResult {
  score: number;             // Puntuación de oportunidad (0-100), mayor score = mayor necesidad de software
  problemas: string[];       // Problemas operativos y digitales detectados
  oportunidades: string[];   // Oportunidades de mejora de software
  software_sugerido: string[]; // Soluciones de software específicas (alineadas con los servicios de iWEB)
  emailDraft?: string;       // Borrador de correo de ventas personalizado sugerido (Asunto + Cuerpo)
}

export interface AnalyzedLead extends Lead {
  analysis: AnalysisResult;
}

/**
 * Analyzes a lead's digital presence and technological maturity using Gemini.
 */
export async function analyzeLead(lead: Lead): Promise<AnalysisResult> {
  console.log(`[Analyzer] Analizando madurez digital de: ${lead.name} (${lead.web})`);
  
  let cleanText = '';
  let metaDescription = '';
  let title = '';

  try {
    // Volver a scrapear o leer texto si fuera necesario (garantiza datos frescos para el análisis)
    const scraped = await scrapeWebsite(lead.web);
    cleanText = scraped.cleanText;
    metaDescription = scraped.metaDescription;
    title = scraped.title;
  } catch (error) {
    console.warn(`[Analyzer] Advertencia: No se pudo obtener el HTML completo de ${lead.web}. Usando descripción del lead.`);
    cleanText = lead.description || '';
  }

  // Definir la cartera de servicios de iWEB para alinear las oportunidades
  const iwebServices = `
iWEB - Servicios de Software:
1. Desarrollo Web (Sitios corporativos rápidos, modernos y optimizados para SEO)
2. Software a Medida (Plataformas web, integraciones y lógica de negocio específica)
3. SaaS (Software como servicio)
4. Sistemas de Gestión (CRM, ERP, control de stock, gestión interna)
5. Automatizaciones (Flujos automáticos, bots de WhatsApp, sincronización de herramientas)
6. Ecommerce (Tiendas online completas, pasarelas de pago integradas)
7. Dashboards (Tableros de control de datos y reportes visuales en tiempo real)
`;

  const prompt = `
Actúa como un Consultor Tecnológico Senior, Arquitecto de Producto y AI Engineer de iWEB.
Tu objetivo es analizar la presencia digital y madurez tecnológica de la siguiente empresa para encontrar oportunidades de venta de nuestros servicios.

DATOS DE LA EMPRESA:
Nombre: ${lead.name}
Sitio Web: ${lead.web}
Categoría original: ${lead.category}
Descripción básica: ${lead.description}

TEXTO EXTRAÍDO DE LA WEB DE LA EMPRESA:
"""
Título: ${title}
Meta Descripción: ${metaDescription}
Contenido Web:
${cleanText || 'No se pudo leer el sitio web de forma detallada.'}
"""

NUESTROS SERVICIOS DE SOFTWARE (iWEB):
${iwebServices}

Analiza con espíritu crítico la información web de la empresa y determina:
1. Su presencia digital (si es anticuada, carece de llamadas a la acción, es lenta, o no está bien estructurada).
2. Su madurez tecnológica (si tiene procesos que parecen manuales como agendar turnos por chat/teléfono, si carece de pasarela de pagos, si no tiene portal de clientes o integraciones con sistemas).
3. Puntuación de Oportunidad (Score de 0 a 100): ¿Qué tan buen lead es para venderle software? (Ej: 90+ = tiene una web horrible o nula digitalización y necesita sistemas urgentes; 30 = ya tiene un sistema digital de primer nivel).
4. Problemas operativos implícitos (ej. "Agenda turnos solo por WhatsApp", "No tiene cotizador online", "Sitio web lento/no optimizado para móviles").
5. Oportunidades de digitalización.
6. Qué software específico sugerimos construirles (debe pertenecer o estar directamente relacionado con la lista de servicios de iWEB).
7. Redactar un borrador de correo de ventas altamente personalizado e informal, en español de Latinoamérica, dirigido a ellos. Debe incluir:
   - Asunto del correo (directo y llamativo).
   - Saludo personalizado amigable (ej: "Hola gente de [Nombre de Empresa]" o "Hola [Nombre de Empresa]").
   - Mención de 1 o 2 de los problemas más críticos que encontramos en su web (ej: la falta de cotizador o reserva online) explicados amablemente.
   - Breve presentación de cómo en iWEB podemos solucionarlo con una de las propuestas de software sugeridas.
   - Una llamada a la acción clara para agendar una breve llamada de 10 minutos (con tono amigable y profesional, sin presionar).
   - Firma: "El equipo de iWEB"

Devuelve tu respuesta estrictamente en este formato JSON:
{
  "score": 85, // número del 0 al 100
  "problemas": [
    "Breve descripción del problema operativo 1",
    "Breve descripción del problema operativo 2"
  ],
  "oportunidades": [
    "Descripción de la oportunidad de digitalización 1",
    "Descripción de la oportunidad de digitalización 2"
  ],
  "software_sugerido": [
    "Nombre y descripción del sistema de iWEB sugerido (ej: 'Sistema de Gestión de Turnos automatizado con cobros integrados')",
    "Nombre y descripción de otra sugerencia (ej: 'Dashboard de Control de Stock y Ventas')"
  ],
  "email_draft": "Asunto: [Asunto del email]\n\nHola [Nombre de la Empresa],\n\nEstuve revisando su sitio web y..."
}
`;

  try {
    const analysis = await callGeminiJSON<any>(prompt);
    
    // Asegurar estructura y valores por defecto
    return {
      score: typeof analysis.score === 'number' ? analysis.score : 50,
      problemas: Array.isArray(analysis.problemas) ? analysis.problemas : [],
      oportunidades: Array.isArray(analysis.oportunidades) ? analysis.oportunidades : [],
      software_sugerido: Array.isArray(analysis.software_sugerido) ? analysis.software_sugerido : [],
      emailDraft: analysis.email_draft || '',
    };
  } catch (error: any) {
    console.error(`[Analyzer] Error al analizar ${lead.name}:`, error.message);
    
    // Retornar fallback seguro en caso de error de la API de Gemini
    return {
      score: 40,
      problemas: ['No se pudo realizar el análisis automático debido a un error de comunicación con el servicio de IA.'],
      oportunidades: ['Actualizar canales digitales.'],
      software_sugerido: ['Desarrollo web corporativo moderno por iWEB.'],
      emailDraft: `Asunto: Solución tecnológica personalizada para ${lead.name}\n\nHola equipo de ${lead.name},\n\nEstuvimos viendo su sitio web y notamos oportunidades para optimizar sus procesos digitales y potenciar sus conversiones.\n\nEn iWEB desarrollamos software y automatizaciones a medida para eliminar tareas manuales repetitivas.\n\n¿Tendrían disponibilidad para una breve charla de 10 minutos esta semana?\n\nAtentamente,\nEl equipo de iWEB`,
    };
  }
}

/**
 * Processes a list of leads, analyzes each, and returns the analyzed leads.
 */
export async function analyzeLeads(leads: Lead[]): Promise<AnalyzedLead[]> {
  const analyzedLeads: AnalyzedLead[] = [];
  
  for (const lead of leads) {
    const analysis = await analyzeLead(lead);
    analyzedLeads.push({
      ...lead,
      analysis,
    });
    // Espaciar las peticiones 2.5 segundos para respetar los rate limits RPM de la API de Gemini
    await new Promise(resolve => setTimeout(resolve, 2500));
  }

  // Ordenar por score descendente (las mejores oportunidades primero)
  return analyzedLeads.sort((a, b) => b.analysis.score - a.analysis.score);
}
