import fs from 'fs';
import path from 'path';

const logsDir = path.join(process.cwd(), 'logs');
const logFile = path.join(logsDir, 'agent.log');

/**
 * Standard Logger that outputs to console and appends to logs/agent.log
 */
export const logger = {
  info(message: string) {
    const formatted = formatMessage('INFO', message);
    console.log(formatted);
    appendToFile(formatted);
  },

  warn(message: string) {
    const formatted = formatMessage('WARN', message);
    console.warn(formatted);
    appendToFile(formatted);
  },

  error(message: string, error?: any) {
    let msg = message;
    if (error) {
      msg += ` | Error: ${error.message || error}`;
      if (error.stack) {
        msg += `\nStack trace:\n${error.stack}`;
      }
    }
    const formatted = formatMessage('ERROR', msg);
    console.error(formatted);
    appendToFile(formatted);
  }
};

function formatMessage(level: string, message: string): string {
  const timestamp = new Date().toISOString();
  return `[${timestamp}] [${level}] ${message}`;
}

function appendToFile(message: string) {
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    fs.appendFileSync(logFile, message + '\n', 'utf-8');
  } catch (err) {
    console.error('Failed to write to log file:', err);
  }
}
