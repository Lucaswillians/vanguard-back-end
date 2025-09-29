import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailSenderService } from './emailSender.serivce';

@Module({
  imports: [ConfigModule],
  providers: [EmailSenderService],
  exports: [EmailSenderService],
})

export class EmailSenderModule { }
