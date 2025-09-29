import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { GeocodeApiService } from './../geocodeApi.service';

describe('GeocodeApiService', () => {
  let service: GeocodeApiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [GeocodeApiService],
    }).compile();

    service = module.get<GeocodeApiService>(GeocodeApiService);
  });

  it('deve retornar as coordenadas de Florianópolis', async () => {
    const city = 'Joinville SC';
    const result = await service.getCoordinates(city);

    expect(result).toHaveProperty('lat');
    expect(result).toHaveProperty('lng');
    expect(typeof result.lat).toBe('number');
    expect(typeof result.lng).toBe('number');
  });

  it('deve lançar erro se a cidade não existir', async () => {
    await expect(service.getCoordinates('CidadeInexistente123')).rejects.toThrow(
      /não encontrada/,
    );
  });
});
