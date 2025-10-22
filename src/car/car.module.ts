import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CarEntity } from './car.entity';
import { CarController } from './car.controller';
import { CarService } from './car.service';
import { BudgetEntity } from 'src/budget/budget.entity';
import { UserEntity } from 'src/User/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarEntity, BudgetEntity, UserEntity]),
    forwardRef(() => AuthModule),
  ],
  controllers: [CarController],
  providers: [CarService],
  exports: [CarService],
})
export class CarModule { }