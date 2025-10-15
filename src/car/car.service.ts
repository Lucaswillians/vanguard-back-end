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
    carEntity.consumption = carData.consumption
    carEntity.fixed_cost = carData.fixedCost

    return this.carRepository.save(carEntity)
  }

  async getCar() {
    const savedCar = await this.carRepository.find();
    const carList = savedCar.map((car) => new GetCarDto(car.id, car.model, car.plate, car.consumption, car.fixed_cost));

    return carList;
  }

  async findById(id: string): Promise<CarEntity> {
    const car = await this.carRepository.findOne({ where: { id } });
    if (!car) throw new Error('Car not found'); 
    return car;
  }

  async updateCar(id: string, newData: UpdateCarDto) {
    await this.carRepository.update(id, newData);
  }

  async deleteCar(id: string) {
    await this.carRepository.delete(id);
  }
}