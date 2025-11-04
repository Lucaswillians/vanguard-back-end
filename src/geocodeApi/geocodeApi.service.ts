import { Inject, Injectable, Logger, BadRequestException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class GeocodeApiService {
  private readonly logger = new Logger(GeocodeApiService.name);

  @Inject()
  private readonly http: HttpService;

  async getCoordinates(city: string) {
    this.logger.log(`Buscando coordenadas para a cidade: ${city}`);
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
      const coordinates = { lat: parseFloat(lat), lng: parseFloat(lon) };
      this.logger.log(`Coordenadas obtidas para ${city}: lat=${coordinates.lat}, lng=${coordinates.lng}`);
      return coordinates;
    } 
    catch (err) {
      this.logger.error(`Erro ao buscar coordenadas para ${city}: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao buscar coordenadas para "${city}": ${err.message}`);
    }
  }
}
