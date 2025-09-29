import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class GasApiService {
  private readonly BASE_URL = 'https://combustivelapi.com.br/api/precos/';

  constructor(private readonly http: HttpService) { }

  async getDieselSC() {
    try {
      const response = await firstValueFrom(this.http.get(this.BASE_URL));

      const precoSC = response?.data?.precos?.diesel?.sc;

      if (!precoSC) {
        throw new Error('Preço do diesel em SC não encontrado');
      }

      return {
        estado: 'SC',
        combustivel: 'Diesel',
        preco: precoSC,
        data_coleta: response.data?.data_coleta,
        fonte: response.data?.fonte,
      };
    } catch (error) {
      console.error('Erro ao buscar preços:', error.message);
      throw new Error('Não foi possível buscar os preços do diesel para SC');
    }
  }
}
