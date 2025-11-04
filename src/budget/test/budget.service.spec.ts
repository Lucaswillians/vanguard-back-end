import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetService } from '../budget.service';
import { BudgetEntity } from '../budget.entity';
import { CarService } from '../../car/car.service';
import { DriverService } from '../../driver/driver.service';
import { GasApiService } from '../../gasApi/gasApi.service';
import { GeocodeApiService } from '../../geocodeApi/geocodeApi.service';
import { EmailSenderService } from '../../email-sender/emailSender.serivce';
import { HttpService } from '@nestjs/axios';
import { CreateBudgetDto } from '../dto/CreateBudget.dto';
import { BudgetStatus } from '../../enums/BudgetStatus';

describe('BudgetService', () => {
  let service: BudgetService;
  let repo: Repository<BudgetEntity>;

  const mockBudget = {
    id: '1',
    origin: 'São Paulo',
    destiny: 'Rio de Janeiro',
    date_hour_trip: new Date(),
    date_hour_return_trip: new Date(),
    total_distance: 1000,
    trip_price: 5000,
    desired_profit: 4000,
    days_out: 4,
    toll: 200,
    fixed_cost: 300,
    extra_cost: 100,
    number_of_drivers: 2,
    houveLucro: true,
    status: BudgetStatus.PENDING,
    cliente: { id: 1, name: 'Cliente 1' },
    driver: { id: 1, name: 'Motorista 1', email: 'driver@example.com', driverCost: 5500, dailyPriceDriver: 250 },
    car: { id: 1, model: 'Fusca', consumption: 10, fixed_cost: 300 },
  };

  const mockRepo = {
    create: jest.fn().mockImplementation(dto => dto),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockCarService = { findById: jest.fn() };
  const mockDriverService = { findById: jest.fn() };
  const mockGasApiService = { getDieselSC: jest.fn() };
  const mockGeocodeApiService = { getCoordinates: jest.fn() };
  const mockEmailSender = { sendEmail: jest.fn() };
  const mockHttpService = { axiosRef: { get: jest.fn() } };

  const mockUserId = 'user-123'; // ID fictício do usuário para os testes

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        { provide: getRepositoryToken(BudgetEntity), useValue: mockRepo },
        { provide: CarService, useValue: mockCarService },
        { provide: DriverService, useValue: mockDriverService },
        { provide: GasApiService, useValue: mockGasApiService },
        { provide: GeocodeApiService, useValue: mockGeocodeApiService },
        { provide: EmailSenderService, useValue: mockEmailSender },
        { provide: HttpService, useValue: mockHttpService },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    repo = module.get<Repository<BudgetEntity>>(getRepositoryToken(BudgetEntity));
  });

  it('should create a budget', async () => {
    mockGeocodeApiService.getCoordinates.mockResolvedValue({ lat: -23, lng: -46 });
    mockHttpService.axiosRef.get.mockResolvedValue({ data: { routes: [{ distance: 500, duration: 3600 }] } });
    mockCarService.findById.mockResolvedValue({ consumption: 10, fixed_cost: 300 });
    mockDriverService.findById.mockResolvedValue({ driverCost: 5500, dailyPriceDriver: 250, email: 'driver@example.com', name: 'Motorista 1' });
    mockGasApiService.getDieselSC.mockResolvedValue({ preco: 6 });
    mockRepo.create.mockReturnValue(mockBudget);
    mockRepo.save.mockResolvedValue(mockBudget);

    const dto: CreateBudgetDto = {
      origem: 'São Paulo',
      destino: 'Rio de Janeiro',
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

    const result = await service.createBudget(dto, mockUserId);

    expect(result).toHaveProperty('origin', 'São Paulo');
    expect(result).toHaveProperty('valorTotal');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.any(Object));
  });

  it('should get all budgets', async () => {
    mockRepo.find.mockResolvedValue([mockBudget]);

    const result = await service.getAllBudgets(mockUserId);

    expect(result).toHaveLength(1);
    expect(result[0]).toHaveProperty('id', '1');
  });

  it('should update a budget', async () => {
    mockRepo.findOne.mockResolvedValue(mockBudget);
    mockGeocodeApiService.getCoordinates.mockResolvedValue({ lat: -23, lng: -46 });
    mockHttpService.axiosRef.get.mockResolvedValue({ data: { routes: [{ distance: 500, duration: 3600 }] } });
    mockCarService.findById.mockResolvedValue({ consumption: 10, fixed_cost: 300 });
    mockDriverService.findById.mockResolvedValue({ driverCost: 5500, dailyPriceDriver: 250, email: 'driver@example.com', name: 'Motorista 1' });
    mockGasApiService.getDieselSC.mockResolvedValue({ preco: 6 });
    mockRepo.save.mockResolvedValue(mockBudget);

    const updateDto = { origem: 'São Paulo Updated' };

    const result = await service.updateBudget('1', updateDto, mockUserId);

    expect(result).toHaveProperty('origin', 'São Paulo Updated');
    expect(mockRepo.save).toHaveBeenCalled();
    expect(mockEmailSender.sendEmail).toHaveBeenCalled();
  });

  it('should throw if budget not found', async () => {
    mockRepo.findOne.mockResolvedValue(undefined);

    await expect(service.updateBudget('999', {}, mockUserId)).rejects.toThrow('Orçamento não encontrado');
  });
});
