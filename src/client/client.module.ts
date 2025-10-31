import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClientEntity } from './client.entity';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { UserEntity } from '../User/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity, UserEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule { }