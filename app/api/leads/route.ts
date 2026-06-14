import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const leadsDir = path.join(process.cwd(), 'leads');

  try {
    if (!fs.existsSync(leadsDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(leadsDir)
      .filter(file => file.endsWith('.json') && file !== 'historico.json')
      .sort((a, b) => b.localeCompare(a)); // Más recientes primero

    const allLeads = [];

    for (const file of files) {
      const dateStr = file.replace('.json', '');
      const filePath = path.join(leadsDir, file);
      
      try {
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const leads = JSON.parse(fileContent);

        if (Array.isArray(leads)) {
          for (const lead of leads) {
            allLeads.push({
              ...lead,
              date: dateStr,
            });
          }
        }
      } catch (err: any) {
        console.error(`Error al parsear archivo de leads ${file}:`, err.message);
      }
    }

    return NextResponse.json(allLeads);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve leads', message: error.message },
      { status: 500 }
    );
  }
}
