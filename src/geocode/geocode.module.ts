import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { GeocodeService } from './geocode.service';

@Module({
  imports: [HttpModule],
  providers: [GeocodeService],
  exports: [GeocodeService], 
})

export class GeocodeModule { }
