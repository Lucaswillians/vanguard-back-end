import { Inject, Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSenderService {
  private readonly logger = new Logger(EmailSenderService.name);

  @Inject()
  private readonly configService: ConfigService;

  async sendEmail(to: string, subject: string, body: string) {
    this.logger.log(`Preparando para enviar e-mail para: ${to} com assunto: "${subject}"`);

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
      this.logger.log(`E-mail enviado com sucesso para: ${to}`);
    }
    catch (error) {
      this.logger.error(`Erro ao enviar e-mail para: ${to}`, error.stack);
      throw new InternalServerErrorException('Falha ao enviar e-mail');
    }
  }
}
