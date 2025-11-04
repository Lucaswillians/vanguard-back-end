import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { BudgetEntity } from '../budget/budget.entity';
import { UserEntity } from '../User/user.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,

    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
  ) { }

  async createDriver(data: CreateDriverDto, userId: string) {
    try {
      const driver = this.driverRepository.create({
        ...data,
        user: { id: userId } as any,
      });
      return await this.driverRepository.save(driver);
    }
    catch (err) {
      throw new BadRequestException(`Erro ao criar motorista: ${err.message}`);
    }
  }

  async getDrivers(userId: string) {
    try {
      const drivers = await this.driverRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      return drivers;
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao buscar motoristas: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<DriverEntity> {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!driver) throw new NotFoundException('Motorista não encontrado');
      return driver;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao buscar motorista: ${err.message}`);
    }
  }

  async updateDriver(id: string, newData: UpdateDriverDto, userId: string) {
    try {
      const driver = await this.findById(id, userId);
      if (!driver) throw new ForbiddenException('Acesso negado a este motorista');
     
      await this.driverRepository.update(id, newData);
      return this.findById(id, userId);
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao atualizar motorista: ${err.message}`);
    }
  }

  async deleteDriver(id: string, userId: string) {
    try {
      const driver = await this.findById(id, userId);
      if (!driver) throw new ForbiddenException('Acesso negado a este motorista');
      
      await this.driverRepository.delete(id);
      return { message: 'Motorista deletado com sucesso' };
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao deletar motorista: ${err.message}`);
    }
  }

  async getDriverMonthlyRemuneration(driverId: string, month: number, year: number, userId: string) {
    try {
      const driver = await this.driverRepository.findOne({
        where: { id: driverId, user: { id: userId } },
        relations: ['user'],
      });
      if (!driver) throw new NotFoundException('Motorista não encontrado');

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

      if (budgets.length === 0) {
        return {
          driver: driver.name,
          month,
          year,
          totalDays: 0,
          dailyRate: driver.dailyPriceDriver,
          totalRemuneration: 0,
          trips: [],
        };
      }

      const totalDays = budgets.reduce((sum, b) => sum + (b.days_out || 0), 0);
      const totalRemuneration = totalDays * driver.dailyPriceDriver;

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
      throw new BadRequestException(`Erro ao calcular remuneração do motorista: ${err.message}`);
    }
  }
}
