import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GasApiService {
  private readonly logger = new Logger(GasApiService.name);
  private readonly BASE_URL = 'https://combustivelapi.com.br/api/precos/';

  constructor(private readonly http: HttpService) { }

  async getDieselSC() {
    this.logger.log('Buscando preço do diesel em SC');

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

      this.logger.log(`Preço do diesel em SC obtido: R$ ${preco.toFixed(2)}`);

      return {
        estado: 'SC',
        combustivel: 'Diesel',
        preco,
        data_coleta: response.data?.data_coleta,
        fonte: response.data?.fonte,
      };
    }
    catch (error) {
      this.logger.error('Erro ao buscar preço do diesel em SC: ' + error.message, error.stack);
      throw new BadRequestException('Não foi possível buscar os preços do diesel para SC');
    }
  }
}
