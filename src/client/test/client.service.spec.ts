import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { ClientService } from '../client.service';
import { ClientEntity } from '../client.entity';
import { CreateClientDto } from '../dto/CreateClient.dto';
import { UpdateClientDto } from '../dto/UpdateClient.dto';

describe('ClientService', () => {
  let service: ClientService;
  let repo: any;

  const mockClient = {
    id: '1',
    name: 'Cliente 1',
    email: 'cliente@example.com',
    telephone: '123456789',
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
        ClientService,
        { provide: getRepositoryToken(ClientEntity), useValue: mockRepo },
      ],
    }).compile();

    service = module.get<ClientService>(ClientService);
    repo = module.get(getRepositoryToken(ClientEntity));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('postClient', () => {
    it('should create and save a client', async () => {
      const createDto: CreateClientDto = {
        name: 'Cliente 1',
        email: 'cliente@example.com',
        telephone: '123456789',
      };

      repo.create.mockReturnValue(mockClient);
      repo.save.mockResolvedValue(mockClient);

      const result = await service.postClient(createDto, mockUserId);

      expect(repo.create).toHaveBeenCalledWith({
        ...createDto,
        user: { id: mockUserId },
      });
      expect(repo.save).toHaveBeenCalledWith(mockClient);
      expect(result).toEqual(mockClient);
    });
  });

  describe('getClients', () => {
    it('should return all clients for a user', async () => {
      repo.find.mockResolvedValue([mockClient]);

      const result = await service.getClients(mockUserId);

      expect(repo.find).toHaveBeenCalledWith({
        where: { user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual([
        {
          id: '1',
          name: 'Cliente 1',
          email: 'cliente@example.com',
          telephone: '123456789',
        },
      ]);
    });
  });


  describe('findById', () => {
    it('should return a client if found', async () => {
      repo.findOne.mockResolvedValue(mockClient);

      const result = await service.findById('1', mockUserId);

      expect(repo.findOne).toHaveBeenCalledWith({
        where: { id: '1', user: { id: mockUserId } },
        relations: ['user'],
      });
      expect(result).toEqual(mockClient);
    });

    it('should throw NotFoundException if client not found', async () => {
      repo.findOne.mockResolvedValue(undefined);

      await expect(service.findById('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateClient', () => {
    it('should throw NotFoundException if client not found', async () => {
      const updateDto: UpdateClientDto = { name: 'Cliente Atualizado', email: 'updated@example.com', telephone: '987654321' };
      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());

      await expect(service.updateClient('999', updateDto, mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteClient', () => {
    it('should throw NotFoundException if client not found', async () => {
      jest.spyOn(service, 'findById').mockRejectedValueOnce(new NotFoundException());

      await expect(service.deleteClient('999', mockUserId)).rejects.toThrow(NotFoundException);
    });
  });

});
