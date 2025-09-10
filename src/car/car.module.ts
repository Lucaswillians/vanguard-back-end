import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CarEntity } from './car.entity';
import { CarController } from './car.controller';
import { CarService } from './car.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([CarEntity]),
    // forwardRef(() => AuthModule),
  ],
  controllers: [CarController],
  providers: [CarService],
  exports: [CarService],
})
export class CarModule { }