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
    const driver = new DriverEntity();
    driver.name = data.name;
    driver.email = data.email;
    driver.cpf = data.cpf;
    driver.paymentType = data.paymentType;

    return this.driverRepository.save(driver);
  }

  async getDrivers() {
    return this.driverRepository.find();
  }

  async updateDriver(id: string, newData: UpdateDriverDto) {
    return this.driverRepository.update(id, newData);
  }

  async deleteDriver(id: string) {
    return this.driverRepository.delete(id);
  }
}
