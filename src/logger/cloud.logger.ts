import { LoggerService } from '@nestjs/common';
import axios from 'axios';

export class CloudLogger implements LoggerService {
  private endpoint = 'https://logs.collector.na-01.cloud.solarwinds.com/v1/logs';
  private token = process.env.PAPERTRAIL_TOKEN;
  private context?: string; 

  constructor(context?: string) {
    this.context = context;
  }

  private async sendLog(level: string, message: string) {
    const formattedMessage = this.context
      ? `[${this.context}] ${message}`
      : message;

    try {
      await axios.post(this.endpoint, formattedMessage, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Authorization': `Bearer ${this.token}`,
        },
      });
    }
     catch (err) {
      console.error('Failed to send log to Cloud:', err.message);
    }
  }

  log(message: string) {
    this.sendLog('info', message);
  }

  error(message: string, trace?: string) {
    this.sendLog('error', `${message} - ${trace || ''}`);
  }

  warn(message: string) {
    this.sendLog('warn', message);
  }

  debug(message: string) {
    this.sendLog('debug', message);
  }

  verbose(message: string) {
    this.sendLog('verbose', message);
  }
}
