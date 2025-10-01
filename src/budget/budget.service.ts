import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from './budget.entity';

import { GeocodeApiService } from '../geocodeApi/geocodeApi.service';
import { GasApiService } from 'src/gasApi/gasApi.service';
import { ClientEntity } from 'src/client/client.entity';
import { DriverEntity } from 'src/driver/driver.entity';
import { CarEntity } from 'src/car/car.entity';
import { CreateBudgetDto } from './dto/CreateBudget.dto';
import { HttpService } from '@nestjs/axios';
import { EmailSenderService } from 'src/email-sender/emailSender.serivce';

@Injectable()
export class BudgetService {
  constructor(
    private readonly geocodeApiService: GeocodeApiService,
    private readonly gasApiService: GasApiService,
    private readonly emailSender: EmailSenderService,
    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
    @InjectRepository(ClientEntity)
    private readonly clientRepository: Repository<ClientEntity>,
    @InjectRepository(DriverEntity)
    private readonly driverRepository: Repository<DriverEntity>,
    @InjectRepository(CarEntity)
    private readonly carRepository: Repository<CarEntity>,
    private readonly http: HttpService,

  ) { }

  // Calcula distância usando Geocode + OSRM
  async calculateDistance(origem: string, destino: string) {
    const origemCoord = await this.geocodeApiService.getCoordinates(origem);
    const destinoCoord = await this.geocodeApiService.getCoordinates(destino);

    const url = `http://router.project-osrm.org/route/v1/driving/${origemCoord.lng},${origemCoord.lat};${destinoCoord.lng},${destinoCoord.lat}?overview=false`;
    const response = await this.http.axiosRef.get(url);
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Não foi possível calcular a distância');
    }

    const distancia = data.routes[0].distance / 1000; // km
    const duracao = Math.round(data.routes[0].duration / 60); // minutos

    return { distancia, duracao };
  }

  // Busca preço do diesel
  async getDieselPrice() {
    return await this.gasApiService.getDieselSC();
  }


  async EmailSender(to: string, subject: string, text: string) {
    return await this.emailSender.sendEmail(to, subject, text);
  }
  
  // Cria orçamento
  async createBudget(budgetDto: CreateBudgetDto) {
    // Valida clientes, driver e carro
    const cliente = await this.clientRepository.findOne({ where: { id: budgetDto.cliente_id.toString() } });
    if (!cliente) throw new NotFoundException('Cliente não encontrado');

    const driver = await this.driverRepository.findOne({ where: { id: budgetDto.driver_id.toString() } });
    if (!driver) throw new NotFoundException('Motorista não encontrado');

    const car = await this.carRepository.findOne({ where: { id: budgetDto.car_id.toString() } });
    if (!car) throw new NotFoundException('Carro não encontrado');

    // Calcula distância
    const { distancia } = await this.calculateDistance(budgetDto.origem, budgetDto.destino);

    // Busca preço do diesel
    const dieselPriceData = await this.getDieselPrice();
    const dieselPrice = dieselPriceData.preco;
    if (isNaN(dieselPrice)) throw new Error('Preço do diesel inválido');

    // Função para validar números
    const safeNumber = (value: number, fallback = 0) => isFinite(value) ? value : fallback;

    // Calcula litros consumidos usando consumo real do carro
    const litrosConsumidos = safeNumber(Number(distancia) / car.consumption, 0);

    // Calcula custo do diesel
    const custoDiesel = safeNumber(litrosConsumidos * dieselPrice, 0);

    // Calcula custo operacional (manutenção, pedágio, motorista, etc.)
    const custoOperacional = safeNumber(distancia * 2, 0); // exemplo: R$2 por km

    // Calcula lucro como porcentagem do custo total (ex: 30%)
    const lucro = safeNumber((custoDiesel + custoOperacional) * 0.3, 0);

    // Valor final da viagem
    const valorViagem = safeNumber(custoDiesel + custoOperacional + lucro, safeNumber(distancia * 8));

    // Cria e salva orçamento
    const budgetEntity = this.budgetRepository.create({
      origem: budgetDto.origem,
      destino: budgetDto.destino,
      data_hora_viagem: budgetDto.data_hora_viagem,
      cliente,
      driver,
      car,
      distancia_total: safeNumber(distancia),
      preco_viagem: valorViagem,
      lucro,
    });

    return this.budgetRepository.save(budgetEntity);
  }


  // Lista todos os orçamentos
  async getBudgets() {
    const budgets = await this.budgetRepository.find({
      relations: ['cliente', 'driver', 'car'],
    });

    return budgets.map(b => ({
      id: b.id,
      origem: b.origem,
      destino: b.destino,
      data_hora_viagem: b.data_hora_viagem,
      cliente: { id: b.cliente.id, name: b.cliente.name },
      driver: { id: b.driver.id, name: b.driver.name },
      car: { id: b.car.id, model: b.car.model },
      distancia_total: b.distancia_total,
      preco_viagem: b.preco_viagem,
      lucro: b.lucro,
      status: b.status,
    }));
  }
}
