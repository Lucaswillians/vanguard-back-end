import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { CarEntity } from "./car.entity";
import { CreateCarDto } from "./dto/CreateCar.dto";
import { GetCarDto } from "./dto/GetCar.dto";
import { UpdateCarDto } from "./dto/UpdateCar.dto";
import { CloudLogger } from "../logger/cloud.logger";

@Injectable()
export class CarService {
  private readonly logger = new (CloudLogger as any)(CarService.name);

  @InjectRepository(CarEntity)
  private readonly carRepository: Repository<CarEntity>;

  async createCar(carData: CreateCarDto, userId: string) {
    this.logger.log(`Criando carro para usuário ${userId}`);
    try {
      const car = this.carRepository.create({
        ...carData,
        user: { id: userId } as any,
      });
      const savedCar = await this.carRepository.save(car);
      this.logger.log(`Carro criado com sucesso: ${savedCar.id}`);
      return savedCar;
    } 
    catch (err) {
      this.logger.error(`Erro ao criar carro para usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao criar carro: ${err.message}`);
    }
  }

  async getCar(userId: string) {
    this.logger.log(`Buscando carros do usuário ${userId}`);
    try {
      const cars = await this.carRepository.find({
        where: { user: { id: userId } },
        relations: ['user'],
      });
      this.logger.log(`Total de carros encontrados: ${cars.length}`);
      return cars.map(car => new GetCarDto(
        car.id,
        car.model,
        car.plate,
        car.consumption,
        car.fixed_cost
      ));
    } 
    catch (err) {
      this.logger.error(`Erro ao buscar carros do usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao buscar carros: ${err.message}`);
    }
  }

  async findById(id: string, userId: string): Promise<CarEntity> {
    this.logger.log(`Buscando carro ${id} do usuário ${userId}`);
    try {
      const car = await this.carRepository.findOne({
        where: { id, user: { id: userId } },
        relations: ['user'],
      });
      if (!car) {
        this.logger.warn(`Carro ${id} não encontrado para usuário ${userId}`);
        throw new NotFoundException('Carro não encontrado');
      }
      return car;
    } 
    catch (err) {
      if (err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao buscar carro ${id}`, err.stack);
      throw new BadRequestException(`Erro ao buscar carro: ${err.message}`);
    }
  }

  async updateCar(id: string, newData: UpdateCarDto, userId: string) {
    this.logger.log(`Atualizando carro ${id} do usuário ${userId}`);
    try {
      const car = await this.findById(id, userId);
      if (!car) {
        this.logger.warn(`Acesso negado ao atualizar carro ${id}`);
        throw new ForbiddenException('Acesso negado a este carro');
      }
      await this.carRepository.update(id, newData);
      const updatedCar = await this.findById(id, userId);
      this.logger.log(`Carro ${id} atualizado com sucesso`);
      return updatedCar;
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao atualizar carro ${id}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar carro: ${err.message}`);
    }
  }

  async deleteCar(id: string, userId: string) {
    this.logger.log(`Deletando carro ${id} do usuário ${userId}`);
    try {
      const car = await this.findById(id, userId);
      if (!car) {
        this.logger.warn(`Acesso negado ao deletar carro ${id}`);
        throw new ForbiddenException('Acesso negado a este carro');
      }
      await this.carRepository.delete(id);
      this.logger.log(`Carro ${id} deletado com sucesso`);
      return { message: 'Carro deletado com sucesso' };
    } 
    catch (err) {
      if (err instanceof ForbiddenException || err instanceof NotFoundException) throw err;
      this.logger.error(`Erro ao deletar carro ${id}`, err.stack);
      throw new BadRequestException(`Erro ao deletar carro: ${err.message}`);
    }
  }
}
