import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { CarService } from '../car.service';
import { CarEntity } from '../car.entity';
import { CreateCarDto } from '../dto/CreateCar.dto';
import { UpdateCarDto } from '../dto/UpdateCar.dto';

describe('CarService', () => {
  let service: CarService;
  let repo: any;

  const mockCar = {
    id: '1',
    model: 'Fusca',
    plate: 'ABC-1234',
    consumption: 10,
    fixed_cost: 300,
    user: { id: 'user-123' },
  };

  const mockRepo = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const mockUserId = 'user-123';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarService,
        { provide: getRepositoryToken(CarEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CarService>(CarService);
    repo = module.get(getRepositoryToken(CarEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCar', () => {
    it('should create and save a car', async () => {
      const createDto: CreateCarDto = {
        model: 'Fusca',
        plate: 'ABC-1234',
        consumption: 10,
        fixed_cost: 300,
      };

      repo.create.mockReturnValue(mockCar);
      repo.save.mockResolvedValue(mockCar);

      const result = await service.createCar(createDto, mockUserId);

      expect(repo.create).toHaveBeenCalledWith({
        ...createDto,
        user: { id: mockUserId },
      });
      expect(repo.save).toHaveBeenCalledWith(mockCar);
      expect(result).toEqual(mockCar);
    });
  });

  describe('getCar', () => {
    it('should return all cars of a user', async () => {
      repo.find.mockResolvedValue([mockCar]);

      const result = await service.getCar(mockUserId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual([
        {
          id: mockCar.id,
          model: mockCar.model,
          plate: mockCar.plate,
          consumption: mockCar.consumption,
          fixed_cost: mockCar.fixed_cost,
        },
      ]);
    });
  });


  describe('findById', () => {
    it('should return a car if found', async () => {
      repo.findOne.mockResolvedValue(mockCar);

      const result = await service.findById('1', mockUserId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual(mockCar);
    });

    it('should throw NotFoundException if car not found', async () => {
      repo.findOne.mockResolvedValue(undefined);

      await expect(service.findById('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCar', () => {
    it('should throw NotFoundException if car not found', async () => {
      const updateDto: UpdateCarDto = {
        model: 'Gol',
        plate: 'XYZ-9876',
        consumption: 12,
        fixed_cost: 350,
      };

      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());

      await expect(service.updateCar('999', updateDto, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteCar', () => {
    it('should throw NotFoundException if car not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());

      await expect(service.deleteCar('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });
});
