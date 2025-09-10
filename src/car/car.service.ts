import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CarEntity } from "./car.entity";
import { CreateCarDto } from "./dto/CreateCar.dto";
import { GetCarDto } from "./dto/GetCar.dto";
import { UpdateCarDto } from "./dto/UpdateCar.dto";

@Injectable()
export class CarService {
  @InjectRepository(CarEntity)
  private readonly carRepository: Repository<CarEntity>

  async createCar(carData: CreateCarDto) {
    const carEntity = new CarEntity()

    carEntity.model = carData.model
    carEntity.plate = carData.plate

    return this.carRepository.save(carEntity)
  }

  async getCar() {
    const savedCar = await this.carRepository.find();
    const carList = savedCar.map((car) => new GetCarDto(car.id, car.model, car.plate));

    return carList;
  }

  async updateCar(id: string, newData: UpdateCarDto) {
    await this.carRepository.update(id, newData);
  }

  async deleteCar(id: string) {
    await this.carRepository.delete(id);
  }
}