import fs from 'fs';
import path from 'path';
import { searchWeb } from '../lib/search';
import { scrapeWebsite } from '../lib/scraper';
import { callGeminiJSON } from '../lib/gemini';

export interface Lead {
  name: string;
  web: string;
  email: string;
  phone: string;
  category: string;
  description?: string;
}

function getDomainName(urlStr: string): string {
  try {
    const urlObj = new URL(urlStr);
    return urlObj.hostname.replace('www.', '').toLowerCase();
  } catch (e) {
    return urlStr.replace(/^https?:\/\//, '').replace('www.', '').split('/')[0].toLowerCase();
  }
}

/**
 * Searches and discovers leads based on a target category/industry.
 * Extracts contact details and saves them in leads/YYYY-MM-DD.json.
 */
export async function discoverLeads(
  category: string, 
  limit: number = 8,
  location?: string
): Promise<Lead[]> {
  console.log(`[Lead Discovery] Iniciando búsqueda para la categoría: "${category}"${location ? ` en "${location}"` : ''} (Límite: ${limit})`);
  
  const leadsDir = path.join(process.cwd(), 'leads');
  const historicoPath = path.join(leadsDir, 'historico.json');
  let historico: string[] = [];

  if (fs.existsSync(historicoPath)) {
    try {
      historico = JSON.parse(fs.readFileSync(historicoPath, 'utf-8'));
    } catch (e: any) {
      console.warn(`[Lead Discovery] No se pudo leer historico.json: ${e.message}`);
    }
  }

  // 1. Ejecutar búsqueda web para encontrar sitios de empresas (pedimos más resultados para filtrar agregadores)
  const searchQuery = location ? `${category} en ${location}` : category;
  const rawResults = await searchWeb(searchQuery, Math.max(limit * 3, 24));
  console.log(`[Lead Discovery] Se encontraron ${rawResults.length} candidatos potenciales crudos en la búsqueda.`);

  // Filtrar de antemano agregadores, directorios y duplicados históricos (de forma insensible a mayúsculas/minúsculas)
  const filteredResults = rawResults.filter(result => {
    const url = result.url.toLowerCase();
    const domain = getDomainName(url);

    if (historico.includes(domain)) {
      console.log(`[Lead Discovery] Saltando lead duplicado (ya en el histórico): ${domain}`);
      return false;
    }

    return !(
      url.includes('linkedin.com') || 
      url.includes('facebook.com') || 
      url.includes('instagram.com') ||
      url.includes('twitter.com') ||
      url.includes('pinterest') ||
      url.includes('youtube.com') ||
      url.includes('wikipedia.org') ||
      url.includes('paginasamarillas') ||
      url.includes('mercadolibre') ||
      url.includes('tripadvisor') ||
      url.includes('booking.com') ||
      url.includes('despegar') ||
      url.includes('turismocity') ||
      url.includes('almundo') ||
      url.includes('expedia') || 
      url.includes('kayak') || 
      url.includes('trivago') || 
      url.includes('glassdoor') ||
      url.includes('indeed') ||
      url.includes('yelp') ||
      url.includes('foursquare') ||
      url.includes('infobae.com') ||
      url.includes('lanacion.com') ||
      url.includes('clarin.com')
    );
  });

  console.log(`[Lead Discovery] Quedan ${filteredResults.length} candidatos válidos tras filtrar directorios/redes sociales.`);

  // Limitar al número solicitado de leads
  const targetResults = filteredResults.slice(0, limit);
  console.log(`[Lead Discovery] Se procederá a analizar un máximo de ${targetResults.length} sitios web independientes.`);

  const leads: Lead[] = [];

  // 2. Procesar cada resultado (Scraping + Gemini Extraction)
  for (const result of targetResults) {
    const url = result.url;

    try {
      console.log(`[Lead Discovery] Analizando sitio web: ${url}`);
      const scraped = await scrapeWebsite(url);

      if (!scraped.cleanText && scraped.emailsFound.length === 0) {
        console.log(`[Lead Discovery] No se pudo obtener contenido legible de ${url}. Saltando...`);
        continue;
      }

      // 3. Prompt de extracción para Gemini
      const extractionPrompt = `
Analiza la siguiente información de un sitio web corporativo y extrae los datos de contacto oficiales de la empresa.

URL de la empresa: ${scraped.url}
Título de la pestaña: ${scraped.title}
Descripción Meta: ${scraped.metaDescription}

Texto extraído de la página principal:
"""
${scraped.cleanText}
"""

Emails detectados automáticamente por código (pueden contener falsos positivos, utilízalos como referencia si son correctos):
${JSON.stringify(scraped.emailsFound)}

Teléfonos detectados automáticamente por código:
${JSON.stringify(scraped.phonesFound)}

Genera un objeto JSON que represente a la empresa. Si no encuentras un email o teléfono específico, intenta deducirlo del texto o usa uno de los detectados automáticamente si consideras que es el correcto. Si definitivamente no hay, déjalo vacío ("").

Tu respuesta debe seguir estrictamente este formato JSON:
{
  "name": "Nombre oficial de la empresa",
  "web": "${scraped.url}",
  "email": "Email de contacto oficial (ej: contacto@empresa.com o info@empresa.com)",
  "phone": "Teléfono de contacto oficial (con código de área si está disponible)",
  "category": "Categoría específica de su actividad principal",
  "description": "Una breve descripción de 1 o 2 oraciones sobre lo que hace la empresa y sus servicios principales"
}
`;

      const leadData = await callGeminiJSON<Lead>(extractionPrompt);

      if (leadData && leadData.name) {
        // Normalizar sitio web
        leadData.web = url;
        leads.push(leadData);
        console.log(`[Lead Discovery] Lead extraído con éxito: ${leadData.name} (${leadData.email || 'Sin email'})`);
      }
    } catch (error: any) {
      console.error(`[Lead Discovery] Error procesando lead de URL ${url}:`, error.message);
    }
  }

  // 4. Guardar leads en archivo y actualizar el histórico
  if (leads.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    
    if (!fs.existsSync(leadsDir)) {
      fs.mkdirSync(leadsDir, { recursive: true });
    }

    const filePath = path.join(leadsDir, `${today}.json`);
    fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');
    console.log(`[Lead Discovery] Se guardaron ${leads.length} leads en ${filePath}`);

    // Registrar nuevos dominios en el histórico
    const newDomains = leads.map(l => getDomainName(l.web)).filter(d => d);
    const updatedHistorico = Array.from(new Set([...historico, ...newDomains]));
    try {
      fs.writeFileSync(historicoPath, JSON.stringify(updatedHistorico, null, 2), 'utf-8');
      console.log(`[Lead Discovery] Se registraron ${newDomains.length} nuevos dominios en el histórico (Total: ${updatedHistorico.length}).`);
    } catch (err: any) {
      console.error(`[Lead Discovery] Error al actualizar el histórico: ${err.message}`);
    }
  } else {
    console.log('[Lead Discovery] No se descubrieron leads válidos en esta ejecución.');
  }

  return leads;
}
