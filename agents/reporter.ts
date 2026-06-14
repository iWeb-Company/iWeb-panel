import fs from 'fs';
import path from 'path';
import { callGeminiText } from '../lib/gemini';
import { AnalyzedLead } from './analyzer';

/**
 * Generates a beautiful Markdown report from analyzed leads and saves it.
 */
export async function generateReport(analyzedLeads: AnalyzedLead[]): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  console.log(`[Reporter] Generando reporte para la fecha: ${today} (${analyzedLeads.length} leads)`);

  if (analyzedLeads.length === 0) {
    const emptyReport = `# Reporte de Oportunidades iWEB - ${today}\n\nNo se descubrieron leads en la ejecución de hoy.`;
    saveReportFile(today, emptyReport);
    return emptyReport;
  }

  // 1. Calcular métricas clave
  const totalLeads = analyzedLeads.length;
  const avgScore = Math.round(
    analyzedLeads.reduce((acc, curr) => acc + curr.analysis.score, 0) / totalLeads
  );
  
  const topLeads = analyzedLeads.filter(l => l.analysis.score >= 70);
  const mediumLeads = analyzedLeads.filter(l => l.analysis.score >= 40 && l.analysis.score < 70);

  // 2. Generar síntesis ejecutiva usando Gemini
  const leadsBriefData = analyzedLeads.map(l => ({
    name: l.name,
    category: l.category,
    score: l.analysis.score,
    description: l.description,
    problems: l.analysis.problemas
  }));

  const synthesisPrompt = `
Actúa como el Director de Operaciones y Ventas de iWEB.
Escribe un resumen ejecutivo breve (de no más de 2 párrafos) y unas conclusiones estratégicas (3 o 4 puntos clave) para el reporte de generación de leads del día de hoy.

Datos de los leads encontrados hoy:
${JSON.stringify(leadsBriefData, null, 2)}

Tu respuesta debe estar redactada en un tono profesional, entusiasta y centrado en negocios.
Devuelve tu respuesta en el siguiente formato (usando tags HTML simulados para separar las partes):

<resumen>
(Aquí escribe el resumen ejecutivo, analizando de forma general el mercado buscado hoy y la calidad de las oportunidades encontradas)
</resumen>

<conclusiones>
- Conclusión clave 1 sobre dónde enfocar el outreach
- Conclusión clave 2 sobre el tipo de software que más se necesita según los leads de hoy
- Conclusión clave 3 sobre los próximos pasos recomendados
</conclusiones>
`;

  let executiveSummary = 'Se realizó la búsqueda diaria de empresas. Se destacan múltiples oportunidades de digitalización.';
  let executiveConclusions = '- Enfocar el outreach en las empresas con mayor score.\n- Preparar demos personalizadas.';

  try {
    const aiSynthesis = await callGeminiText(synthesisPrompt);
    const summaryMatch = aiSynthesis.match(/<resumen>([\s\S]*?)<\/resumen>/);
    const conclusionsMatch = aiSynthesis.match(/<conclusiones>([\s\S]*?)<\/conclusiones>/);

    if (summaryMatch) executiveSummary = summaryMatch[1].trim();
    if (conclusionsMatch) executiveConclusions = conclusionsMatch[1].trim();
  } catch (error: any) {
    console.error('[Reporter] Error generando síntesis con Gemini, usando fallback:', error.message);
  }

  // 3. Construir el cuerpo del reporte en Markdown
  let markdown = `# Reporte Diario de Oportunidades iWEB - ${today}\n\n`;

  // Sección 1: Resumen Ejecutivo
  markdown += `## 📊 Resumen Ejecutivo\n\n`;
  markdown += `${executiveSummary}\n\n`;
  markdown += `### 📈 Métricas del Día\n`;
  markdown += `- **Leads Totales Procesados:** ${totalLeads}\n`;
  markdown += `- **Puntuación de Oportunidad Promedio:** ${avgScore}/100\n`;
  markdown += `- **Oportunidades de Alta Prioridad (Score ≥ 70):** ${topLeads.length}\n`;
  markdown += `- **Oportunidades de Prioridad Media (Score 40-69):** ${mediumLeads.length}\n\n`;

  // Sección 2: Tabla de Leads
  markdown += `## 📋 Listado General de Leads\n\n`;
  markdown += `| Empresa | Categoría | Sitio Web | Email | Teléfono | Score | Prioridad |\n`;
  markdown += `| :--- | :--- | :--- | :--- | :--- | :---: | :---: |\n`;
  
  analyzedLeads.forEach(l => {
    const priority = l.analysis.score >= 70 ? '🔴 Alta' : l.analysis.score >= 40 ? '🟡 Media' : '🟢 Baja';
    const cleanEmail = l.email || '*No disponible*';
    const cleanPhone = l.phone || '*No disponible*';
    markdown += `| **${l.name}** | ${l.category} | [Visitar Web](${l.web}) | ${cleanEmail} | ${cleanPhone} | **${l.analysis.score}** | ${priority} |\n`;
  });
  markdown += `\n`;

  // Sección 3: Top Oportunidades Detalladas
  markdown += `## 💡 Análisis de Oportunidades Clave\n\n`;
  if (topLeads.length === 0) {
    markdown += `*No se detectaron oportunidades de alta prioridad (score ≥ 70) hoy. Se recomienda revisar el listado general.*\n\n`;
  } else {
    topLeads.forEach((l, index) => {
      markdown += `### ${index + 1}. ${l.name} (Score: ${l.analysis.score}/100)\n`;
      markdown += `- **Sitio Web:** [${l.web}](${l.web})\n`;
      if (l.email) markdown += `- **Email:** ${l.email}\n`;
      if (l.phone) markdown += `- **Teléfono:** ${l.phone}\n`;
      markdown += `- **Descripción:** ${l.description || 'Sin descripción'}\n\n`;
      
      markdown += `#### 🔍 Problemas Operativos Detectados:\n`;
      l.analysis.problemas.forEach(p => {
        markdown += `  - ${p}\n`;
      });
      
      markdown += `\n#### ⚡ Oportunidades de Digitalización:\n`;
      l.analysis.oportunidades.forEach(o => {
        markdown += `  - ${o}\n`;
      });
      
      markdown += `\n#### 🛠️ Propuesta de Software Sugerida (iWEB):\n`;
      l.analysis.software_sugerido.forEach(s => {
        markdown += `  - ${s}\n`;
      });

      if (l.analysis.emailDraft) {
        markdown += `\n#### ✉️ Borrador de Email de Venta Sugerido:\n`;
        markdown += `\`\`\`text\n${l.analysis.emailDraft}\n\`\`\`\n`;
      }
      markdown += `\n---\n\n`;
    });
  }

  // Sección 4: Conclusiones
  markdown += `## 🎯 Conclusiones y Próximos Pasos\n\n`;
  markdown += `${executiveConclusions}\n\n`;
  markdown += `---\n*Reporte generado de manera autónoma por el Agente de Marketing iWEB el ${new Date().toLocaleString('es-AR')}.*`;

  // 4. Guardar archivo de reporte
  saveReportFile(today, markdown);

  return markdown;
}

/**
 * Saves a report markdown file in reports/YYYY-MM-DD.md
 */
function saveReportFile(dateStr: string, content: string) {
  const reportsDir = path.join(process.cwd(), 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  const filePath = path.join(reportsDir, `${dateStr}.md`);
  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`[Reporter] Reporte guardado exitosamente en: ${filePath}`);
}
