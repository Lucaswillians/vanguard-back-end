import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from '../client.controller';
import { ClientService } from '../client.service';
import { CreateClientDto } from '../dto/CreateClient.dto';
import { UpdateClientDto } from '../dto/UpdateClient.dto';

describe('ClientController', () => {
  let controller: ClientController;
  let service: ClientService;

  const mockService = {
    createClient: jest.fn(),
    getClients: jest.fn(),
    updateClient: jest.fn(),
    deleteClient: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [{ provide: ClientService, useValue: mockService }],
    }).compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);
  });

  it('should create a client', async () => {
    const dto: CreateClientDto = {
      name: 'João Silva',
      email: 'joao@example.com',
      telephone: '11999999999'
    };

    const mockResult = { id: '1', ...dto };
    mockService.createClient.mockResolvedValue(mockResult);

    const result = await controller.postClient(dto);

    expect(result).toEqual({
      user: mockResult,
      message: 'Client created with success!'
    });
    expect(mockService.createClient).toHaveBeenCalledWith(dto);
  });

  it('should return all clients', async () => {
    const mockResult = [{ id: '1', name: 'João Silva', email: 'joao@example.com', telephone: '11999999999' }];
    mockService.getClients.mockResolvedValue(mockResult);

    const result = await controller.getClient();

    expect(result).toEqual(mockResult);
    expect(mockService.getClients).toHaveBeenCalled();
  });

  it('should update a client', async () => {
    const dto: UpdateClientDto = { name: 'test Updated', email: 'test@gmail.com', telephone: '421451515' };
    mockService.updateClient.mockResolvedValue({ id: '1', ...dto });

    const result = await controller.updateClient('1', dto);

    expect(result).toEqual({
      user: { id: '1', ...dto },
      message: 'Client updated with success!'
    });
    expect(mockService.updateClient).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a client', async () => {
    mockService.deleteClient.mockResolvedValue({ id: '1' });

    const result = await controller.deleteClient('1');

    expect(result).toEqual({
      user: { id: '1' },
      message: 'Client deleted with success!'
    });
    expect(mockService.deleteClient).toHaveBeenCalledWith('1');
  });
});
