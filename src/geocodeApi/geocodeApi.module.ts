import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodeApiService } from './geocodeApi.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [HttpModule, CacheModule.register({
    ttl: 60 * 10,
    max: 100,
  }),],
  providers: [GeocodeApiService],
  exports: [GeocodeApiService],
})

export class GeocodeApiModule { }
