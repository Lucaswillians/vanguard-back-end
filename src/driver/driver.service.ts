import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { BudgetEntity } from '../budget/budget.entity';
import { UserEntity } from '../User/user.entity';

@Injectable()
export class DriverService {
  private readonly logger = new Logger(DriverService.name);

  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,

    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
  ) { }

  async createDriver(data: CreateDriverDto, userId: string) {
    this.logger.log(`Criando motorista para usuário: ${userId}`);
    try {
      const driver = this.driverRepository.create({
        ...data,
        user: { id: userId } as any,
      });
      const savedDriver = await this.driverRepository.save(driver);
      this.logger.log(`Motorista criado com sucesso: ${savedDriver.id}`);
      return savedDriver;
    } 
    catch (err) {
      this.logger.error(`Erro ao criar motorista para usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao criar motorista: ${err.message}`);
    }
  }

  async getDrivers(userId: string) {
    this.logger.log(`Buscando motoristas do usuário: ${userId}`);
    try {
      const drivers = await this.driverRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      this.logger.log(`Total de motoristas encontrados: ${drivers.length}`);
      return drivers;
    } 
    catch (err) {
      this.logger.error(`Erro ao buscar motoristas do usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao buscar motoristas: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<DriverEntity> {
    this.logger.log(`Buscando motorista ${id} do usuário ${userId}`);
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!driver) {
        this.logger.warn(`Motorista ${id} não encontrado para usuário ${userId}`);
        throw new NotFoundException('Motorista não encontrado');
      }
      return driver;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao buscar motorista ${id}`, err.stack);
      throw new BadRequestException(`Erro ao buscar motorista: ${err.message}`);
    }
  }

  async updateDriver(id: string, newData: UpdateDriverDto, userId: string) {
    this.logger.log(`Atualizando motorista ${id} do usuário ${userId}`);
    try {
      const driver = await this.findById(id, userId);
      if (!driver) {
        this.logger.warn(`Acesso negado ao atualizar motorista ${id}`);
        throw new ForbiddenException('Acesso negado a este motorista');
      }

      await this.driverRepository.update(id, newData);
      const updatedDriver = await this.findById(id, userId);
      this.logger.log(`Motorista ${id} atualizado com sucesso`);
      return updatedDriver;
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao atualizar motorista ${id}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar motorista: ${err.message}`);
    }
  }

  async deleteDriver(id: string, userId: string) {
    this.logger.log(`Deletando motorista ${id} do usuário ${userId}`);
    try {
      const driver = await this.findById(id, userId);
      if (!driver) {
        this.logger.warn(`Acesso negado ao deletar motorista ${id}`);
        throw new ForbiddenException('Acesso negado a este motorista');
      }

      await this.driverRepository.delete(id);
      this.logger.log(`Motorista ${id} deletado com sucesso`);
      return { message: 'Motorista deletado com sucesso' };
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao deletar motorista ${id}`, err.stack);
      throw new BadRequestException(`Erro ao deletar motorista: ${err.message}`);
    }
  }

  async getDriverMonthlyRemuneration(driverId: string, month: number, year: number, userId: string) {
    this.logger.log(`Calculando remuneração do motorista ${driverId} para ${month}/${year}`);
    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, user: { id: userId } },
        relations: ['user'],
      });
      if (!driver) {
        this.logger.warn(`Motorista ${driverId} não encontrado`);
        throw new NotFoundException('Motorista não encontrado');
      }

      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);

      const budgets = await this.budgetRepository.find({
        where: {
          driver: { id: driverId },
          user: { id: userId },
          date_hour_trip: Between(startDate, endDate),
        },
        relations: ['driver', 'user'],
      });

      const totalDays = budgets.reduce((sum, b) => sum + (b.days_out || 0), 0);
      const totalRemuneration = totalDays * driver.dailyPriceDriver;

      this.logger.log(`Remuneração calculada: ${totalRemuneration} para ${budgets.length} viagens`);
      return {
        driver: driver.name,
        month,
        year,
        totalDays,
        dailyRate: driver.dailyPriceDriver,
        totalRemuneration,
        trips: budgets.map((b) => ({
          origin: b.origin,
          destiny: b.destiny,
          days_out: b.days_out,
          date_hour_trip: b.date_hour_trip,
          trip_price: b.trip_price,
        })),
      };
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao calcular remuneração do motorista ${driverId}`, err.stack);
      throw new BadRequestException(`Erro ao calcular remuneração do motorista: ${err.message}`);
    }
  }
}
