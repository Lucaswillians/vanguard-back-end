import { Test, TestingModule } from '@nestjs/testing';
import { CarController } from '../car.controller';
import { CarService } from '../car.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateCarDto } from '../dto/CreateCar.dto';
import { UpdateCarDto } from '../dto/UpdateCar.dto';

describe('CarController', () => {
  let controller: CarController;
  let service: CarService;

  const mockCarService = {
    createCar: jest.fn().mockResolvedValue({ id: '1', modelo: 'Fusca' }),
    getCar: jest.fn().mockResolvedValue([{ id: '1', modelo: 'Gol' }]),
    updateCar: jest.fn().mockResolvedValue({ id: '1', modelo: 'Fiesta' }),
    deleteCar: jest.fn().mockResolvedValue({ id: '1', deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CarController],
      providers: [
        { provide: CarService, useValue: mockCarService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<CarController>(CarController);
    service = module.get<CarService>(CarService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve criar um carro', async () => {
    const dto: CreateCarDto = { modelo: 'Fusca', placa: 'ABC-1234' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.postCar(dto, req);
    expect(result).toEqual({
      car: { id: '1', modelo: 'Fusca' },
      message: 'Driver created with success!',
    });
    expect(service.createCar).toHaveBeenCalledWith(dto, 1);
  });

  it('deve retornar os carros do usuário', async () => {
    const req = { user: { sub: 1 } } as any;
    const result = await controller.getCar(req);
    expect(result).toEqual([{ id: '1', modelo: 'Gol' }]);
    expect(service.getCar).toHaveBeenCalledWith(1);
  });

  it('deve atualizar um carro', async () => {
    const dto: UpdateCarDto = { modelo: 'Fiesta' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.updateCar('1', dto, req);
    expect(result).toEqual({
      car: { id: '1', modelo: 'Fiesta' },
      message: 'Driver updated with success!',
    });
    expect(service.updateCar).toHaveBeenCalledWith('1', dto, 1);
  });

  it('deve deletar um carro', async () => {
    const req = { user: { sub: 1 } } as any;

    const result = await controller.deleteDriver('1', req);
    expect(result).toEqual({
      car: { id: '1', deleted: true },
      message: 'Driver deleted with success!',
    });
    expect(service.deleteCar).toHaveBeenCalledWith('1', 1);
  });
});
