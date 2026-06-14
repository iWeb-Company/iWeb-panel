import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { analyzeLead } from '../../../../agents/analyzer';

export async function POST(request: Request) {
  try {
    const lead = await request.json();
    if (!lead || !lead.web) {
      return NextResponse.json(
        { error: 'Faltan datos del lead o la URL web.' },
        { status: 400 }
      );
    }

    console.log(`[API Analyze] Iniciando análisis manual a demanda para: ${lead.name} (${lead.web})`);
    
    // Ejecutar el análisis con Gemini
    const analysis = await analyzeLead(lead);
    
    const analyzedLead = {
      ...lead,
      analysis,
    };

    // Si tiene una fecha asignada, actualizarla en el archivo JSON correspondiente
    const dateStr = lead.date;
    if (dateStr) {
      const leadsDir = path.join(process.cwd(), 'leads');
      const filePath = path.join(leadsDir, `${dateStr}.json`);
      
      if (fs.existsSync(filePath)) {
        try {
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const fileLeads = JSON.parse(fileContent);
          
          if (Array.isArray(fileLeads)) {
            const updatedLeads = fileLeads.map((l: any) => {
              if (l.web === lead.web) {
                return {
                  ...l,
                  analysis,
                };
              }
              return l;
            });
            
            fs.writeFileSync(filePath, JSON.stringify(updatedLeads, null, 2), 'utf-8');
            console.log(`[API Analyze] Lead actualizado con éxito en ${filePath}`);
          }
        } catch (fileErr: any) {
          console.error(`[API Analyze] Error actualizando el archivo JSON: ${fileErr.message}`);
        }
      }
    }

    return NextResponse.json(analyzedLead);
  } catch (error: any) {
    console.error('[API Analyze] Error analizando lead de forma manual:', error);
    return NextResponse.json(
      { error: 'Error al analizar el lead', message: error.message },
      { status: 500 }
    );
  }
}
