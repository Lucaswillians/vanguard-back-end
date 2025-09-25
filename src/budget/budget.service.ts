import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { GeocodeService } from '../geocode/geocode.service';

@Injectable()
export class BudgetService {
  constructor(
    private readonly geocodeService: GeocodeService,
    private readonly http: HttpService,
  ) { }

  async calculateDistance(origem: string, destino: string) {
    const origemCoord = await this.geocodeService.getCoordinates(origem);
    const destinoCoord = await this.geocodeService.getCoordinates(destino);

    const url = `http://router.project-osrm.org/route/v1/driving/${origemCoord.lng},${origemCoord.lat};${destinoCoord.lng},${destinoCoord.lat}?overview=false`;

    const response = await this.http.axiosRef.get(url);
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Não foi possível calcular a distância');
    }

    const distancia = data.routes[0].distance / 1000; 
    const duracao = Math.round(data.routes[0].duration / 60);

    return {
      origem: origemCoord,
      destino: destinoCoord,
      distancia,
      duracao,
    };
  }
}
