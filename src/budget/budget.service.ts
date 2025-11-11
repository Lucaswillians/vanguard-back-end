import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
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

@Injectable()
export class BudgetService {
  private readonly logger = new Logger(BudgetService.name);

  constructor(
    @InjectRepository(BudgetEntity)
    private readonly budgetRepository: Repository<BudgetEntity>,
    private readonly geocodeApiService: GeocodeApiService,
    private readonly gasApiService: GasApiService,
    private readonly emailSender: EmailSenderService,
    private readonly carApiService: CarService,
    private readonly driverApiService: DriverService,
    private readonly http: HttpService,
  ) { }

  async calculateDistance(origem: string, destino: string) {
    this.logger.log(`Calculando distância entre "${origem}" e "${destino}"`);
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

      this.logger.log(`Distância calculada: ${safeDistance} km, duração: ${safeDuracao} min`);
      return { distance: safeDistance, duracao: safeDuracao };
    }
    catch (err) {
      this.logger.error(`Erro ao calcular distância entre "${origem}" e "${destino}"`, err.stack);
      throw new BadRequestException(`Erro ao calcular distância: ${err.message}`);
    }
  }


  async createBudget(dto: CreateBudgetDto, userId: string) {
    this.logger.log(`Criando orçamento para usuário ${userId}`);
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

    const conflictingBudget = await this.budgetRepository
      .createQueryBuilder('budget')
      .leftJoin('budget.driver', 'driver')
      .where('driver.id IN (:...driverIds)', { driverIds: driver_id })
      .andWhere('budget.date_hour_trip <= :dataVolta', { dataVolta })
      .andWhere('budget.date_hour_return_trip >= :dataIda', { dataIda })
      .getOne();

    if (conflictingBudget) {
      this.logger.warn(
        `Conflito de viagem para um ou mais motoristas entre ${dataIda} e ${dataVolta}`,
      );
      throw new ConflictException(
        'Um ou mais motoristas selecionados já possuem outra viagem nesse período.',
      );
    }

    try {
      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = distance * 2;
      const { consumption, fixed_cost } = await this.carApiService.findById(car_id, userId);

      const driversData = await Promise.all(
        driver_id.map((id) => this.driverApiService.findById(id, userId)),
      );

      const totalDriverCost = driversData.reduce((acc, d) => acc + d.driverCost, 0);
      const totalDailyPriceDriver = driversData.reduce((acc, d) => acc + d.dailyPriceDriver, 0);

      const numMotoristas = driver_id.length;

      const dieselPrice = await this.gasApiService.getDieselSC();

      function safeNumber(n: number | null | undefined): number {
        const num = n ?? 0;        
        return Number.isFinite(num) ? num : 0;
      }

      const calc = calculateBudgetValues({
        totalDistance: safeNumber(totalDistance),
        consumption: safeNumber(consumption),
        dieselPrice: safeNumber(dieselPrice?.preco),
        driverCost: safeNumber(totalDriverCost),
        dailyPriceDriver: safeNumber(totalDailyPriceDriver),
        numMotoristas: Math.max(1, numMotoristas), 
        diasFora: Math.max(1, diasFora),          
        pedagio: safeNumber(pedagio),
        fixed_cost: safeNumber(fixed_cost),
        lucroDesejado: safeNumber(lucroDesejado),
        impostoPercent: safeNumber(impostoPercent),
        custoExtra: safeNumber(custoExtra),
      });

      const budget = this.budgetRepository.create({
        origin: origem,
        destiny: destino,
        date_hour_trip: dataIda,
        date_hour_return_trip: dataVolta,
        total_distance: totalDistance,
        trip_price: calc.valorTotal,
        desired_profit: lucroDesejado,
        days_out: diasFora,
        toll: pedagio,
        fixed_cost,
        extra_cost: custoExtra,
        number_of_drivers: numMotoristas,
        houveLucro: calc.houveLucro,
        status: BudgetStatus.PENDING,
        cliente: { id: cliente_id },
        driver: driver_id.map((id) => ({ id })), 
        car: { id: car_id },
        user: { id: userId },
      });

      const savedBudget = await this.budgetRepository.save(budget);
      this.logger.log(`Orçamento criado com sucesso: ID ${savedBudget.id}`);

      return {
        ...savedBudget,
        data_ida: dataIda.toLocaleDateString('pt-BR'),
        hora_ida: dataIda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        data_retorno: dataVolta.toLocaleDateString('pt-BR'),
        hora_retorno: dataVolta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        ...calc,
        percentualCombustivel: calc.percentualCombustivel.toFixed(2) + '%',
        dieselPrice: dieselPrice.preco,
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
      this.logger.warn(`Orçamento ID ${id} não encontrado para usuário ${userId}`);
      throw new NotFoundException('Orçamento não encontrado ou não pertence a este usuário.');
    }

    try {
      const origem = dto.origem ?? budget.origin;
      const destino = dto.destino ?? budget.destiny;
      const dataIda = new Date(dto.data_hora_viagem ?? budget.date_hour_trip);
      const dataVolta = new Date(dto.data_hora_viagem_retorno ?? budget.date_hour_return_trip);
      const driver_id = dto.driver_id ?? budget.driver.map((d) => d.id); // 👈 agora array
      const car_id = dto.car_id ?? budget.car.id;
      const cliente_id = dto.cliente_id ?? budget.cliente.id;
      const pedagio = dto.pedagio ?? budget.toll ?? 0;
      const lucroDesejado = dto.lucroDesejado ?? budget.desired_profit;
      const impostoPercent = dto.impostoPercent ?? 0;
      const custoExtra = dto.custoExtra ?? budget.extra_cost;
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
        this.logger.warn(`Conflito de viagem ao atualizar orçamento ID ${id} — motoristas: ${driver_id.join(', ')}`);
        throw new ConflictException('Um ou mais motoristas já possuem outra viagem nesse período.');
      }

      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = distance * 2;

      const { consumption, fixed_cost } = await this.carApiService.findById(car_id, userId);

      const driversData = await Promise.all(
        driver_id.map((id) => this.driverApiService.findById(id, userId)),
      );

      const totalDriverCost = driversData.reduce((acc, d) => acc + d.driverCost, 0);
      const totalDailyPriceDriver = driversData.reduce((acc, d) => acc + d.dailyPriceDriver, 0);

      const dieselPrice = await this.gasApiService.getDieselSC();

      function safeNumber(n: number | null | undefined): number {
        const num = n ?? 0;
        return Number.isFinite(num) ? num : 0;
      }

      const calc = calculateBudgetValues({
        totalDistance: safeNumber(totalDistance),
        consumption: safeNumber(consumption),
        dieselPrice: safeNumber(dieselPrice?.preco),
        driverCost: safeNumber(totalDriverCost),
        dailyPriceDriver: safeNumber(totalDailyPriceDriver),
        numMotoristas: Math.max(1, numMotoristas),
        diasFora: Math.max(1, diasFora),
        pedagio: safeNumber(pedagio),
        fixed_cost: safeNumber(fixed_cost),
        lucroDesejado: safeNumber(lucroDesejado),
        impostoPercent: safeNumber(impostoPercent),
        custoExtra: safeNumber(custoExtra),
      });

      Object.assign(budget, {
        origin: origem,
        destiny: destino,
        date_hour_trip: dataIda,
        date_hour_return_trip: dataVolta,
        total_distance: totalDistance,
        trip_price: calc.valorTotal,
        desired_profit: lucroDesejado,
        days_out: diasFora,
        toll: pedagio,
        fixed_cost,
        extra_cost: custoExtra,
        number_of_drivers: numMotoristas,
        houveLucro: calc.houveLucro,
        status,
        car: { id: car_id } as any,
        driver: driver_id.map((id) => ({ id })), 
        cliente: { id: cliente_id } as any,
        user: { id: userId } as any,
      });

      const updatedBudget = await this.budgetRepository.save(budget);
      this.logger.log(`Orçamento ID ${id} atualizado com sucesso`);

      const dataIdaFormatada = dataIda.toLocaleDateString('pt-BR');
      const horaIdaFormatada = dataIda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dataVoltaFormatada = dataVolta.toLocaleDateString('pt-BR');
      const horaVoltaFormatada = dataVolta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      const viagemAlterada =
        budget.origin !== origem ||
        budget.destiny !== destino ||
        budget.date_hour_trip.getTime() !== dataIda.getTime() ||
        budget.date_hour_return_trip.getTime() !== dataVolta.getTime();

      if (viagemAlterada) {
        const emailSubject = 'Atualização na sua viagem';
        for (const d of driversData) {
          const emailText = `
          Olá ${d.name},

          Houve uma atualização nos detalhes da sua viagem:

          Origem: ${origem}
          Destino: ${destino}
          Data e hora de ida: ${dataIdaFormatada} às ${horaIdaFormatada}
          Data e hora de retorno: ${dataVoltaFormatada} às ${horaVoltaFormatada}
          Número de dias fora: ${diasFora}

          Por favor, verifique os novos detalhes.
        `;
          await this.emailSender.sendEmail(d.email, emailSubject, emailText);
          this.logger.log(`Email enviado para ${d.email} sobre atualização de viagem`);
        }
      }

      return {
        ...updatedBudget,
        data_ida: dataIdaFormatada,
        hora_ida: horaIdaFormatada,
        data_retorno: dataVoltaFormatada,
        hora_retorno: horaVoltaFormatada,
        ...calc,
        percentualCombustivel: calc.percentualCombustivel.toFixed(2) + '%',
        dieselPrice: dieselPrice.preco,
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

      // ✅ Se o orçamento foi aprovado, envia e-mail a todos os motoristas
      if (dto.status === BudgetStatus.APPROVED && budget.driver?.length) {
        // Busca informações completas de todos os motoristas
        const drivers = await Promise.all(
          budget.driver.map((d) => this.driverApiService.findById(d.id, userId)),
        );

        // Formata as datas
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

        // Envia email individualmente para cada motorista
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

