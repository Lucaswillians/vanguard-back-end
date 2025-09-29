import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSenderService {
  @Inject()
  private configService: ConfigService;

  async sendEmail(to: string, subject: string, body: string) {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASS'),
      },
    });

    const mailOptions = {
      from: this.configService.get<string>('EMAIL_USER'),
      to,
      subject,
      text: body,
    };

    try {
      await transporter.sendMail(mailOptions);
    }
    catch (error) {
      console.error('Erro ao enviar e-mail:', error);
    }
  }
}
