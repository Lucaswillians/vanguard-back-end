import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { BudgetService } from '../budget.service';
import { BudgetEntity } from '../budget.entity';
import { GeocodeApiService } from '../../geocodeApi/geocodeApi.service';
import { CarService } from '../../car/car.service';
import { DriverService } from '../../driver/driver.service';
import { GasApiService } from '../../gasApi/gasApi.service';
import { EmailSenderService } from '../../email-sender/emailSender.service';
import { BudgetStatus } from '../../enums/BudgetStatus';

describe('BudgetService', () => {
  let service: BudgetService;
  let httpService: HttpService;
  let budgetRepo: Repository<BudgetEntity>;
  let geocodeService: GeocodeApiService;
  let carService: CarService;
  let driverService: DriverService;
  let gasService: GasApiService;
  let emailService: EmailSenderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BudgetService,
        {
          provide: getRepositoryToken(BudgetEntity),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            remove: jest.fn(),
            createQueryBuilder: jest.fn().mockReturnValue({
              leftJoin: jest.fn().mockReturnThis(),
              where: jest.fn().mockReturnThis(),
              andWhere: jest.fn().mockReturnThis(),
              getOne: jest.fn().mockResolvedValue(null),
            }),
          },
        },
        { provide: GeocodeApiService, useValue: { getCoordinates: jest.fn() } },
        { provide: GasApiService, useValue: { getDieselSC: jest.fn() } },
        { provide: EmailSenderService, useValue: { sendEmail: jest.fn() } },
        { provide: CarService, useValue: { findById: jest.fn() } },
        { provide: DriverService, useValue: { findById: jest.fn() } },
        {
          provide: HttpService,
          useValue: {
            axiosRef: { get: jest.fn() },
          },
        },

        // 👉 **ADICIONE ISTO**
        {
          provide: 'CACHE_MANAGER',
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            del: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BudgetService>(BudgetService);
    httpService = module.get<HttpService>(HttpService);
    budgetRepo = module.get(getRepositoryToken(BudgetEntity));
    geocodeService = module.get(GeocodeApiService);
    carService = module.get(CarService);
    driverService = module.get(DriverService);
    gasService = module.get(GasApiService);
    emailService = module.get(EmailSenderService);
  });


  // ===============================
  // DISTANCE
  // ===============================
  it('deve calcular a distância corretamente', async () => {
    jest.spyOn(geocodeService, 'getCoordinates')
      .mockResolvedValueOnce({ lat: -27.6, lng: -48.5 })
      .mockResolvedValueOnce({ lat: -26.3, lng: -48.8 });

    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({
      data: { routes: [{ distance: 180000, duration: 7200 }] },
    } as any);

    const result = await service.calculateDistance('Florianópolis', 'Joinville');
    expect(result).toEqual({ distance: 180, duracao: 120 });
  });

  it('deve lançar erro se nenhuma rota for encontrada', async () => {
    jest.spyOn(geocodeService, 'getCoordinates')
      .mockResolvedValueOnce({ lat: -27.6, lng: -48.5 })
      .mockResolvedValueOnce({ lat: -26.3, lng: -48.8 });

    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: { routes: [] } } as any);

    await expect(service.calculateDistance('A', 'B')).rejects.toThrow(BadRequestException);
  });

  // ===============================
  // CREATE BUDGET
  // ===============================
  const defaultDto = {
    origem: 'Florianópolis, SC',
    destino: 'Joinville, SC',
    data_hora_viagem: new Date().toISOString(),
    data_hora_viagem_retorno: new Date(Date.now() + 86400000).toISOString(),
    pedagio: 200,
    lucroDesejado: 1000,
    impostoPercent: 0.1,
    custoExtra: 100,
    driver_id: ['1'],
    car_id: '2',
    cliente_id: '3',
  };

  it('deve criar um orçamento com sucesso', async () => {
    jest.spyOn(geocodeService, 'getCoordinates').mockResolvedValueOnce({ lat: -27.6, lng: -48.5 }).mockResolvedValueOnce({ lat: -26.3, lng: -48.8 });
    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: { routes: [{ distance: 100000, duration: 3600 }] } } as any);
    jest.spyOn(carService, 'findById').mockResolvedValue({ consumption: 3.5, fixed_cost: 300 } as any);
    jest.spyOn(driverService, 'findById').mockResolvedValue({ driverCost: 500, dailyPriceDriver: 200, email: 'driver@email.com', name: 'Motorista' } as any);
    jest.spyOn(gasService, 'getDieselSC').mockResolvedValue({ preco: 6.0 } as any);
    (budgetRepo.create as jest.Mock).mockImplementation((data) => data);
    (budgetRepo.save as jest.Mock).mockImplementation((data) => ({ id: '999', ...data }));

    const result = await service.createBudget(defaultDto as any, 'user-123');
    expect(result.id).toBe('999');
    expect(result.trip_price).toBeGreaterThan(0);
  });

  it('deve lançar erro se houver conflito de motorista', async () => {
    (budgetRepo.createQueryBuilder as jest.Mock).mockReturnValueOnce({
      leftJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: 'conflict' }),
    });

    await expect(service.createBudget(defaultDto as any, 'user-123')).rejects.toThrow(ConflictException);
  });

  it('deve lançar erro se driver não existir', async () => {
    jest.spyOn(geocodeService, 'getCoordinates').mockResolvedValueOnce({ lat: -27.6, lng: -48.5 }).mockResolvedValueOnce({ lat: -26.3, lng: -48.8 });
    jest.spyOn(httpService.axiosRef, 'get').mockResolvedValue({ data: { routes: [{ distance: 100000, duration: 3600 }] } } as any);
    jest.spyOn(carService, 'findById').mockResolvedValue({ consumption: 3.5, fixed_cost: 300 } as any);
    jest.spyOn(driverService, 'findById').mockResolvedValue(undefined as any);
    jest.spyOn(gasService, 'getDieselSC').mockResolvedValue({ preco: 6.0 } as any);

    await expect(service.createBudget(defaultDto as any, 'user-123')).rejects.toThrow(BadRequestException);
  });

  // ===============================
  // DELETE BUDGET
  // ===============================
  it('deve deletar um orçamento existente', async () => {
    (budgetRepo.findOne as jest.Mock).mockResolvedValue({ id: '1', user: { id: 'user-123' } });
    (budgetRepo.remove as jest.Mock).mockResolvedValue({});

    const result = await service.deleteBudget('1', 'user-123');
    expect(result).toEqual({ message: 'Orçamento deletado com sucesso' });
  });

  it('deve lançar erro ao tentar deletar orçamento inexistente', async () => {
    (budgetRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.deleteBudget('999', 'user-123')).rejects.toThrow(NotFoundException);
  });

  // ===============================
  // UPDATE BUDGET STATUS
  // ===============================
  it('deve atualizar status e enviar email quando aprovado', async () => {
    (budgetRepo.findOne as jest.Mock).mockResolvedValue({
      id: '1',
      user: { id: 'user-123' },
      driver: [{ id: '1' }],
      origin: 'A',
      destiny: 'B',
      date_hour_trip: new Date(),
      date_hour_return_trip: new Date(),
      days_out: 1,
      status: BudgetStatus.PENDING,
    });
    jest.spyOn(driverService, 'findById').mockResolvedValue({ email: 'driver@email.com', name: 'Motorista' } as any);
    const sendSpy = jest.spyOn(emailService, 'sendEmail').mockResolvedValue(undefined);
    (budgetRepo.save as jest.Mock).mockImplementation((b) => b);

    await service.updateBudgetStatus('1', { status: BudgetStatus.APPROVED }, 'user-123');
    expect(sendSpy).toHaveBeenCalled();
  });

  it('deve lançar NotFoundException ao atualizar status de orçamento inexistente', async () => {
    (budgetRepo.findOne as jest.Mock).mockResolvedValue(null);
    await expect(service.updateBudgetStatus('999', { status: BudgetStatus.APPROVED }, 'user-123')).rejects.toThrow(NotFoundException);
  });
});
