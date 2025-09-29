import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GasApiService } from './gasApi.service';

@Module({
  imports: [HttpModule],
  providers: [GasApiService],
  exports: [GasApiService],
})

export class GasApiModule { }
