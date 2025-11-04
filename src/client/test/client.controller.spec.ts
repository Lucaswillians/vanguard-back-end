import { Test, TestingModule } from '@nestjs/testing';
import { ClientController } from '../client.controller';
import { ClientService } from '../client.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateClientDto } from '../dto/CreateClient.dto';
import { UpdateClientDto } from '../dto/UpdateClient.dto';

describe('ClientController', () => {
  let controller: ClientController;
  let service: ClientService;

  const mockClientService = {
    postClient: jest.fn().mockResolvedValue({ id: '1', nome: 'João' }),
    getClients: jest.fn().mockResolvedValue([{ id: '1', nome: 'Maria' }]),
    updateClient: jest.fn().mockResolvedValue({ id: '1', nome: 'Pedro' }),
    deleteClient: jest.fn().mockResolvedValue({ id: '1', deleted: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClientController],
      providers: [
        { provide: ClientService, useValue: mockClientService },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ClientController>(ClientController);
    service = module.get<ClientService>(ClientService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  it('deve criar um cliente', async () => {
    const dto: CreateClientDto = { nome: 'João', email: 'joao@email.com' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.postClient(dto, req);
    expect(result).toEqual({
      client: { id: '1', nome: 'João' },
      message: 'Driver created with success!',
    });
    expect(service.postClient).toHaveBeenCalledWith(dto, 1);
  });

  it('deve retornar todos os clientes', async () => {
    const req = { user: { sub: 1 } } as any;
    const result = await controller.getClients(req);
    expect(result).toEqual([{ id: '1', nome: 'Maria' }]);
    expect(service.getClients).toHaveBeenCalledWith(1);
  });

  it('deve atualizar um cliente', async () => {
    const dto: UpdateClientDto = { nome: 'Pedro' } as any;
    const req = { user: { sub: 1 } } as any;

    const result = await controller.updateDriver('1', dto, req);
    expect(result).toEqual({
      client: { id: '1', nome: 'Pedro' },
      message: 'Driver updated with success!',
    });
    expect(service.updateClient).toHaveBeenCalledWith('1', dto, 1);
  });

  it('deve deletar um cliente', async () => {
    const req = { user: { sub: 1 } } as any;

    const result = await controller.deleteDriver('1', req);
    expect(result).toEqual({
      client: { id: '1', deleted: true },
      message: 'Driver deleted with success!',
    });
    expect(service.deleteClient).toHaveBeenCalledWith('1', 1);
  });
});
