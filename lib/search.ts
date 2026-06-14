import * as cheerio from 'cheerio';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

/**
 * Searches the web for a given query.
 * Supports Serper, Tavily, and falls back to scraping DuckDuckGo HTML.
 */
export async function searchWeb(query: string, limit: number = 8): Promise<SearchResult[]> {
  const apiKey = process.env.SEARCH_API_KEY;

  if (apiKey) {
    if (apiKey.startsWith('tvly-')) {
      return searchTavily(query, apiKey, limit);
    } else {
      return searchSerper(query, apiKey, limit);
    }
  }

  // Fallback: Scrape DuckDuckGo HTML
  return searchDuckDuckGo(query, limit);
}

/**
 * Searches using Serper API (Google Search API)
 */
async function searchSerper(query: string, apiKey: string, limit: number): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: limit }),
    });

    if (!response.ok) {
      throw new Error(`Serper API responded with status ${response.status}`);
    }

    const data = await response.json();
    const organic = data.organic || [];
    
    return organic.slice(0, limit).map((item: any) => ({
      title: item.title || '',
      url: item.link || '',
      snippet: item.snippet || '',
    }));
  } catch (error) {
    console.error('Error in Serper search, falling back to DuckDuckGo:', error);
    return searchDuckDuckGo(query, limit);
  }
}

/**
 * Searches using Tavily API
 */
async function searchTavily(query: string, apiKey: string, limit: number): Promise<SearchResult[]> {
  try {
    const response = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        max_results: limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`Tavily API responded with status ${response.status}`);
    }

    const data = await response.json();
    const results = data.results || [];
    
    return results.map((item: any) => ({
      title: item.title || '',
      url: item.url || '',
      snippet: item.content || '',
    }));
  } catch (error) {
    console.error('Error in Tavily search, falling back to DuckDuckGo:', error);
    return searchDuckDuckGo(query, limit);
  }
}

/**
 * Searches using DuckDuckGo HTML scraper (no API key required)
 */
async function searchDuckDuckGo(query: string, limit: number): Promise<SearchResult[]> {
  try {
    const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!response.ok) {
      throw new Error(`DuckDuckGo responded with status ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);
    const results: SearchResult[] = [];

    $('.result__body').each((_, element) => {
      if (results.length >= limit) return;

      const titleEl = $(element).find('.result__a');
      const title = titleEl.text().trim();
      let rawUrl = titleEl.attr('href') || '';
      const snippet = $(element).find('.result__snippet').text().trim();

      // DuckDuckGo redirects links like: //duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2F...
      if (rawUrl.includes('uddg=')) {
        try {
          const urlObj = new URL('https:' + rawUrl);
          const uddg = urlObj.searchParams.get('uddg');
          if (uddg) {
            rawUrl = decodeURIComponent(uddg);
          }
        } catch (e) {
          // Si falla la conversión, dejamos el url como está
        }
      }

      // Si empieza con barra inclinada doble, le agregamos https
      if (rawUrl.startsWith('//')) {
        rawUrl = 'https:' + rawUrl;
      }

      if (title && rawUrl) {
        results.push({ title, url: rawUrl, snippet });
      }
    });

    return results;
  } catch (error) {
    console.error('Error scraping DuckDuckGo:', error);
    return [];
  }
}
