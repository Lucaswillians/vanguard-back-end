import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { TwoFactorCodeEntity } from "./twoFactor.entity";
import { TwoFactorService } from "./twoFactor.service";
import { EmailSenderService } from "src/email-sender/emailSender.service";
@Module({
  imports: [TypeOrmModule.forFeature([TwoFactorCodeEntity])],
  providers: [TwoFactorService, EmailSenderService],
  exports: [TwoFactorService],
})
export class TwoFactorModule { }
