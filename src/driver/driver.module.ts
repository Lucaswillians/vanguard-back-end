import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DriverEntity } from './driver.entity';
import { BudgetEntity } from '../budget/budget.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { AuthModule } from '../auth/auth.module'; 
import { UserEntity } from '../User/user.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity, BudgetEntity, UserEntity]),
    forwardRef(() => AuthModule), 
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule { }
