import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ClientEntity } from './client.entity';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ClientEntity]),
    // forwardRef(() => AuthModule),
  ],
  controllers: [ClientController],
  providers: [ClientService],
  exports: [ClientService],
})
export class ClientModule { }