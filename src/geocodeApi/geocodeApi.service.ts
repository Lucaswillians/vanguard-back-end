import {
  Inject,
  Injectable,
  BadRequestException,
  UseInterceptors
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { CloudLogger } from '../logger/cloud.logger';
import { CacheInterceptor, CacheTTL, CacheKey, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@UseInterceptors(CacheInterceptor)
@Injectable()
export class GeocodeApiService {
  private readonly logger = new (CloudLogger as any)(GeocodeApiService.name);
  private readonly TTL = 60 * 10;

  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) { }

  @CacheKey('geocode-city')
  @CacheTTL(60 * 10)
  async getCoordinates(city: string) {
    this.logger.log(`Buscando coordenadas para a cidade: ${city}`);

    const cacheKey = `geocode-${city.toLowerCase()}`;
    const cached = await this.cache.get(cacheKey) as any;

    if (cached) {
      this.logger.log(`Coordenadas de "${city}" retornadas pelo CACHE`);
      return cached;
    }

    try {
      const emailDeveloper = process.env.EMAIL_DEVELOPER;
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;

      const response = await this.http.axiosRef.get(url, {
        headers: { "User-Agent": `MeuApp/1.0 (${emailDeveloper})` }
      });

      if (!response.data || response.data.length === 0) {
        this.logger.warn(`Cidade "${city}" não encontrada`);
        throw new BadRequestException(`Cidade "${city}" não encontrada`);
      }

      const { lat, lon } = response.data[0];
      const coordinates = {
        lat: parseFloat(lat),
        lng: parseFloat(lon)
      };

      this.logger.log(`Coordenadas obtidas para ${city}: lat=${coordinates.lat}, lng=${coordinates.lng}`);

      await this.cache.set(cacheKey, coordinates, this.TTL * 1000);

      return coordinates;
    }
    catch (err) {
      this.logger.error(`Erro ao buscar coordenadas para ${city}: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao buscar coordenadas para "${city}": ${err.message}`);
    }
  }
}
