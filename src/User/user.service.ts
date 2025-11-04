import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Inject, Injectable, NotFoundException, BadRequestException, forwardRef } from "@nestjs/common";
import { UserEntity } from "./user.entity";
import { AuthService } from "../auth/auth.service";
import { GetUserDto } from "./dto/GetUset.dto";
import { UpdateUserDto } from "./dto/UpdateUser.dto";
import { CreateUserDto } from "./dto/CreateUser.dto";
import { EmailSenderService } from "../email-sender/emailSender.serivce";
import { PasswordResetCodeEntity } from "./passwordResetCode/passwordResetCode.entity";
import { randomBytes } from "crypto";

@Injectable()
export class UserService {
  private static readonly RESET_CODE_TTL_MIN = 15;

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
    try {
      const userEntity = new UserEntity();
      const hashedPassword = await this.authService.hashPassword(userData.password);

      userEntity.username = userData.username;
      userEntity.email = userData.email;
      userEntity.password = hashedPassword;

      return await this.userRepository.save(userEntity);
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao criar usuário: ${err.message}`);
    }
  }

  async getUsers() {
    try {
      const savedUsers = await this.userRepository.find();
      return savedUsers.map(
        (user) => new GetUserDto(user.id, user.username, user.email, user.password)
      );
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao buscar usuários: ${err.message}`);
    }
  }

  async getOneJWTverify(email: string) {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) throw new NotFoundException(`Usuário com email ${email} não encontrado`);
      return new GetUserDto(user.id, user.username, user.email, user.password);
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao buscar usuário: ${err.message}`);
    }
  }

  async getOne(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id } });
      if (!user) throw new NotFoundException(`Usuário com id ${id} não encontrado`);
      return new GetUserDto(user.id, user.username, user.email, user.password);
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao buscar usuário: ${err.message}`);
    }
  }

  async updateUser(id: string, newData: UpdateUserDto) {
    try {
      const user = await this.userRepository.preload({ id, ...newData });
      if (!user) throw new NotFoundException(`Usuário com id ${id} não encontrado`);
      if (newData.password) user.password = await this.authService.hashPassword(newData.password);
      return await this.userRepository.save(user);
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao atualizar usuário: ${err.message}`);
    }
  }

  async deleteUser(id: string) {
    try {
      await this.userRepository.delete(id);
      return { message: 'Usuário deletado com sucesso' };
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao deletar usuário: ${err.message}`);
    }
  }

  private generateCode(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  async requestPasswordReset(email: string) {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) throw new NotFoundException('Usuário não encontrado.');

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
      return { message: 'Código de redefinição enviado para seu e-mail.' };
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao solicitar redefinição de senha: ${err.message}`);
    }
  }

  async validateResetCode(email: string, code: string) {
    try {
      const record = await this.passwordResetRepository.findOne({ where: { email, code } });
      if (!record) throw new NotFoundException('Código inválido ou expirado.');

      const ageMinutes = (Date.now() - record.createdAt.getTime()) / 60000;
      if (ageMinutes > UserService.RESET_CODE_TTL_MIN) {
        await this.passwordResetRepository.delete(record.id);
        throw new NotFoundException('Código expirado.');
      }

      return { valid: true };
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao validar código de redefinição: ${err.message}`);
    }
  }

  async resetPassword(email: string, code: string, newPassword: string) {
    try {
      const record = await this.passwordResetRepository.findOne({ where: { email, code } });
      if (!record) throw new NotFoundException('Código inválido ou expirado.');

      const ageMinutes = (Date.now() - record.createdAt.getTime()) / 60000;
      if (ageMinutes > UserService.RESET_CODE_TTL_MIN) {
        await this.passwordResetRepository.delete(record.id);
        throw new NotFoundException('Código expirado.');
      }

      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) throw new NotFoundException('Usuário não encontrado.');

      user.password = await this.authService.hashPassword(newPassword);
      await this.userRepository.save(user);

      await this.passwordResetRepository.delete(record.id);

      await this.emailSender.sendEmail(email, 'Senha alterada', 'Sua senha foi alterada com sucesso.');
      return { message: 'Senha redefinida com sucesso.' };
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao redefinir senha: ${err.message}`);
    }
  }
}
