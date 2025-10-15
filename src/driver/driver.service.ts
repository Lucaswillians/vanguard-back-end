import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DriverEntity } from './driver.entity';
import { CreateDriverDto } from './dto/CreateDriver.dto';
import { UpdateDriverDto } from './dto/UpdateDriver.dto';

@Injectable()
export class DriverService {
  constructor(
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
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
}
