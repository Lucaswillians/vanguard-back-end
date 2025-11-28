import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { randomBytes } from "crypto";
import { TwoFactorCodeEntity } from "./twoFactor.entity";
import { EmailSenderService } from "src/email-sender/emailSender.service";

@Injectable()
export class TwoFactorService {
  private static readonly CODE_TTL_MIN = 10;

  constructor(
    @InjectRepository(TwoFactorCodeEntity)
    private readonly repo: Repository<TwoFactorCodeEntity>,

    private readonly emailSender: EmailSenderService
  ) { }

  private generateCode(): string {
    return randomBytes(3).toString("hex").toUpperCase();
  }

  async createCode(email: string) {
    const code = this.generateCode();
    const record = this.repo.create({ email, code });
    await this.repo.save(record);

    await this.emailSender.sendEmail(
      email,
      "Seu código de autenticação por dois fatores",
      `Seu código é: ${code}\nVálido por ${TwoFactorService.CODE_TTL_MIN} minutos.`
    );

    return { message: "Código para autenticação enviado para o email" };
  }

  async validateCode(email: string, code: string) {
    const record = await this.repo.findOne({ where: { email, code } });

    if (!record) throw new NotFoundException("Código inválido.");

    const ageMinutes = (Date.now() - record.createdAt.getTime()) / 60000;
    if (ageMinutes > TwoFactorService.CODE_TTL_MIN) {
      await this.repo.delete(record.id);
      throw new NotFoundException("Código expirado.");
    }

    await this.repo.delete(record.id);
    return { valid: true };
  }
}
