import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GasApiService } from './gasApi.service';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [HttpModule,
    CacheModule.register({
      ttl: 60 * 10, 
      max: 100,
    }),],
  providers: [GasApiService],
  exports: [GasApiService],
})

export class GasApiModule { }
