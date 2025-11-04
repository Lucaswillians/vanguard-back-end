import { Test, TestingModule } from '@nestjs/testing';
import { DriverController } from '../driver.controller';
import { DriverService } from '../driver.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateDriverDto } from '../dto/CreateDriver.dto';
import { UpdateDriverDto } from '../dto/UpdateDriver.dto';


describe('DriverController', () => {
  let controller: DriverController;
  let service: DriverService;

  const mockDriverService = {
    createDriver: jest.fn().mockResolvedValue({ id: '1', nome: 'João' }),
    getDrivers: jest.fn().mockResolvedValue([{ id: '1', nome: 'Maria' }]),
    updateDriver: jest.fn().mockResolvedValue({ id: '1', nome: 'Pedro' }),
    deleteDriver: jest.fn().mockResolvedValue({ id: '1', deleted: true }),
    getDriverMonthlyRemuneration: jest
      .fn()
      .mockResolvedValue({ id: '1', remuneration: 5000 }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [
        { provide: DriverService, useValue: mockDriverService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<DriverController>(DriverController);
    service = module.get<DriverService>(DriverService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve criar um driver', async () => {
    const dto: CreateDriverDto = { nome: 'João' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.postDriver(dto, req);
    expect(result).toEqual({
      driver: { id: '1', nome: 'João' },
      message: 'Driver created with success!',
    });
    expect(service.createDriver).toHaveBeenCalledWith(dto, 1);
  });

  it('deve retornar todos os drivers', async () => {
    const req = { user: { sub: 1 } } as any;
    const result = await controller.getDrivers(req);
    expect(result).toEqual([{ id: '1', nome: 'Maria' }]);
    expect(service.getDrivers).toHaveBeenCalledWith(1);
  });

  it('deve atualizar um driver', async () => {
    const dto: UpdateDriverDto = { nome: 'Pedro' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.updateDriver('1', dto, req);
    expect(result).toEqual({
      driver: { id: '1', nome: 'Pedro' },
      message: 'Driver updated with success!',
    });
    expect(service.updateDriver).toHaveBeenCalledWith('1', dto, 1);
  });

  it('deve deletar um driver', async () => {
    const req = { user: { sub: 1 } } as any;

    const result = await controller.deleteDriver('1', req);
    expect(result).toEqual({
      driver: { id: '1', deleted: true },
      message: 'Driver deleted with success!',
    });
    expect(service.deleteDriver).toHaveBeenCalledWith('1', 1);
  });

  it('deve retornar a remuneração mensal do driver', async () => {
    const req = { user: { sub: 1 } } as any;

    const result = await controller.getDriverRemuneration('1', 10, 2024, req);
    expect(result).toEqual({ id: '1', remuneration: 5000 });
    expect(service.getDriverMonthlyRemuneration).toHaveBeenCalledWith(
      '1',
      10,
      2024,
      1,
    );
  });
});
