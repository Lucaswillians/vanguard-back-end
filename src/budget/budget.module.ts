import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BudgetController } from './budget.controller';
import { GeocodeService } from 'src/geocode/geocode.service';
import { HttpModule } from '@nestjs/axios';
import { BudgetService } from './budget.service';
import { GeocodeModule } from 'src/geocode/geocode.module';

@Module({
  imports: [
    // TypeOrmModule.forFeature([CarEntity]),
    // forwardRef(() => AuthModule),
    HttpModule,
    GeocodeModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule { }