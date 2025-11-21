import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { HttpModule } from '@nestjs/axios';
import { GeocodeApiModule } from 'src/geocodeApi/geocodeApi.module';
import { GasApiModule } from '../gasApi/gasApi.module';
import { EmailSenderModule } from '../email-sender/emailSender.module';
import { BudgetEntity } from './budget.entity';
import { ClientEntity } from '../client/client.entity';
import { DriverEntity } from '../driver/driver.entity';
import { CarEntity } from '../car/car.entity';
import { DriverModule } from '../driver/driver.module';
import { ClientModule } from '../client/client.module';
import { CarModule } from '../car/car.module';
import { UserEntity } from '..//User/user.entity';
import { AuthModule } from '..//auth/auth.module';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([BudgetEntity, ClientEntity, DriverEntity, CarEntity, UserEntity]),
    GeocodeApiModule,
    GasApiModule,
    EmailSenderModule,
    DriverModule,
    ClientModule,
    CarModule,
    forwardRef(() => AuthModule),
    CacheModule.register({
      ttl: 60 * 10,
      max: 100,
    })
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule { }
