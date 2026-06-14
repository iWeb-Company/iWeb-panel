import { Resend } from 'resend';
import { AnalyzedLead } from '../agents/analyzer';

// Inicializar el cliente de Resend de forma perezosa
let resendInstance: Resend | null = null;

function getResend(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('La variable de entorno RESEND_API_KEY no está configurada.');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

/**
 * Sends the opportunity report via email using Resend with retry logic.
 */
export async function sendOpportunityEmail(
  analyzedLeads: AnalyzedLead[],
  markdownContent: string,
  retries: number = 3,
  delayMs: number = 3000
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const fromEmail = process.env.EMAIL_FROM || 'onboarding@resend.dev';
  const toEmail = process.env.EMAIL_TO || 'iweb.contacto@gmail.com';

  console.log(`[Email] Iniciando envío de reporte a: ${toEmail} desde: ${fromEmail}`);

  const htmlContent = generateEmailHTML(analyzedLeads, today);

  const emailParams = {
    from: fromEmail,
    to: toEmail,
    subject: `🚀 iWEB Leads & Oportunidades - Reporte ${today}`,
    html: htmlContent,
  };

  // Implementación del algoritmo de reintentos
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const client = getResend();
      const result = await client.emails.send(emailParams);

      if (result.error) {
        throw new Error(result.error.message);
      }

      console.log(`[Email] Correo enviado con éxito (ID: ${result.data?.id}) en el intento ${attempt}`);
      return; // Envío exitoso, salir de la función
    } catch (error: any) {
      console.error(`[Email] Error en el intento ${attempt} de ${retries}: ${error.message}`);
      
      if (attempt === retries) {
        throw new Error(`No se pudo enviar el email después de ${retries} intentos: ${error.message}`);
      }

      // Esperar antes del próximo intento
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
}

/**
 * Generates a premium styled HTML template for the email.
 */
function generateEmailHTML(leads: AnalyzedLead[], dateStr: string): string {
  const totalLeads = leads.length;
  const avgScore = totalLeads > 0 
    ? Math.round(leads.reduce((acc, l) => acc + l.analysis.score, 0) / totalLeads) 
    : 0;

  const topLeads = leads.filter(l => l.analysis.score >= 70);

  // Generar las filas de la tabla de leads
  const tableRows = leads.map(l => {
    const priorityColor = l.analysis.score >= 70 ? '#ef4444' : l.analysis.score >= 40 ? '#f59e0b' : '#10b981';
    const priorityText = l.analysis.score >= 70 ? 'Alta' : l.analysis.score >= 40 ? 'Media' : 'Baja';
    
    return `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 12px 15px; font-weight: bold; color: #1e293b;">${l.name}</td>
        <td style="padding: 12px 15px; color: #64748b;">${l.category}</td>
        <td style="padding: 12px 15px;"><a href="${l.web}" style="color: #3b82f6; text-decoration: none;" target="_blank">Visitar Sitio</a></td>
        <td style="padding: 12px 15px; color: #475569;">${l.email || '<span style="color:#cbd5e1; font-style:italic;">No disponible</span>'}</td>
        <td style="padding: 12px 15px; font-weight: bold; text-align: center;">
          <span style="background-color: ${priorityColor}15; color: ${priorityColor}; padding: 4px 8px; rounded: 4px; border-radius: 4px; font-size: 13px;">
            ${l.analysis.score} (${priorityText})
          </span>
        </td>
      </tr>
    `;
  }).join('');

  // Generar el análisis detallado de oportunidades clave
  const opportunitiesDetails = topLeads.map((l, index) => {
    const problemsList = l.analysis.problemas.map(p => `<li style="margin-bottom: 5px;">${p}</li>`).join('');
    const opsList = l.analysis.oportunidades.map(o => `<li style="margin-bottom: 5px;">${o}</li>`).join('');
    const softList = l.analysis.software_sugerido.map(s => `<li style="margin-bottom: 5px; font-weight: 500; color: #1e3a8a;">${s}</li>`).join('');

    return `
      <div style="background-color: #f8fafc; border-left: 4px solid #3b82f6; border-radius: 4px; padding: 15px; margin-bottom: 20px;">
        <h4 style="margin-top: 0; margin-bottom: 10px; color: #1e293b; font-size: 16px;">
          ${index + 1}. ${l.name} <span style="color: #ef4444; font-size: 14px; font-weight: bold;">(Score: ${l.analysis.score})</span>
        </h4>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #64748b;"><strong>Contacto:</strong> ${l.email || 'Sin email'} | ${l.phone || 'Sin teléfono'}</p>
        
        <div style="margin-bottom: 10px;">
          <strong style="font-size: 13px; color: #475569; display: block; margin-bottom: 3px;">Problemas Operativos:</strong>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">${problemsList}</ul>
        </div>
        
        <div style="margin-bottom: 10px;">
          <strong style="font-size: 13px; color: #475569; display: block; margin-bottom: 3px;">Oportunidades de Mejora:</strong>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #475569;">${opsList}</ul>
        </div>
        
        <div>
          <strong style="font-size: 13px; color: #1e3a8a; display: block; margin-bottom: 3px;">Software Sugerido (iWEB):</strong>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">${softList}</ul>
        </div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reporte de Oportunidades iWEB</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px; -webkit-font-smoothing: antialiased;">
      <div style="max-width: 700px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); overflow: hidden; border: 1px solid #e2e8f0;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 30px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">iWEB Marketing Agent</h1>
          <p style="margin: 5px 0 0 0; font-size: 14px; opacity: 0.9;">Reporte de Generación de Leads del ${dateStr}</p>
        </div>
        
        <!-- Contenido principal -->
        <div style="padding: 30px;">
          
          <!-- Tarjeta de Métricas -->
          <div style="display: flex; background-color: #f8fafc; border-radius: 6px; padding: 15px; margin-bottom: 25px; border: 1px solid #e2e8f0; justify-content: space-around; text-align: center;">
            <div style="flex: 1;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block;">Leads Procesados</span>
              <strong style="font-size: 22px; color: #1e3a8a; display: block; margin-top: 5px;">${totalLeads}</strong>
            </div>
            <div style="flex: 1; border-left: 1px solid #cbd5e1; border-right: 1px solid #cbd5e1;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block;">Score Promedio</span>
              <strong style="font-size: 22px; color: #1e3a8a; display: block; margin-top: 5px;">${avgScore}/100</strong>
            </div>
            <div style="flex: 1;">
              <span style="font-size: 12px; color: #64748b; text-transform: uppercase; font-weight: 600; display: block;">Alta Prioridad (Score ≥ 70)</span>
              <strong style="font-size: 22px; color: #ef4444; display: block; margin-top: 5px;">${topLeads.length}</strong>
            </div>
          </div>

          <!-- Listado General -->
          <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-top: 0; margin-bottom: 15px;">📋 Listado General</h3>
          
          ${totalLeads > 0 ? `
            <div style="overflow-x: auto; margin-bottom: 30px;">
              <table style="width: 100%; border-collapse: collapse; text-align: left; font-size: 14px;">
                <thead>
                  <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1;">
                    <th style="padding: 10px 15px; color: #475569; font-weight: 600;">Empresa</th>
                    <th style="padding: 10px 15px; color: #475569; font-weight: 600;">Categoría</th>
                    <th style="padding: 10px 15px; color: #475569; font-weight: 600;">Web</th>
                    <th style="padding: 10px 15px; color: #475569; font-weight: 600;">Email</th>
                    <th style="padding: 10px 15px; color: #475569; font-weight: 600; text-align: center;">Score</th>
                  </tr>
                </thead>
                <tbody>
                  ${tableRows}
                </tbody>
              </table>
            </div>
          ` : `
            <p style="color: #64748b; font-style: italic; margin-bottom: 30px;">No se descubrieron leads en esta ejecución.</p>
          `}

          <!-- Oportunidades Clave -->
          ${topLeads.length > 0 ? `
            <h3 style="color: #1e293b; border-bottom: 2px solid #f1f5f9; padding-bottom: 8px; margin-bottom: 15px;">💡 Análisis de Oportunidades Clave</h3>
            ${opportunitiesDetails}
          ` : ''}

        </div>
        
        <!-- Footer -->
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
          <p style="margin: 0 0 5px 0;">Este email fue enviado automáticamente por tu Agente de Ventas iWEB.</p>
          <p style="margin: 0;">&copy; 2026 iWEB Software Services. Todos los derechos reservados.</p>
        </div>
        
      </div>
    </body>
    </html>
  `;
}
