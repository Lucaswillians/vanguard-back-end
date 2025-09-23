import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { DriverEntity } from './driver.entity';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([DriverEntity]),
    // forwardRef(() => AuthModule),
  ],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule { }