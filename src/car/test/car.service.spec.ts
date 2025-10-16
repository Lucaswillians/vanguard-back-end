import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CarEntity } from '../car.entity';
import { CarService } from '../car.service';

describe('CarService', () => {
  let service: CarService;
  let repo: Repository<CarEntity>;

  const mockCar = {
    id: '1',
    model: 'Fusca',
    plate: 'ABC-1234',
    consumption: 12,
    fixed_cost: 100,
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => dto),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CarService,
        { provide: getRepositoryToken(CarEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<CarService>(CarService);
    repo = module.get<Repository<CarEntity>>(getRepositoryToken(CarEntity));
  });

  it('should create a car', async () => {
    mockRepo.save.mockResolvedValue(mockCar);

    const result = await service.createCar({
      model: 'Fusca',
      plate: 'ABC-1234',
      consumption: 12,
      fixed_cost: 100,
    });

    expect(result).toEqual(mockCar);
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      model: 'Fusca',
      plate: 'ABC-1234',
      consumption: 12,
      fixed_cost: 100,
    }));
  });

  it('should return all cars', async () => {
    mockRepo.find.mockResolvedValue([mockCar]);

    const result = await service.getCar();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      id: '1',
      model: 'Fusca',
      plate: 'ABC-1234',
    }));
  });

  it('should find a car by id', async () => {
    mockRepo.findOne.mockResolvedValue(mockCar);

    const result = await service.findById('1');

    expect(result).toEqual(mockCar);
    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should throw error if car not found', async () => {
    mockRepo.findOne.mockResolvedValue(undefined);

    await expect(service.findById('2')).rejects.toThrow('Car not found');
  });

  it('should update a car', async () => {
    mockRepo.update.mockResolvedValue({ affected: 1 });

    const updateData = {
      model: 'Oracle Red Bull Racing Updated',
      consumption: 2.5,
      fixed_cost: 230,  // usar camelCase, conforme o DTO
      plate: '98907',
    };

    await service.updateCar('1', updateData);

    expect(mockRepo.update).toHaveBeenCalledWith('1', {
      model: 'Oracle Red Bull Racing Updated',
      consumption: 2.5,
      fixed_cost: 230,  // o serviço deve mapear fixedCost -> fixed_cost
      plate: '98907',
    });
  });



  it('should delete a car', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });

    await service.deleteCar('1');

    expect(mockRepo.delete).toHaveBeenCalledWith('1');
  });
});
