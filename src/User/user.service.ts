import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inject, Injectable, NotFoundException, BadRequestException, forwardRef, Logger } from "@nestjs/common";
import { UserEntity } from "./user.entity";
import { AuthService } from "../auth/auth.service";
import { GetUserDto } from "./dto/GetUset.dto";
import { UpdateUserDto } from "./dto/UpdateUser.dto";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { EmailSenderService } from "../email-sender/emailSender.service";
import { PasswordResetCodeEntity } from "./passwordResetCode/passwordResetCode.entity";
import { randomBytes } from "crypto";
import { CloudLogger } from "../logger/cloud.logger";

@Injectable()
export class UserService {
  private static readonly RESET_CODE_TTL_MIN = 15;
  private readonly logger = new (CloudLogger as any)(UserService.name);

  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,

    @InjectRepository(PasswordResetCodeEntity)
    private readonly passwordResetRepository: Repository<PasswordResetCodeEntity>,

    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,

    private readonly emailSender: EmailSenderService,
  ) { }

  async createUser(userData: CreateUserDto) {
    this.logger.log(`Tentando criar usuário: ${userData.email}`);
    try {
      const userEntity = new UserEntity();
      const hashedPassword = await this.authService.hashPassword(userData.password);

      userEntity.username = userData.username;
      userEntity.email = userData.email;
      userEntity.password = hashedPassword;

      const savedUser = await this.userRepository.save(userEntity);
      this.logger.log(`Usuário criado com sucesso: ${savedUser.email}`);
      return savedUser;
    }
    catch (err) {
      this.logger.error(`Erro ao criar usuário: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao criar usuário: ${err.message}`);
    }
  }

  async getUsers() {
    this.logger.log(`Buscando todos os usuários`);
    try {
      const savedUsers = await this.userRepository.find();
      this.logger.log(`Foram encontrados ${savedUsers.length} usuários`);
      return savedUsers.map(
        (user) => new GetUserDto(user.id, user.username, user.email, user.password)
      );
    }
    catch (err) {
      this.logger.error(`Erro ao buscar usuários: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao buscar usuários: ${err.message}`);
    }
  }

  async getOneJWTverify(email: string) {
    this.logger.log(`Verificando usuário por JWT: ${email}`);
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        this.logger.warn(`Usuário não encontrado com email: ${email}`);
        throw new NotFoundException(`Usuário com email ${email} não encontrado`);
      }
      return new GetUserDto(user.id, user.username, user.email, user.password);
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao buscar usuário JWT: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao buscar usuário: ${err.message}`);
    }
  }

  async getOne(id: string) {
    this.logger.log(`Buscando usuário com ID: ${id}`);
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) {
        this.logger.warn(`Usuário não encontrado com ID: ${id}`);
        throw new NotFoundException(`Usuário com id ${id} não encontrado`);
      }
      return new GetUserDto(user.id, user.username, user.email, user.password);
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao buscar usuário: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao buscar usuário: ${err.message}`);
    }
  }

  async updateUser(id: string, newData: UpdateUserDto) {
    this.logger.log(`Atualizando usuário ID: ${id}`);
    try {
      const user = await this.userRepository.preload({ id, ...newData });
      if (!user) {
        this.logger.warn(`Usuário não encontrado para atualização: ${id}`);
        throw new NotFoundException(`Usuário com id ${id} não encontrado`);
      }
      if (newData.password) {
        user.password = await this.authService.hashPassword(newData.password);
        this.logger.log(`Senha do usuário ID ${id} foi atualizada`);
      }
      const updatedUser = await this.userRepository.save(user);
      this.logger.log(`Usuário atualizado com sucesso: ${id}`);
      return updatedUser;
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao atualizar usuário: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar usuário: ${err.message}`);
    }
  }

  async deleteUser(id: string) {
    this.logger.log(`Deletando usuário ID: ${id}`);
    try {
      await this.userRepository.delete(id);
      this.logger.log(`Usuário deletado com sucesso: ${id}`);
      return { message: 'Usuário deletado com sucesso' };
    }
    catch (err) {
      this.logger.error(`Erro ao deletar usuário: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao deletar usuário: ${err.message}`);
    }
  }

  private generateCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async requestPasswordReset(email: string) {
    this.logger.log(`Solicitação de redefinição de senha para: ${email}`);
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        this.logger.warn(`Usuário não encontrado para reset de senha: ${email}`);
        throw new NotFoundException('Usuário não encontrado.');
      }

      const code = this.generateCode();
      const resetRecord = this.passwordResetRepository.create({ email, code });
      await this.passwordResetRepository.save(resetRecord);

      const subject = 'Solicitação de redefinição de senha';
      const text = `
      Usuário: ${user.username} (${user.email})
      Código de autorização: ${code}
      Válido por ${UserService.RESET_CODE_TTL_MIN} minutos.
    `;

      await this.emailSender.sendEmail(user.email, subject, text);
      this.logger.log(`Código de redefinição enviado para ${email}`);
      return { message: 'Código de redefinição enviado para seu e-mail.' };
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao solicitar redefinição de senha: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao solicitar redefinição de senha: ${err.message}`);
    }
  }

  async validateResetCode(email: string, code: string) {
    this.logger.log(`Validando código de reset para: ${email}`);
    try {
      const record = await this.passwordResetRepository.findOne({ where: { email, code } });
      if (!record) {
        this.logger.warn(`Código inválido ou expirado para: ${email}`);
        throw new NotFoundException('Código inválido ou expirado.');
      }

      const ageMinutes = (Date.now() - record.createdAt.getTime()) / 60000;
      if (ageMinutes > UserService.RESET_CODE_TTL_MIN) {
        await this.passwordResetRepository.delete(record.id);
        this.logger.warn(`Código expirado para: ${email}`);
        throw new NotFoundException('Código expirado.');
      }

      this.logger.log(`Código válido para: ${email}`);
      return { valid: true };
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao validar código de redefinição: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao validar código de redefinição: ${err.message}`);
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    this.logger.log(`Resetando senha para: ${email}`);
    try {
      const record = await this.passwordResetRepository.findOne({ where: { email, code } });
      if (!record) {
        this.logger.warn(`Código inválido ou expirado para reset: ${email}`);
        throw new NotFoundException('Código inválido ou expirado.');
      }

      const ageMinutes = (Date.now() - record.createdAt.getTime()) / 60000;
      if (ageMinutes > UserService.RESET_CODE_TTL_MIN) {
        await this.passwordResetRepository.delete(record.id);
        this.logger.warn(`Código expirado para reset de senha: ${email}`);
        throw new NotFoundException('Código expirado.');
      }

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        this.logger.warn(`Usuário não encontrado para reset de senha: ${email}`);
        throw new NotFoundException('Usuário não encontrado.');
      }

      user.password = await this.authService.hashPassword(newPassword);
      await this.userRepository.save(user);
      await this.passwordResetRepository.delete(record.id);

      await this.emailSender.sendEmail(email, 'Senha alterada', 'Sua senha foi alterada com sucesso.');
      this.logger.log(`Senha redefinida com sucesso para: ${email}`);
      return { message: 'Senha redefinida com sucesso.' };
    }
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao redefinir senha: ${err.message}`, err.stack);
      throw new BadRequestException(`Erro ao redefinir senha: ${err.message}`);
    }
  }
}
