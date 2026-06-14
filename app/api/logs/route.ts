import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const logFilePath = path.join(process.cwd(), 'logs', 'agent.log');

  try {
    if (!fs.existsSync(logFilePath)) {
      return new NextResponse('No logs generated yet.', {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    // Leer el archivo de log (últimos 50KB para evitar sobrecarga)
    const stats = fs.statSync(logFilePath);
    const size = stats.size;
    const maxReadBytes = 50 * 1024; // 50 KB

    let logData = '';
    if (size > maxReadBytes) {
      const fd = fs.openSync(logFilePath, 'r');
      const buffer = Buffer.alloc(maxReadBytes);
      fs.readSync(fd, buffer, 0, maxReadBytes, size - maxReadBytes);
      fs.closeSync(fd);
      logData = '... [Log truncado - mostrando últimos 50KB] ...\n' + buffer.toString('utf-8');
    } else {
      logData = fs.readFileSync(logFilePath, 'utf-8');
    }

    return new NextResponse(logData, {
      status: 200,
      headers: { 'Content-Type': 'text/plain' },
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to read logs', message: error.message },
      { status: 500 }
    );
  }
}
