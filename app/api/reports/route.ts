import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const reportsDir = path.join(process.cwd(), 'reports');

  try {
    if (!fs.existsSync(reportsDir)) {
      return NextResponse.json([]);
    }

    const files = fs.readdirSync(reportsDir)
      .filter(file => file.endsWith('.md'))
      .sort((a, b) => b.localeCompare(a)); // Más recientes primero

    const reports = [];

    for (const file of files) {
      const dateStr = file.replace('.md', '');
      const filePath = path.join(reportsDir, file);

      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        reports.push({
          date: dateStr,
          fileName: file,
          content: content,
        });
      } catch (err: any) {
        console.error(`Error al leer archivo de reporte ${file}:`, err.message);
      }
    }

    return NextResponse.json(reports);
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to retrieve reports', message: error.message },
      { status: 500 }
    );
  }
}
