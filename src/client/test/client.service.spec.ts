import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ClientEntity } from '../client.entity';
import { ClientService } from '../client.service';
import { CreateClientDto } from '../dto/CreateClient.dto';
import { UpdateClientDto } from '../dto/UpdateClient.dto';
import { GetClientDto } from '../dto/GetClient.dto';

describe('ClientService', () => {
  let service: ClientService;
  let repo: Repository<ClientEntity>;

  const mockClient = {
    id: '1',
    name: 'João Silva',
    email: 'joao@example.com',
    telephone: '11999999999'
  };

  const mockRepo = {
    save: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClientService,
        { provide: getRepositoryToken(ClientEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    repo = module.get<Repository<ClientEntity>>(getRepositoryToken(ClientEntity));
  });

  it('should create a client', async () => {
    mockRepo.save.mockResolvedValue(mockClient);

    const dto: CreateClientDto = {
      name: 'João Silva',
      email: 'joao@example.com',
      telephone: '11999999999'
    };

    const result = await service.createClient(dto);

    expect(result).toEqual(mockClient);
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining(dto));
  });

  it('should return all clients', async () => {
    mockRepo.find.mockResolvedValue([mockClient]);

    const result = await service.getClients();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(new GetClientDto(mockClient.id, mockClient.name, mockClient.email, mockClient.telephone));
  });

  it('should update a client', async () => {
    mockRepo.update.mockResolvedValue({ affected: 1 });

    const dto: UpdateClientDto = { name: 'test Updated', email: 'test@gmail.com', telephone: '421451515' };
    await service.updateClient('1', dto);

    expect(mockRepo.update).toHaveBeenCalledWith('1', dto);
  });

  it('should delete a client', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });

    await service.deleteClient('1');

    expect(mockRepo.delete).toHaveBeenCalledWith('1');
  });
});
