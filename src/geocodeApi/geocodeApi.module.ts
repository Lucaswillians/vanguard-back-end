import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodeApiService } from './geocodeApi.service';

@Module({
  imports: [HttpModule],
  providers: [GeocodeApiService],
  exports: [GeocodeApiService],
})

export class GeocodeApiModule { }
