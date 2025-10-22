import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { BudgetEntity } from '../budget/budget.entity';
import { UserEntity } from 'src/User/user.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,

    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
  ) { }

  async createDriver(data: CreateDriverDto, userId: string) {
    const driver = this.driverRepository.create({
      ...data,
      user: { id: userId } as UserEntity, 
    });

    return await this.driverRepository.save(driver);
  }

  async getDrivers(userId: string) {
    return this.driverRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findById(id: string, userId: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!driver) throw new NotFoundException('Motorista não encontrado');
    return driver;
  }

  async updateDriver(id: string, newData: UpdateDriverDto, userId: string) {
    const driver = await this.findById(id, userId);
    if (!driver) throw new ForbiddenException('Acesso negado a este motorista');

    await this.driverRepository.update(id, newData);
    return this.findById(id, userId);
  }

  async deleteDriver(id: string, userId: string) {
    const driver = await this.findById(id, userId);
    if (!driver) throw new ForbiddenException('Acesso negado a este motorista');

    return this.driverRepository.delete(id);
  }

  async getDriverMonthlyRemuneration(driverId: string, month: number, year: number, userId: string) {
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
}
