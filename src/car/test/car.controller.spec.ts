import { Test, TestingModule } from '@nestjs/testing';
import { CarController } from '../car.controller';
import { CarService } from '../car.service';
import { CreateCarDto } from '../dto/CreateCar.dto';

describe('CarController', () => {
  let controller: CarController;
  let service: CarService;

  const mockService = {
    createCar: jest.fn(),
    getCar: jest.fn(),
    updateCar: jest.fn(),
    deleteCar: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarController],
      providers: [{ provide: CarService, useValue: mockService }],
    }).compile();

    controller = module.get<CarController>(CarController);
    service = module.get<CarService>(CarService);
  });

  it('should create a car', async () => {
    const dto: CreateCarDto = {
      model: 'Fusca',
      plate: 'ABC-1234',
      consumption: 12,
      fixed_cost: 100,
    };

    const mockResult = { id: '1', ...dto, fixed_cost: dto.fixed_cost };
    mockService.createCar.mockResolvedValue(mockResult);

    const result = await controller.postCar(dto);

    expect(result).toEqual({
      user: expect.objectContaining({
        id: '1',
        model: 'Fusca',
        plate: 'ABC-1234',
      }),
      message: 'Car created with success!',
    });

    expect(mockService.createCar).toHaveBeenCalledWith(dto);
  });

  it('should return all cars', async () => {
    const mockResult = [{ id: '1', model: 'Fusca', plate: 'ABC-1234', consumption: 12, fixed_cost: 100 }];
    mockService.getCar.mockResolvedValue(mockResult);

    const result = await controller.getCar();

    expect(result).toEqual(mockResult);
    expect(mockService.getCar).toHaveBeenCalled();
  });
});
