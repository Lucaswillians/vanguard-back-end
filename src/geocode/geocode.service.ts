import { Inject, Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class GeocodeService {
  @Inject()
  private readonly http: HttpService

  async getCoordinates(city: string) {
    const emailDeveloper = process.env.EMAIL_DEVELOPER
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`;
    const response = await this.http.axiosRef.get(url, {
      headers: { "User-Agent": `MeuApp/1.0 (${emailDeveloper})` }
    });

    if (!response.data || response.data.length === 0) throw new Error(`Cidade "${city}" não encontrada`);

    const { lat, lon } = response.data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  }
}
