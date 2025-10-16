import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';
import { BudgetEntity } from 'src/budget/budget.entity';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,

    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
  ) { }

 async createDriver(data: CreateDriverDto) {
  const driver = this.driverRepository.create(data);
  return this.driverRepository.save(driver);
}

  async getDrivers() {
    return this.driverRepository.find();
  }

  async findById(id: string): Promise<DriverEntity> {
    const driver = await this.driverRepository.findOne({ where: { id } });
    if (!driver) throw new Error('Driver not found');
    return driver;
  }

  async updateDriver(id: string, newData: UpdateDriverDto) {
    return this.driverRepository.update(id, newData);
  }

  async deleteDriver(id: string) {
    return this.driverRepository.delete(id);
  }

  async getDriverMonthlyRemuneration(driverId: string, month: number, year: number) {
    const driver = await this.driverRepository.findOne({ where: { id: driverId } });
    if (!driver) throw new Error('Motorista não encontrado');

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const budgets = await this.budgetRepository.find({
      where: {
        driver_id: driverId,
        date_hour_trip: Between(startDate, endDate),
      },
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
      trips: budgets.map(b => ({
        origin: b.origin,
        destiny: b.destiny,
        days_out: b.days_out,
        date_hour_trip: b.date_hour_trip,
        trip_price: b.trip_price,
      })),
    };
  }
}