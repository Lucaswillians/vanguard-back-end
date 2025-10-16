import { Test, TestingModule } from '@nestjs/testing';
import { BudgetController } from '../budget.controller';
import { BudgetService } from '../budget.service';
import { CreateBudgetDto } from '../dto/CreateBudget.dto';
import { UpdateBudgetDto } from '../dto/UpdateBudget.dto';
import { BudgetStatus } from '../../enums/BudgetStatus';

describe('BudgetController', () => {
  let controller: BudgetController;
  let service: BudgetService;

  const mockService = {
    createBudget: jest.fn(),
    getAllBudgets: jest.fn(),
    getAllTrips: jest.fn(),
    updateBudget: jest.fn(),
    createBudgetMock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BudgetController],
      providers: [{ provide: BudgetService, useValue: mockService }],
    }).compile();

    controller = module.get<BudgetController>(BudgetController);
    service = module.get<BudgetService>(BudgetService);
  });

  it('should create a budget', async () => {
    const dto: CreateBudgetDto = {
      origem: 'SP',
      destino: 'RJ',
      data_hora_viagem: new Date(),
      data_hora_viagem_retorno: new Date(),
      diasFora: 4,
      pedagio: 200,
      lucroDesejado: 4000,
      impostoPercent: 9,
      numMotoristas: 2,
      custoExtra: 100,
      budgetStatus: BudgetStatus.PENDING,
      cliente_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      driver_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
      car_id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
    };

    const mockBudget = { id: '1', ...dto };
    mockService.createBudget.mockResolvedValue(mockBudget);

    const result = await controller.create(dto);

    expect(result).toEqual(mockBudget);
    expect(mockService.createBudget).toHaveBeenCalledWith(dto);
  });

  it('should get all budgets', async () => {
    const mockBudgets = [{ id: '1' }];
    mockService.getAllBudgets.mockResolvedValue(mockBudgets);

    const result = await controller.getAllBudgets();
    expect(result).toEqual(mockBudgets);
  });

  it('should get all trips', async () => {
    const mockTrips = [{ id: '1' }];
    mockService.getAllTrips.mockResolvedValue(mockTrips);

    const result = await controller.getAllTrips();
    expect(result).toEqual(mockTrips);
  });

  it('should update a budget', async () => {
    const updateDto: UpdateBudgetDto = { origem: 'SP Updated' };
    const mockUpdated = { id: '1', origem: 'SP Updated' };
    mockService.updateBudget.mockResolvedValue(mockUpdated);

    const result = await controller.updateBudget('1', updateDto);

    expect(result).toEqual({ message: 'Budget updated successfully!', data: mockUpdated });
    expect(mockService.updateBudget).toHaveBeenCalledWith('1', updateDto);
  });

  it('should return mock budget', async () => {
    mockService.createBudgetMock.mockResolvedValue({ valorTotal: 5000 });

    const result = await controller.getMockBudget();

    expect(result).toHaveProperty('valorTotal', 5000);
  });
});
