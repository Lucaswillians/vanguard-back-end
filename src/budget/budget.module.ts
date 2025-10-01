import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BudgetController } from './budget.controller';
import { BudgetService } from './budget.service';
import { HttpModule } from '@nestjs/axios';
import { GeocodeApiModule } from 'src/geocodeApi/geocodeApi.module';
import { GasApiModule } from 'src/gasApi/gasApi.module';
import { EmailSenderModule } from 'src/email-sender/emailSender.module';
import { BudgetEntity } from './budget.entity';
import { ClientEntity } from 'src/client/client.entity';
import { DriverEntity } from 'src/driver/driver.entity';
import { CarEntity } from 'src/car/car.entity';

@Module({
  imports: [
    HttpModule,
    TypeOrmModule.forFeature([BudgetEntity, ClientEntity, DriverEntity, CarEntity]),
    GeocodeApiModule,
    GasApiModule,
    EmailSenderModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule { }
