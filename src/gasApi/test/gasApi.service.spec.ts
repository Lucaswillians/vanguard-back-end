import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { GasApiService } from '../gasApi.service';

describe('CombustivelService', () => {
  let service: GasApiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule], 
      providers: [GasApiService],
    }).compile();

    service = module.get<GasApiService>(GasApiService);
  });

  it('deve retornar o preço do diesel em SC', async () => {
    const result = await service.getDieselSC();

    expect(result).toHaveProperty('estado', 'SC');
    expect(result).toHaveProperty('combustivel', 'Diesel');
    expect(result).toHaveProperty('preco');
  });
});
