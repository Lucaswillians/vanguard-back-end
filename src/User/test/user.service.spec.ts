import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../user.entity';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { NotFoundException } from '@nestjs/common';

describe('UserService', () => {
  let service: UserService;
  let mockRepo: any;
  let mockAuthService: any;

  const mockUser = {
    id: '1',
    username: 'JohnDoe',
    email: 'john@example.com',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    mockRepo = {
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      delete: jest.fn(),
      preload: jest.fn(),
    };

    mockAuthService = {
      hashPassword: jest.fn().mockResolvedValue('hashedPassword'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: getRepositoryToken(UserEntity), useValue: mockRepo },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should create a user', async () => {
    mockRepo.save.mockResolvedValue(mockUser);

    const result = await service.createUser({
      username: 'JohnDoe',
      email: 'john@example.com',
      password: 'hashedPassword',
    });

    expect(mockAuthService.hashPassword).toHaveBeenCalledWith('hashedPassword');
    expect(mockRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      username: 'JohnDoe',
      email: 'john@example.com',
      password: 'hashedPassword',
    }));
    expect(result).toEqual(mockUser);
  });

  it('should return all users', async () => {
    mockRepo.find.mockResolvedValue([mockUser]);

    const result = await service.getUsers();

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({
      id: '1',
      username: 'JohnDoe',
      email: 'john@example.com',
    }));
  });

  it('should get one user by id', async () => {
    mockRepo.findOne.mockResolvedValue(mockUser);

    const result = await service.getOne('1');

    expect(mockRepo.findOne).toHaveBeenCalledWith({ where: { id: '1' } });
    expect(result).toEqual(expect.objectContaining({ id: '1', username: 'JohnDoe' }));
  });

  it('should throw NotFoundException if user not found', async () => {
    mockRepo.findOne.mockResolvedValue(undefined);

    await expect(service.getOne('2')).rejects.toThrow(NotFoundException);
  });

  it('should update a user', async () => {
    const updatedUser = { ...mockUser, username: 'JaneDoe', password: 'hashedPassword' };
    mockRepo.preload.mockResolvedValue(updatedUser);
    mockRepo.save.mockResolvedValue(updatedUser);

    const result = await service.updateUser('1', { username: 'JaneDoe', password: 'hashedPassword', email: 'test@gmail.com' });

    expect(mockAuthService.hashPassword).toHaveBeenCalledWith('hashedPassword');
    expect(mockRepo.preload).toHaveBeenCalledWith(expect.objectContaining({ id: '1', username: 'JaneDoe', password: 'hashedPassword' }));
    expect(mockRepo.save).toHaveBeenCalledWith(updatedUser);
    expect(result).toEqual(updatedUser);
  });

  it('should throw NotFoundException when updating non-existent user', async () => {
    mockRepo.preload.mockResolvedValue(undefined);

    await expect(service.updateUser('2', { username: 'JaneDoe', email: 'test@gmail.com', password: 'hashedPassword' })).rejects.toThrow(NotFoundException);
  });

  it('should delete a user', async () => {
    mockRepo.delete.mockResolvedValue({ affected: 1 });

    const result = await service.deleteUser('1');

    expect(mockRepo.delete).toHaveBeenCalledWith('1');
    expect(result).toEqual({ affected: 1 });
  });
});
