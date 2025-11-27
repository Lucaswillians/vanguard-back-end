import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger, UseInterceptors, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from './budget.entity';
import { GeocodeApiService } from '../geocodeApi/geocodeApi.service';
import { GasApiService } from '../gasApi/gasApi.service';
import { CreateBudgetDto } from './dto/CreateBudget.dto';
import { HttpService } from '@nestjs/axios';
import { EmailSenderService } from '../email-sender/emailSender.service';
import { CarService } from '../car/car.service';
import { DriverService } from '../driver/driver.service';
import { BudgetStatus } from '../enums/BudgetStatus';
import { GetBudgetDto } from './dto/GetBudget.dto';
import { UpdateBudgetDto } from './dto/UpdateBudget.dto';
import { GetTripDetails } from './dto/GetTripDetails.dto';
import { UpdateBudgetStatusDto } from './dto/UpdateBudgetStatus.dto';
import { calculateBudgetValues } from '../utils/budgetCalculator.util';
import { CloudLogger } from '../logger/cloud.logger';
import { CACHE_MANAGER, CacheInterceptor, CacheKey, CacheTTL } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@UseInterceptors(CacheInterceptor)
@Injectable()
export class BudgetService {
  private readonly logger = new (CloudLogger as any)(BudgetService.name);

  constructor(
    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
    private readonly geocodeApiService: GeocodeApiService,
    private readonly gasApiService: GasApiService,
    private readonly emailSender: EmailSenderService,
    private readonly carApiService: CarService,
    private readonly driverApiService: DriverService,
    private readonly http: HttpService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,

  ) { }

  @CacheTTL(60 * 10)
  async calculateDistance(origem: string, destino: string) {
    this.logger.log(`Calculando distância entre "${origem}" e "${destino}"`);

    const cacheKey = `distance-${origem.toLowerCase()}-${destino.toLowerCase()}`;
    const cached = await this.cache.get(cacheKey) as any;

    if (cached) {
      this.logger.log(`Distância entre "${origem}" e "${destino}" retornada pelo CACHE`);
      return cached;
    }

    try {
      const origemCoord = await this.geocodeApiService.getCoordinates(origem);
      const destinoCoord = await this.geocodeApiService.getCoordinates(destino);

      const url = `http://router.project-osrm.org/route/v1/driving/${origemCoord.lng},${origemCoord.lat};${destinoCoord.lng},${destinoCoord.lat}?overview=false`;
      const response = await this.http.axiosRef.get(url);
      const data = response.data;

      if (!data.routes || data.routes.length === 0) {
        this.logger.warn(`Nenhuma rota encontrada entre "${origem}" e "${destino}"`);
        throw new BadRequestException('Não foi possível calcular a distância entre origem e destino.');
      }

      const distance = data.routes[0].distance / 1000;
      const duracao = Math.round(data.routes[0].duration / 60);

      const safeDistance = Number.isFinite(distance) ? distance : 0;
      const safeDuracao = Number.isFinite(duracao) ? duracao : 0;

      const result = {
        distance: safeDistance,
        duracao: safeDuracao
      };

      this.logger.log(`Distância calculada: ${safeDistance} km, duração: ${safeDuracao} min`);

      await this.cache.set(cacheKey, result, 60 * 10 * 1000);

      return result;
    }
    catch (err) {
      this.logger.error(`Erro ao calcular distância entre "${origem}" e "${destino}"`, err.stack);
      throw new BadRequestException(`Erro ao calcular distância: ${err.message}`);
    }
  }

  async createBudget(dto: CreateBudgetDto, userId: string) {
    this.logger.log(`Criando orçamento para usuário ${userId}`);
    this.logger.log('===== DADOS RECEBIDOS =====', dto);

    const num = (n: any): number => {
      const v = Number(String(n).replace(',', '.'));
      return Number.isFinite(v) ? v : 0;
    };

    const {
      origem,
      destino,
      data_hora_viagem,
      data_hora_viagem_retorno,
      pedagio,
      lucroDesejado,
      impostoPercent,
      custoExtra,
      driver_id,
      car_id,
      cliente_id,
    } = dto;

    const dataIda = new Date(data_hora_viagem);
    const dataVolta = new Date(data_hora_viagem_retorno);

    if (isNaN(dataIda.getTime())) {
      throw new BadRequestException('Data da viagem inválida');
    }
    if (isNaN(dataVolta.getTime())) {
      throw new BadRequestException('Data de retorno inválida');
    }

    const conflictingBudget = await this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoin('budget.driver', 'driver')
      .where('driver.id IN (:...driverIds)', { driverIds: driver_id })
      .andWhere('budget.date_hour_trip <= :dataVolta', { dataVolta })
      .andWhere('budget.date_hour_return_trip >= :dataIda', { dataIda })
      .getOne();

    if (conflictingBudget) {
      this.logger.warn(`Conflito de viagem para motoristas entre ${dataIda} e ${dataVolta}`);
      throw new ConflictException(
        'Um ou mais motoristas selecionados já possuem outra viagem nesse período.',
      );
    }

    try {
      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
      this.logger.log('Dias fora:', diasFora);

      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = num(distance * 2);
      this.logger.log('Distance calculada:', totalDistance);

      const carData = await this.carApiService.findById(car_id, userId);
      const consumption = num(carData.consumption);
      const fixed_cost = num(carData.fixed_cost);

      this.logger.log('Dados do carro sanitizados:', { consumption, fixed_cost });

      const driversData = await Promise.all(
        driver_id.map(id => this.driverApiService.findById(id, userId)),
      );
      this.logger.log('Dados dos motoristas:', driversData);

      const totalDriverCost = num(driversData.reduce((acc, d) => acc + num(d.driverCost), 0));
      const totalDailyPriceDriver = num(driversData.reduce((acc, d) => acc + num(d.dailyPriceDriver), 0));
      const numMotoristas = Math.max(1, driver_id.length);

      const dieselPrice = await this.gasApiService.getDieselSC();
      const diesel = num(dieselPrice?.preco);

      this.logger.log('===== VALORES ANTES DO CÁLCULO =====', {
        totalDistance,
        consumption,
        diesel,
        totalDriverCost,
        totalDailyPriceDriver,
        numMotoristas,
        diasFora,
        pedagio: num(pedagio),
        fixed_cost,
        lucroDesejado: num(lucroDesejado),
        impostoPercent: num(impostoPercent),
        custoExtra: num(custoExtra),
      });

      const calc = calculateBudgetValues({
        totalDistance,
        consumption,
        dieselPrice: diesel,
        driverCost: totalDriverCost,
        dailyPriceDriver: totalDailyPriceDriver,
        numMotoristas,
        diasFora,
        pedagio: num(pedagio),
        fixed_cost,
        lucroDesejado: num(lucroDesejado),
        impostoPercent: num(impostoPercent),
        custoExtra: num(custoExtra),
      });

      this.logger.log('===== RESULTADO DO CÁLCULO =====', calc);

      const budget = this.budgetRepository.create({
        origin: origem,
        destiny: destino,
        date_hour_trip: dataIda,
        date_hour_return_trip: dataVolta,
        total_distance: totalDistance,
        trip_price: num(calc.valorTotal),
        desired_profit: num(lucroDesejado),
        days_out: diasFora,
        toll: num(pedagio),
        fixed_cost,
        extra_cost: num(custoExtra),
        number_of_drivers: numMotoristas,
        houveLucro: !!calc.houveLucro,
        status: BudgetStatus.PENDING,
        cliente: { id: cliente_id },
        driver: driver_id.map(id => ({ id })),
        car: { id: car_id },
        user: { id: userId },
      });

      const savedBudget = await this.budgetRepository.save(budget);
      this.logger.log(`Orçamento criado com sucesso: ID ${savedBudget.id}`);

      return {
        ...savedBudget,
        data_ida: dataIda.toLocaleDateString('pt-BR'),
        hora_ida: dataIda.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        data_retorno: dataVolta.toLocaleDateString('pt-BR'),
        hora_retorno: dataVolta.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        litersConsumed: calc.litersConsumed,
        gasCost: calc.gasCost,
        custoMotoristaMensal: calc.custoMotoristaMensal,
        custoDiaria: calc.custoDiaria,
        subtotal: calc.subtotal,
        imposto: calc.imposto,
        valorTotal: num(calc.valorTotal),
        percentualCombustivel: calc.percentualCombustivel.toFixed(2) + '%',
        houveLucro: !!calc.houveLucro,
        dieselPrice: diesel,
      };
    } catch (err) {
      this.logger.error(`Erro ao criar orçamento para usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao criar orçamento: ${err.message}`);
    }
  }

  async getAllBudgets(userId: string) {
    this.logger.log(`Buscando todos os orçamentos do usuário ${userId}`);

    try {
      const savedBudget = await this.budgetRepository.find({
        where: { user: { id: userId } },
        relations: ['cliente', 'driver', 'car'],
        order: { createdAt: 'DESC' },
      });

      this.logger.log(`Total de orçamentos encontrados: ${savedBudget.length}`);

      return savedBudget.map((budget) => {
        const driverIds = budget.driver?.map((d) => d.id) || [];

        return new GetBudgetDto(
          budget.id,
          budget.origin,
          budget.destiny,
          budget.date_hour_trip,
          budget.date_hour_return_trip,
          budget.cliente?.name || '',
          driverIds,
          budget.car?.model || '',
          budget.total_distance,
          budget.trip_price,
          budget.desired_profit,
          budget.status,
          budget.toll || 0,
          budget.extra_cost
        );
      });
    } catch (err) {
      this.logger.error(`Erro ao buscar orçamentos do usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao buscar orçamentos: ${err.message}`);
    }
  }

  async getAllTrips(userId: string) {
    this.logger.log(`Buscando todas as viagens aprovadas do usuário ${userId}`);

    try {
      const savedBudget = await this.budgetRepository.find({
        where: { user: { id: userId }, status: BudgetStatus.APPROVED },
        relations: ['cliente', 'driver', 'car'],
        order: { updatedAt: 'DESC' },
      });

      this.logger.log(`Total de viagens encontradas: ${savedBudget.length}`);

      return savedBudget.map((budget) => {
        const driverNames = budget.driver?.map((d) => d.name) || [];

        return new GetTripDetails(
          budget.id,
          budget.origin,
          budget.destiny,
          budget.date_hour_trip,
          budget.date_hour_return_trip,
          budget.cliente?.name || '',
          driverNames, 
          budget.car?.model || '',
          budget.total_distance,
        );
      });
    } catch (err) {
      this.logger.error(`Erro ao buscar viagens do usuário ${userId}`, err.stack);
      throw new BadRequestException(`Erro ao buscar viagens: ${err.message}`);
    }
  }

  async updateBudget(id: string, dto: UpdateBudgetDto, userId: string) {
    this.logger.log(`Atualizando orçamento ID ${id} do usuário ${userId}`);

    const budget = await this.budgetRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['cliente', 'driver', 'car', 'user'],
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado ou não pertence a este usuário.');
    }

    try {
      const origem = dto.origem ?? budget.origin;
      const destino = dto.destino ?? budget.destiny;

      const dataIda = dto.data_hora_viagem ? new Date(dto.data_hora_viagem) : budget.date_hour_trip;
      const dataVolta = dto.data_hora_viagem_retorno
        ? new Date(dto.data_hora_viagem_retorno)
        : budget.date_hour_return_trip;

      const driver_id = dto.driver_id ?? budget.driver.map(d => d.id);
      const car_id = dto.car_id ?? budget.car.id;
      const cliente_id = dto.cliente_id ?? budget.cliente.id;

      const pedagio = dto.pedagio ?? budget.toll ?? 0;
      const lucroDesejadoDto = dto.lucroDesejado;
      const precoViagemDto = dto.preco_viagem;
      const custoExtra = dto.custoExtra ?? budget.extra_cost;
      const impostoPercent = dto.impostoPercent ?? 0;
      const status = dto.status ?? budget.status;

      const numMotoristas = driver_id.length;

      const conflictingBudget = await this.budgetRepository
        .createQueryBuilder('budget')
        .leftJoin('budget.driver', 'driver')
        .where('driver.id IN (:...driverIds)', { driverIds: driver_id })
        .andWhere('budget.date_hour_trip <= :dataVolta', { dataVolta })
        .andWhere('budget.date_hour_return_trip >= :dataIda', { dataIda })
        .andWhere('budget.id != :id', { id })
        .getOne();

      if (conflictingBudget) {
        throw new ConflictException('Um ou mais motoristas já possuem outra viagem nesse período.');
      }

      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = distance * 2;

      const { consumption, fixed_cost } = await this.carApiService.findById(car_id, userId);

      const driversData = await Promise.all(
        driver_id.map(id => this.driverApiService.findById(id, userId)),
      );

      const totalDriverCost = driversData.reduce((acc, d) => acc + (d.driverCost ?? 0), 0);
      const totalDailyPriceDriver = driversData.reduce(
        (acc, d) => acc + (d.dailyPriceDriver ?? 0),
        0,
      );

      const dieselPrice = await this.gasApiService.getDieselSC();
      const diesel = dieselPrice?.preco ?? 0;

      const baseSemLucro = calculateBudgetValues({
        totalDistance,
        consumption,
        dieselPrice: diesel,
        driverCost: totalDriverCost,
        dailyPriceDriver: totalDailyPriceDriver,
        numMotoristas,
        diasFora,
        pedagio,
        fixed_cost: fixed_cost!,
        lucroDesejado: 0,
        impostoPercent,
        custoExtra,
      });

      let lucroFinal: number;
      let trip_price: number;

      if (precoViagemDto !== undefined) {
        trip_price = precoViagemDto;
        lucroFinal = trip_price - (baseSemLucro.subtotal + baseSemLucro.imposto);

      } 
      else if (lucroDesejadoDto !== undefined) {
        lucroFinal = lucroDesejadoDto;

        const calcComLucro = calculateBudgetValues({
          totalDistance,
          consumption,
          dieselPrice: diesel,
          driverCost: totalDriverCost,
          dailyPriceDriver: totalDailyPriceDriver,
          numMotoristas,
          diasFora,
          pedagio,
          fixed_cost: fixed_cost!,
          lucroDesejado: lucroFinal,
          impostoPercent,
          custoExtra,
        });

        trip_price = calcComLucro.valorTotal;

      } 
      else {
        lucroFinal = budget.desired_profit;

        const calcComLucro = calculateBudgetValues({
          totalDistance,
          consumption,
          dieselPrice: diesel,
          driverCost: totalDriverCost,
          dailyPriceDriver: totalDailyPriceDriver,
          numMotoristas,
          diasFora,
          pedagio,
          fixed_cost: fixed_cost!,
          lucroDesejado: lucroFinal,
          impostoPercent,
          custoExtra,
        });

        trip_price = calcComLucro.valorTotal;
      }

      const houveLucroFinal = lucroFinal > 0;

      Object.assign(budget, {
        origin: origem,
        destiny: destino,
        date_hour_trip: dataIda,
        date_hour_return_trip: dataVolta,
        total_distance: totalDistance,
        trip_price,
        desired_profit: lucroFinal,
        days_out: diasFora,
        toll: pedagio,
        fixed_cost,
        extra_cost: custoExtra,
        number_of_drivers: numMotoristas,
        houveLucro: houveLucroFinal,
        status,
        car: { id: car_id },
        driver: driver_id.map(id => ({ id })),
        cliente: { id: cliente_id },
        user: { id: userId },
      });

      const saved = await this.budgetRepository.save(budget);

      return {
        ...saved,
        valorTotal: trip_price,
        desired_profit: lucroFinal,
        houveLucro: houveLucroFinal,
        dieselPrice: diesel,
      };

    } catch (err) {
      this.logger.error(`Erro ao atualizar orçamento ID ${id}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar orçamento: ${err.message}`);
    }
  }

  async updateBudgetStatus(id: string, dto: UpdateBudgetStatusDto, userId: string) {
    this.logger.log(`Atualizando status do orçamento ID ${id} para "${dto.status}"`);

    const budget = await this.budgetRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['user', 'driver', 'car', 'cliente'],
    });

    if (!budget) {
      this.logger.warn(`Orçamento ID ${id} não encontrado para atualizar status`);
      throw new NotFoundException('Orçamento não encontrado ou não pertence a este usuário.');
    }

    try {
      budget.status = dto.status;
      const updatedBudget = await this.budgetRepository.save(budget);
      this.logger.log(`Status do orçamento ID ${id} atualizado para "${dto.status}"`);

      if (dto.status === BudgetStatus.APPROVED && budget.driver?.length) {
        const drivers = await Promise.all(
          budget.driver.map((d) => this.driverApiService.findById(d.id, userId)),
        );

        const dataIdaFormatada = budget.date_hour_trip.toLocaleDateString('pt-BR');
        const horaIdaFormatada = budget.date_hour_trip.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });
        const dataVoltaFormatada = budget.date_hour_return_trip.toLocaleDateString('pt-BR');
        const horaVoltaFormatada = budget.date_hour_return_trip.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        });

        const emailSubject = 'Nova Viagem Confirmada 🚚';

        for (const driver of drivers) {
          const emailText = `
          Olá ${driver.name},

          Você tem uma nova viagem! Aqui estão os detalhes:

          Origem: ${budget.origin}
          Destino: ${budget.destiny}
          Data e hora de ida: ${dataIdaFormatada} às ${horaIdaFormatada}
          Data e hora de retorno: ${dataVoltaFormatada} às ${horaVoltaFormatada}
          Número de dias fora: ${budget.days_out}

          Boa viagem e dirija com segurança!
        `;

          await this.emailSender.sendEmail(driver.email, emailSubject, emailText);
          this.logger.log(`Email enviado para ${driver.email} sobre nova viagem`);
        }
      }

      return updatedBudget;
    } catch (err) {
      this.logger.error(`Erro ao atualizar status do orçamento ID ${id}`, err.stack);
      throw new BadRequestException(`Erro ao atualizar status do orçamento: ${err.message}`);
    }
  }

  async deleteBudget(id: string, userId: string) {
    this.logger.log(`Tentando deletar orçamento ID ${id} do usuário ${userId}`);

    const budget = await this.budgetRepository.findOne({
      where: { id, user: { id: userId } },
      relations: ['cliente', 'driver', 'car', 'user'],
    });

    if (!budget) {
      this.logger.warn(`Orçamento ID ${id} não encontrado para exclusão`);
      throw new NotFoundException('Orçamento não encontrado ou não pertence a este usuário.');
    }

    try {
      await this.budgetRepository.remove(budget);
      this.logger.log(`Orçamento ID ${id} deletado com sucesso`);
      return { message: 'Orçamento deletado com sucesso' };
    } 
    catch (err) {
      this.logger.error(`Erro ao deletar orçamento ID ${id}`, err.stack);
      throw new BadRequestException(`Erro ao deletar orçamento: ${err.message}`);
    }
  }
}

