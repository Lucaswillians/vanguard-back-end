import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
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

  async createCar(carData: CreateCarDto, userId: string) {
    const car = this.carRepository.create({
      ...carData,
      user: { id: userId } as CarEntity,
    });

    return await this.carRepository.save(car);
  }

  async getCar(userId: string) {
    return this.carRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async findById(id: string, userId: string): Promise<CarEntity> {
    const car = await this.carRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user'],
    });

    if (!car) throw new NotFoundException('Carro não encontrado');
    return car;
  }

  async updateCar(id: string, newData: UpdateCarDto, userId: string) {
    const car = await this.findById(id, userId);
    if (!car) throw new ForbiddenException('Acesso negado a este carro');

    await this.carRepository.update(id, newData);
    return this.findById(id, userId);
  }

  async deleteCar(id: string, userId: string) {
    const car = await this.findById(id, userId);
    if (!car) throw new ForbiddenException('Acesso negado a este carro');

    return this.carRepository.delete(id);
  }
}