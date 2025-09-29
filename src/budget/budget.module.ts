import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { BudgetController } from './budget.controller';
import { HttpModule } from '@nestjs/axios';
import { BudgetService } from './budget.service';
import { GeocodeApiModule } from 'src/geocodeApi/geocodeApi.module';
import { GasApiService } from 'src/gasApi/gasApi.service';
import { GasApiModule } from 'src/gasApi/gasApi.module';

@Module({
  imports: [
    // TypeOrmModule.forFeature([CarEntity]),
    // forwardRef(() => AuthModule),
    HttpModule,
    GeocodeApiModule,
    GasApiModule,
  ],
  controllers: [BudgetController],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule { }