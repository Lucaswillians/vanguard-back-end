import { Test, TestingModule } from '@nestjs/testing';
import { GasApiService } from '../gasApi.service';
import { HttpService } from '@nestjs/axios';
import { of } from 'rxjs';
import { AxiosResponse } from 'axios';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('GasApiService', () => {
  let service: GasApiService;
  let httpService: any;
  let cacheMock: any;

  beforeEach(async () => {
    httpService = {
      get: jest.fn(),
    };

    cacheMock = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GasApiService,
        { provide: HttpService, useValue: httpService },
        { provide: CACHE_MANAGER, useValue: cacheMock },
      ],
    }).compile();

    service = module.get<GasApiService>(GasApiService);
  });

  it('deve retornar o preço do diesel em SC', async () => {
    const mockResponse: AxiosResponse = {
      data: {
        precos: {
          diesel: {
            sc: "5,49"
          }
        },
        data_coleta: "2025-01-01",
        fonte: "ANP"
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {} as any,   // <- resolve o erro do TS
    };

    httpService.get.mockReturnValueOnce(of(mockResponse));

    const result = await service.getDieselSC();

    expect(result).toEqual({
      estado: "SC",
      combustivel: "Diesel",
      preco: 5.49,
      data_coleta: "2025-01-01",
      fonte: "ANP",
    });
  });
});
