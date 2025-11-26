import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from '../budget.controller';
import { BudgetService } from '../budget.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateBudgetDto } from '../dto/CreateBudget.dto';
import { UpdateBudgetDto } from '../dto/UpdateBudget.dto';
import { UpdateBudgetStatusDto } from '../dto/UpdateBudgetStatus.dto';
import { GasApiService } from '../../gasApi/gasApi.service';

describe('BudgetController', () => {
  let controller: BudgetController;
  let service: BudgetService;

  const mockBudgetService = {
    createBudgetMock: jest.fn().mockResolvedValue({ mock: true }),
    createBudget: jest.fn().mockResolvedValue({ id: '1', name: 'Novo orçamento' }),
    getAllBudgets: jest.fn().mockResolvedValue([{ id: '1', total: 100 }]),
    getAllTrips: jest.fn().mockResolvedValue([{ id: 'trip1', destino: 'SP' }]),
    updateBudget: jest.fn().mockResolvedValue({ id: '1', updated: true }),
    updateBudgetStatus: jest.fn().mockResolvedValue({ id: '1', status: 'Aprovado' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [
        { provide: BudgetService, useValue: mockBudgetService },
        { provide: GasApiService, useValue: { getGasPrice: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<BudgetController>(BudgetController);
    service = module.get<BudgetService>(BudgetService);
  });


  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve ser definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve criar um novo orçamento', async () => {
    const dto: CreateBudgetDto = { nome_cliente: 'João', origem: 'SP', destino: 'RJ' } as any;
    const req = { user: { sub: 1 } };

    const result = await controller.create(dto, req);
    expect(result).toEqual({ id: '1', name: 'Novo orçamento' });
    expect(service.createBudget).toHaveBeenCalledWith(dto, 1);
  });

  it('deve retornar todos os orçamentos do usuário', async () => {
    const req = { user: { sub: 1 } };
    const result = await controller.getAllBudgets(req);
    expect(result).toEqual([{ id: '1', total: 100 }]);
    expect(service.getAllBudgets).toHaveBeenCalledWith(1);
  });

  it('deve retornar todas as viagens do usuário', async () => {
    const req = { user: { sub: 1 } };
    const result = await controller.getAllTrips(req);
    expect(result).toEqual([{ id: 'trip1', destino: 'SP' }]);
    expect(service.getAllTrips).toHaveBeenCalledWith(1);
  });

  it('deve atualizar um orçamento', async () => {
    const dto: UpdateBudgetDto = { valor: 500 } as any;
    const req = { user: { sub: 1 } };

    const result = await controller.updateBudget('1', dto, req);
    expect(result).toEqual({
      message: 'Orçamento atualizado com sucesso!',
      data: { id: '1', updated: true },
    });
    expect(service.updateBudget).toHaveBeenCalledWith('1', dto, 1);
  });

  it('deve atualizar o status de um orçamento', async () => {
    const dto: UpdateBudgetStatusDto = { status: 'Aprovado' } as any;
    const req = { user: { id: 1 } };

    const result = await controller.updateStatus('1', dto, req);
    expect(result).toEqual({ id: '1', status: 'Aprovado' });
    expect(service.updateBudgetStatus).toHaveBeenCalledWith('1', dto, 1);
  });
});
