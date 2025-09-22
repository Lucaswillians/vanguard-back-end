import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from '../../driver/driver.entity';
import { DriverService } from '../driver.service';
import { PaymentType } from '../../enums/PaymentType';

describe('DriverService', () => {
  let service: DriverService;
  let repo: Repository<DriverEntity>;

  const mockDriver = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    cpf: '123.456.789-00',
    paymentType: PaymentType.MONTHLY,
  };

  const mockRepo = {
    create: jest.fn().mockImplementation((dto) => dto), 
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DriverService,
        { provide: getRepositoryToken(DriverEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<DriverService>(DriverService);
    repo = module.get<Repository<DriverEntity>>(getRepositoryToken(DriverEntity));
  });

  it('should create a driver', async () => {
    mockRepo.save.mockResolvedValue(mockDriver);

    const result = await service.createDriver({
      name: 'João Silva',
      email: 'joao@example.com',
      cpf: '123.456.789-00',
      paymentType: PaymentType.MONTHLY,
    });

    expect(result).toEqual(mockDriver);
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      name: 'João Silva',
      email: 'joao@example.com',
      cpf: '123.456.789-00',
      paymentType: 'Mensal',
    }));
  });

  it('should return all drivers', async () => {
    mockRepo.find.mockResolvedValue([mockDriver]);

    const result = await service.getDrivers();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(mockDriver);
  });

  it('should update a driver', async () => {
    mockRepo.update.mockResolvedValue({ affected: 1 });

    await service.updateDriver('1', { name: 'João Updated' });

    expect(mockRepo.update).toHaveBeenCalledWith('1', { name: 'João Updated' });
  });

  it('should delete a driver', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });

    await service.deleteDriver('1');

    expect(mockRepo.delete).toHaveBeenCalledWith('1');
  });
});
