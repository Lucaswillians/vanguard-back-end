import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from '../user.controller';
import { UserService } from '../user.service';
import { AuthGuard } from '../../auth/auth.guard';
import { CreateUserDto } from '../dto/CreateUser.dto';
import { GetUserDto } from '../dto/GetUset.dto';
import { UpdateUserDto } from '../dto/UpdateUser.dto';
import { RecaptchaService } from '../../auth/recaptcha/recaptcha.service';

describe('UserController', () => {
  let controller: UserController;
  let service: UserService;

  const mockUser = {
    id: '1',
    username: 'testuser',
    email: 'test@example.com',
    password: 'hashed123',
  };

  const mockUserService = {
    createUser: jest.fn().mockResolvedValue(mockUser),
    getUsers: jest.fn().mockResolvedValue([mockUser]),
    getOneJWTverify: jest.fn().mockResolvedValue(mockUser),
    updateUser: jest.fn().mockResolvedValue(mockUser),
    deleteUser: jest.fn().mockResolvedValue(mockUser),
    requestPasswordReset: jest.fn().mockResolvedValue({ success: true }),
    validateResetCode: jest.fn().mockResolvedValue({ valid: true }),
    resetPassword: jest.fn().mockResolvedValue({ success: true }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        { provide: UserService, useValue: mockUserService },
        { provide: RecaptchaService, useValue: { verifyRecaptcha: jest.fn() } },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<UserController>(UserController);
    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // ---------- CRUD ----------
  it('deve criar um usuário', async () => {
    const dto: CreateUserDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: '123456',
    } as any;

    const result = await controller.postUser(dto);

    expect(service.createUser).toHaveBeenCalledWith(dto);
    expect(result).toEqual({
      user: new GetUserDto(mockUser.id, mockUser.username, mockUser.email, mockUser.password),
      message: 'User created with success!',
    });
  });

  it('deve retornar todos os usuários', async () => {
    const result = await controller.getUser();
    expect(result).toEqual([mockUser]);
    expect(service.getUsers).toHaveBeenCalled();
  });

  it('deve retornar o usuário atual (me)', async () => {
    const req = { user: { email: 'test@example.com' } };
    const result = await controller.getMe(req);
    expect(result).toEqual(mockUser);
    expect(service.getOneJWTverify).toHaveBeenCalledWith('test@example.com');
  });

  it('deve atualizar um usuário', async () => {
    const dto: UpdateUserDto = { username: 'novo' } as any;
    const result = await controller.updateUsers('1', dto);

    expect(result).toEqual({
      user: mockUser,
      message: 'user updated with success!',
    });
    expect(service.updateUser).toHaveBeenCalledWith('1', dto);
  });

  it('deve deletar um usuário', async () => {
    const result = await controller.deleteUsers('1');

    expect(result).toEqual({
      user: mockUser,
      message: 'user deleted with success!',
    });
    expect(service.deleteUser).toHaveBeenCalledWith('1');
  });

  // ---------- Recuperação de senha ----------
  it('deve solicitar redefinição de senha', async () => {
    const result = await controller.forgotPassword('test@example.com');
    expect(result).toEqual({ success: true });
    expect(service.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
  });

  it('deve validar código de redefinição de senha', async () => {
    const body = { email: 'test@example.com', code: '1234' };
    const result = await controller.validateCode(body);
    expect(result).toEqual({ valid: true });
    expect(service.validateResetCode).toHaveBeenCalledWith('test@example.com', '1234');
  });

  it('deve redefinir senha', async () => {
    const body = { email: 'test@example.com', code: '1234', newPassword: 'newpass' };
    const result = await controller.resetPassword(body);
    expect(result).toEqual({ success: true });
    expect(service.resetPassword).toHaveBeenCalledWith('test@example.com', '1234', 'newpass');
  });
});
