import { Test, TestingModule } from '@nestjs/testing';
import { GeocodeApiService } from './../geocodeApi.service';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse, AxiosHeaders } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('GeocodeApiService', () => {
  let service: GeocodeApiService;
  let httpService: any;
  let cacheMock: any;

  beforeEach(async () => {
    httpService = {
      axiosRef: {
        get: jest.fn(),    // <- mock REAL
      }
    };

    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodeApiService,
        { provide: HttpService, useValue: httpService },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<GeocodeApiService>(GeocodeApiService);
  });

  it('deve retornar as coordenadas de Florianópolis', async () => {
    const mockResponse: AxiosResponse = {
      data: [{ lat: "-27.5945", lon: "-48.5477" }],
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() }
    };

    httpService.axiosRef.get.mockResolvedValueOnce(mockResponse);

    const result = await service.getCoordinates('Florianópolis');

    expect(result).toEqual({
      lat: -27.5945,
      lng: -48.5477,
    });
  });

  it('deve lançar erro se a cidade não existir', async () => {
    const mockResponse: AxiosResponse = {
      data: [],
      status: 200,
      statusText: 'OK',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() }
    };

    httpService.axiosRef.get.mockResolvedValueOnce(mockResponse);

    await expect(service.getCoordinates('CidadeInexistente123'))
      .rejects.toThrow('Cidade "CidadeInexistente123" não encontrada');
  });
});
