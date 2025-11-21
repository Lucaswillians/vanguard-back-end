import {
  Injectable,
  BadRequestException,
  UseInterceptors,
  Inject
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { CloudLogger } from '../logger/cloud.logger';
import { CacheInterceptor, CacheTTL, CacheKey, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@UseInterceptors(CacheInterceptor)
@Injectable()
export class GasApiService {
  private readonly logger = new (CloudLogger as any)(GasApiService.name);
  private readonly BASE_URL = 'https://combustivelapi.com.br/api/precos/';
  private readonly CACHE_KEY = 'diesel-sc';
  private readonly TTL = 60 * 10;

  constructor(
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private cache: Cache,
  ) { }

  @CacheKey('diesel-sc')
  @CacheTTL(60 * 10)
  async getDieselSC() {
    this.logger.log('Buscando preço do diesel em SC');

    const cached = await this.cache.get(this.CACHE_KEY) as any;
    if (cached) {
      this.logger.log('Preço do diesel retornado pelo CACHE');
      return cached;
    }

    try {
      const response = await firstValueFrom(this.http.get(this.BASE_URL));

      const precoString = response?.data?.precos?.diesel?.sc;

      if (!precoString) {
        this.logger.warn('Preço do diesel em SC não encontrado na resposta da API');
        throw new BadRequestException('Preço do diesel em SC não encontrado');
      }

      const preco = parseFloat(precoString.replace(',', '.'));

      if (isNaN(preco)) {
        this.logger.warn('Preço do diesel em SC inválido: ' + precoString);
        throw new BadRequestException('Preço do diesel em SC inválido');
      }

      this.logger.log(`Preço do diesel em SC obtido (API): R$ ${preco.toFixed(2)}`);

      const result = {
        estado: 'SC',
        combustivel: 'Diesel',
        preco,
        data_coleta: response.data?.data_coleta,
        fonte: response.data?.fonte,
      };

      await this.cache.set(this.CACHE_KEY, result, this.TTL * 1000);

      return result;
    }
    catch (error) {
      this.logger.error(
        'Erro ao buscar preço do diesel em SC: ' + error.message,
        error.stack
      );
      throw new BadRequestException('Não foi possível buscar os preços do diesel para SC');
    }
  }
}
