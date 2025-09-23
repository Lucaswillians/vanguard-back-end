import { Test, TestingModule } from '@nestjs/testing';
import { DriverService } from '../driver.service';
import { CreateDriverDto } from '../dto/CreateDriver.dto';
import { PaymentType } from 'src/enums/PaymentType';

describe('DriverController', () => {
  let controller: DriverController;
  let service: DriverService;

  const mockService = {
    createDriver: jest.fn(),
    getDrivers: jest.fn(),
    updateDriver: jest.fn(),
    deleteDriver: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DriverController],
      providers: [
        { provide: DriverService, useValue: mockService },
      ],
    }).compile();

    controller = module.get<DriverController>(DriverController);
    service = module.get<DriverService>(DriverService);
  });

  it('should create a driver', async () => {
    const dto: CreateDriverDto = {
      name: 'João Silva',
      email: 'joao@example.com',
      cpf: '123.456.789-00',
      paymentType: PaymentType.MONTHLY,
    };

    const mockResult = { id: '1', ...dto };
    mockService.createDriver.mockResolvedValue(mockResult);

    const result = await controller.postDriver(dto);

    expect(result).toEqual({
      user: mockResult,
      message: 'Driver created with success!',
    });
    expect(mockService.createDriver).toHaveBeenCalledWith(dto);
  });

  it('should return all drivers', async () => {
    const mockResult = [{ id: '1', name: 'João Silva', email: 'joao@example.com', cpf: '123.456.789-00', paymentType: PaymentType.MONTHLY }];
    mockService.getDrivers.mockResolvedValue(mockResult);

    const result = await controller.getDrivers();

    expect(result).toEqual(mockResult);
    expect(mockService.getDrivers).toHaveBeenCalled();
  });
});
