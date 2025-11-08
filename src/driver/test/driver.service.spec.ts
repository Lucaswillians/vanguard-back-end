import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DriverService } from '../driver.service';
import { DriverEntity } from '../driver.entity';
import { BudgetEntity } from '../../budget/budget.entity';

describe('DriverService', () => {
  let service: DriverService;
  let driverRepo: any;
  let budgetRepo: any;

  const mockUserId = 'user-123';

  const mockDriver = {
    id: '1',
    name: 'Motorista 1',
    email: 'driver@example.com',
    cpf: '123.456.789-00',
    driverCost: 5500,
    dailyPriceDriver: 250,
    user: { id: mockUserId },
  };

  const mockBudget = {
    id: '1',
    origin: 'São Paulo',
    destiny: 'Rio de Janeiro',
    date_hour_trip: new Date(),
    date_hour_return_trip: new Date(),
    total_distance: 500,
    trip_price: 5000,
    days_out: 2,
    driver: { id: '1' },
    user: { id: mockUserId },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        {
          provide: getRepositoryToken(DriverEntity), useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          }
        },
        {
          provide: getRepositoryToken(BudgetEntity), useValue: {
            find: jest.fn(),
          }
        },
      ],
    }).compile();

    service = module.get<DriverService>(DriverService);
    driverRepo = module.get(getRepositoryToken(DriverEntity));
    budgetRepo = module.get(getRepositoryToken(BudgetEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createDriver', () => {
    it('should create and save a driver', async () => {
      const createDto = {
        name: 'Motorista 1',
        email: 'driver@example.com',
        cpf: '123.456.789-00',
        driverCost: 5500,
        dailyPriceDriver: 250
      };

      driverRepo.create.mockReturnValue({ ...createDto, user: { id: mockUserId } });
      driverRepo.save.mockResolvedValue({ ...createDto, id: '1', user: { id: mockUserId } });

      const result = await service.createDriver(createDto, mockUserId);

      expect(driverRepo.create).toHaveBeenCalledWith({ ...createDto, user: { id: mockUserId } });
      expect(driverRepo.save).toHaveBeenCalled();
      expect(result).toEqual({ ...createDto, id: '1', user: { id: mockUserId } });
    });
  });

  describe('getDrivers', () => {
    it('should return all drivers of a user', async () => {
      driverRepo.find.mockResolvedValue([mockDriver]);

      const result = await service.getDrivers(mockUserId);

      expect(driverRepo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual([mockDriver]);
    });
  });

  describe('findById', () => {
    it('should return a driver if found', async () => {
      driverRepo.findOne.mockResolvedValue(mockDriver);

      const result = await service.findById('1', mockUserId);

      expect(driverRepo.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual(mockDriver);
    });

    it('should throw NotFoundException if driver not found', async () => {
      driverRepo.findOne.mockResolvedValue(undefined);

      await expect(service.findById('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateDriver', () => {
    it('should update a driver and return it', async () => {
      const updateDto = { name: 'Motorista Atualizado', cpf: '123.456.789-00' };
      driverRepo.findOne.mockResolvedValueOnce(mockDriver).mockResolvedValueOnce({ ...mockDriver, ...updateDto });
      driverRepo.update.mockResolvedValue({});

      const result = await service.updateDriver('1', updateDto, mockUserId);

      expect(driverRepo.update).toHaveBeenCalledWith('1', updateDto);
      expect(result.name).toBe('Motorista Atualizado');
      expect(result.cpf).toBe('123.456.789-00');
    });

    it('should throw ForbiddenException if driver not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());

      const updateDto = { name: 'Motorista Atualizado', cpf: '123.456.789-00' };
      await expect(service.updateDriver('999', updateDto, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteDriver', () => {
    it('should delete a driver', async () => {
      driverRepo.findOne.mockResolvedValue(mockDriver);
      driverRepo.delete.mockResolvedValue({});

      const result = await service.deleteDriver('1', mockUserId);

      expect(driverRepo.delete).toHaveBeenCalledWith('1');
      expect(result).toEqual({ message: 'Motorista deletado com sucesso' }); // ✅ corrigido
    });

    it('should throw ForbiddenException if driver not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());
      await expect(service.deleteDriver('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });


  describe('getDriverMonthlyRemuneration', () => {
    it('should return remuneration summary with trips', async () => {
      driverRepo.findOne.mockResolvedValue(mockDriver);
      budgetRepo.find.mockResolvedValue([mockBudget]);

      const result = await service.getDriverMonthlyRemuneration('1', 1, 2025, mockUserId);

      expect(result.driver).toBe(mockDriver.name);
      expect(result.totalRemuneration).toBe(mockBudget.days_out * mockDriver.dailyPriceDriver);
      expect(result.trips).toHaveLength(1);
    });

    it('should return zero remuneration if no trips', async () => {
      driverRepo.findOne.mockResolvedValue(mockDriver);
      budgetRepo.find.mockResolvedValue([]);

      const result = await service.getDriverMonthlyRemuneration('1', 1, 2025, mockUserId);

      expect(result.totalRemuneration).toBe(0);
      expect(result.trips).toHaveLength(0);
    });
  });
});
