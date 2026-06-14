import * as cheerio from 'cheerio';

export interface ScrapedPage {
  url: string;
  title: string;
  metaDescription: string;
  cleanText: string;
  emailsFound: string[];
  phonesFound: string[];
}

/**
 * Fetches and cleans the HTML content of a website page.
 * Includes timeout protection to prevent slow servers from hanging the execution.
 */
export async function scrapeWebsite(url: string, timeoutMs: number = 8000): Promise<ScrapedPage> {
  const result: ScrapedPage = {
    url,
    title: '',
    metaDescription: '',
    cleanText: '',
    emailsFound: [],
    phonesFound: [],
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch website, status code: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 1. Obtener Metadatos
    result.title = $('title').text().trim();
    result.metaDescription = $('meta[name="description"]').attr('content')?.trim() || '';

    // 2. Extraer emails y teléfonos básicos con regex antes de limpiar el HTML
    const pageText = $('body').text() || '';
    result.emailsFound = extractEmails(pageText);
    result.phonesFound = extractPhones(pageText);

    // Buscar enlaces internos de contacto antes de limpiar el HTML
    const contactLinks: string[] = [];
    try {
      const domainObj = new URL(url);
      $('a').each((_, el) => {
        const href = $(el).attr('href')?.trim();
        if (!href) return;

        try {
          let absoluteUrl = '';
          if (href.startsWith('http')) {
            const hrefObj = new URL(href);
            if (hrefObj.hostname === domainObj.hostname) {
              absoluteUrl = href;
            }
          } else if (!href.startsWith('#') && !href.startsWith('javascript:') && !href.startsWith('tel:') && !href.startsWith('mailto:')) {
            absoluteUrl = new URL(href, url).toString();
          }

          if (absoluteUrl) {
            // Limpiar fragmentos
            const cleanUrl = absoluteUrl.split('#')[0];
            if (isContactLink(cleanUrl) && !contactLinks.includes(cleanUrl) && cleanUrl !== url) {
              contactLinks.push(cleanUrl);
            }
          }
        } catch (e) {
          // Ignorar URL
        }
      });
    } catch (e) {
      // Ignorar URL base
    }

    // 3. Limpiar elementos innecesarios para optimizar tokens
    $('script, style, noscript, iframe, svg, img, video, audio, link, path, head, nav, footer').remove();

    // Obtener texto limpio y formateado
    let bodyText = $('body').text() || '';
    
    // Normalizar espacios y saltos de línea
    bodyText = bodyText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Limitar el contenido a los primeros 12,000 caracteres
    result.cleanText = bodyText.substring(0, 12000);

    // 4. Si no se encontraron emails en la Home y hay links de contacto, hacer deep scraping
    if (result.emailsFound.length === 0 && contactLinks.length > 0) {
      console.log(`[Scraper] No se hallaron emails en la Home. Iniciando Deep Scraping en ${contactLinks.slice(0, 2).length} subpáginas de contacto...`);
      
      for (const link of contactLinks.slice(0, 2)) {
        try {
          const subController = new AbortController();
          const subTimeoutId = setTimeout(() => subController.abort(), 4000); // 4 segundos de límite para subpáginas

          const subRes = await fetch(link, {
            signal: subController.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
          });

          clearTimeout(subTimeoutId);

          if (subRes.ok) {
            const subHtml = await subRes.text();
            const $sub = cheerio.load(subHtml);
            
            const subPageText = $sub('body').text() || '';
            const subEmails = extractEmails(subPageText);
            const subPhones = extractPhones(subPageText);

            if (subEmails.length > 0) {
              result.emailsFound = Array.from(new Set([...result.emailsFound, ...subEmails]));
            }
            if (subPhones.length > 0) {
              result.phonesFound = Array.from(new Set([...result.phonesFound, ...subPhones]));
            }

            // Limpiar subpágina y añadir al texto
            $sub('script, style, noscript, iframe, svg, img, video, audio, link, path, head, nav, footer').remove();
            let subBodyText = $sub('body').text() || '';
            subBodyText = subBodyText.replace(/\s+/g, ' ').replace(/\n+/g, '\n').trim();

            if (subBodyText) {
              result.cleanText += `\n\n--- [SUBPÁGINA: ${link}] ---\n` + subBodyText.substring(0, 4000);
            }
            
            console.log(`[Scraper] Deep scraping exitoso en subpágina: ${link}. Emails encontrados acumulados: ${result.emailsFound.length}`);
          }
        } catch (subErr: any) {
          // Fallas silenciosas en subpáginas para no trancar la Home
        }
      }
      
      // Acotar cleanText total a 15,000 caracteres
      result.cleanText = result.cleanText.substring(0, 15000);
    }

  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.warn(`Scrape timed out for URL: ${url}`);
    } else {
      console.warn(`Failed to scrape URL ${url}: ${error.message}`);
    }
  }

  return result;
}

/**
 * Helper to extract emails via Regex
 */
function extractEmails(text: string): string[] {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const matches = text.match(emailRegex) || [];
  // Filtrar duplicados y extensiones de archivos comunes que parezcan emails
  return Array.from(new Set(matches)).filter(email => {
    const lower = email.toLowerCase();
    return !lower.endsWith('.png') && !lower.endsWith('.jpg') && !lower.endsWith('.gif') && !lower.endsWith('.webp');
  });
}

/**
 * Helper to extract potential phone numbers via Regex
 */
function extractPhones(text: string): string[] {
  // Coincide con formatos comunes de teléfono, ej: +54 9 11 1234-5678, (011) 4567-8901, etc.
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/g;
  const matches = text.match(phoneRegex) || [];
  
  // Limpiar y filtrar por longitud razonable para evitar falsos positivos
  return Array.from(new Set(
    matches
      .map(p => p.trim())
      .filter(p => {
        const digits = p.replace(/\D/g, '');
        return digits.length >= 8 && digits.length <= 15;
      })
  ));
}

/**
 * Helper to check if a URL link points to contact or about pages
 */
function isContactLink(urlStr: string): boolean {
  const lower = urlStr.toLowerCase();
  return (
    lower.includes('contacto') ||
    lower.includes('contact') ||
    lower.includes('nosotros') ||
    lower.includes('quienes-somos') ||
    lower.includes('quienes_somos') ||
    lower.includes('about') ||
    lower.includes('info')
  );
}
