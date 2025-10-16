import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DriverEntity } from './driver.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { BudgetModule } from 'src/budget/budget.module';
import { BudgetEntity } from '../budget/budget.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity, BudgetEntity]),
    // forwardRef(() => AuthModule),
    // BudgetModule,
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule { }