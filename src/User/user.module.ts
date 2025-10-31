import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UserEntity } from './user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PasswordResetCodeEntity } from './passwordResetCode/passwordResetCode.entity';
import { EmailSenderModule } from 'src/email-sender/emailSender.module';


@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, PasswordResetCodeEntity]),
    forwardRef(() => AuthModule),
    EmailSenderModule,
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [UserService],
})
export class UserModule { }