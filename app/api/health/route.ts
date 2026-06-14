import { NextResponse } from 'next/server';

export async function GET() {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const resendConfigured = !!process.env.RESEND_API_KEY;

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    configuration: {
      gemini: geminiConfigured ? 'configured' : 'missing',
      resend: resendConfigured ? 'configured' : 'missing',
      cronSchedule: process.env.CRON_SCHEDULE || '0 8 * * *',
    }
  });
}
