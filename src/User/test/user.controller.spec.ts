import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { UpdateUserDto } from '../dto/UpdateUser.dto';
import { ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '../../auth/auth.guard';

describe('UserController', () => {
  let controller: UserController;
  let mockUserService: any;

  const mockUser = {
    id: '1',
    username: 'JohnDoe',
    email: 'john@example.com',
    password: 'hashedPassword',
  };

  beforeEach(async () => {
    mockUserService = {
      createUser: jest.fn().mockResolvedValue(mockUser),
      getUsers: jest.fn().mockResolvedValue([mockUser]),
      getOne: jest.fn().mockResolvedValue(mockUser),
      updateUser: jest.fn().mockResolvedValue(mockUser),
      deleteUser: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [{ provide: UserService, useValue: mockUserService }],
    })
      .overrideGuard(AuthGuard) // Aqui você sobrescreve o guard
      .useValue({
        canActivate: (context: ExecutionContext) => true, // sempre permite
      })
      .compile();

    controller = module.get<UserController>(UserController);
  });

  it('should create a user', async () => {
    const dto: CreateUserDto = {
      username: 'JohnDoe',
      email: 'john@example.com',
      password: 'hashedPassword',
    };

    const result = await controller.postUser(dto);

    expect(mockUserService.createUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      user: expect.objectContaining({
        id: '1',
        username: 'JohnDoe',
        email: 'john@example.com',
      }),
      message: 'User created with success!',
    });
  });

  it('should get all users', async () => {
    const result = await controller.getUser();

    expect(mockUserService.getUsers).toHaveBeenCalled();
    expect(result).toEqual([mockUser]);
  });

  it('should get one user by id', async () => {
    const result = await controller.findOne('1');

    expect(mockUserService.getOne).toHaveBeenCalledWith('1');
    expect(result).toEqual(mockUser);
  });

  it('should update a user', async () => {
    const dto: UpdateUserDto = { username: 'JaneDoe', email: 'test@gmail.com', password: 'hashedPassword' };

    const result = await controller.updateUsers('1', dto);

    expect(mockUserService.updateUser).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({
      user: mockUser,
      message: 'user updated with success!',
    });
  });

  it('should delete a user', async () => {
    const result = await controller.deleteUsers('1');

    expect(mockUserService.deleteUser).toHaveBeenCalledWith('1');
    expect(result).toEqual({
      user: { affected: 1 },
      message: 'user deleted with success!',
    });
  });
});
