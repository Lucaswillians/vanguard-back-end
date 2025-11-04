import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CarEntity } from "./car.entity";
import { CreateCarDto } from "./dto/CreateCar.dto";
import { GetCarDto } from "./dto/GetCar.dto";
import { UpdateCarDto } from "./dto/UpdateCar.dto";

@Injectable()
export class CarService {
  @InjectRepository(CarEntity)
  private readonly carRepository: Repository<CarEntity>;

  async createCar(carData: CreateCarDto, userId: string) {
    try {
      const car = this.carRepository.create({
        ...carData,
        user: { id: userId } as any,
      });
      return await this.carRepository.save(car);
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao criar carro: ${err.message}`);
    }
  }

  async getCar(userId: string) {
    try {
      const cars = await this.carRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      return cars.map(car => new GetCarDto(
        car.id,
        car.model,
        car.plate,
        car.consumption,
        car.fixed_cost
      ));
    } 
    catch (err) {
      throw new BadRequestException(`Erro ao buscar carros: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<CarEntity> {
    try {
      const car = await this.carRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!car) throw new NotFoundException('Carro não encontrado');
      return car;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao buscar carro: ${err.message}`);
    }
  }

  async updateCar(id: string, newData: UpdateCarDto, userId: string) {
    try {
      const car = await this.findById(id, userId);
      if (!car) throw new ForbiddenException('Acesso negado a este carro');
     
      await this.carRepository.update(id, newData);
      return this.findById(id, userId);
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao atualizar carro: ${err.message}`);
    }
  }

  async deleteCar(id: string, userId: string) {
    try {
      const car = await this.findById(id, userId);
      if (!car) throw new ForbiddenException('Acesso negado a este carro');
      
      await this.carRepository.delete(id);
      return { message: 'Carro deletado com sucesso' };
    }
     catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      throw new BadRequestException(`Erro ao deletar carro: ${err.message}`);
    }
  }
}
