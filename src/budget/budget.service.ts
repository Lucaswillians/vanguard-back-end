import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThanOrEqual, MoreThanOrEqual, Not, Repository } from 'typeorm';
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

      const distance = data.routes[0].distance / 1000; // km
      const duracao = Math.round(data.routes[0].duration / 60);
      this.logger.log(`Distância calculada: ${distance} km, duração: ${duracao} min`);
      return { distance, duracao };
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
      numMotoristas,
      custoExtra,
      driver_id,
      car_id,
      cliente_id,
    } = dto;

    const dataIda = new Date(data_hora_viagem);
    const dataVolta = new Date(data_hora_viagem_retorno);

    const conflictingBudget = await this.budgetRepository.findOne({
      where: {
        driver: { id: driver_id },
        date_hour_trip: LessThanOrEqual(dataVolta),
        date_hour_return_trip: MoreThanOrEqual(dataIda),
      },
    });

    if (conflictingBudget) {
      this.logger.warn(`Conflito de viagem para motorista ${driver_id} entre ${dataIda} e ${dataVolta}`);
      throw new ConflictException('O motorista selecionado já possui outra viagem nesse período.');
    }

    try {
      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = distance * 2;

      const { consumption, fixed_cost } = await this.carApiService.findById(car_id, userId);
      const { driverCost, dailyPriceDriver } = await this.driverApiService.findById(driver_id, userId);
      const dieselPrice = await this.gasApiService.getDieselSC();

      const calc = calculateBudgetValues({
        totalDistance,
        consumption,
        dieselPrice: dieselPrice.preco,
        driverCost,
        dailyPriceDriver,
        numMotoristas,
        diasFora,
        pedagio,
        fixed_cost: fixed_cost!,
        lucroDesejado,
        impostoPercent,
        custoExtra,
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
        driver: { id: driver_id },
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
    } 
    catch (err) {
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
      return savedBudget.map(
        (budget) =>
          new GetBudgetDto(
            budget.id,
            budget.origin,
            budget.destiny,
            budget.date_hour_trip,
            budget.date_hour_return_trip,
            budget.cliente?.name,
            budget.driver?.name,
            budget.car?.model,
            budget.total_distance,
            budget.trip_price,
            budget.desired_profit,
            budget.status,
          ),
      );
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
      return savedBudget.map(
        (budget) =>
          new GetTripDetails(
            budget.id,
            budget.origin,
            budget.destiny,
            budget.date_hour_trip,
            budget.date_hour_return_trip,
            budget.cliente?.name,
            budget.driver?.name,
            budget.car?.model,
            budget.total_distance,
          ),
      );
    } 
    catch (err) {
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
      const driver_id = dto.driver_id ?? budget.driver.id;
      const car_id = dto.car_id ?? budget.car.id;
      const cliente_id = dto.cliente_id ?? budget.cliente.id;
      const numMotoristas = dto.numMotoristas ?? budget.number_of_drivers;
      const pedagio = dto.pedagio ?? budget.toll ?? 0;
      const lucroDesejado = dto.lucroDesejado ?? budget.desired_profit;
      const impostoPercent = dto.impostoPercent ?? 0;
      const custoExtra = dto.custoExtra ?? budget.extra_cost;
      const status = dto.status ?? budget.status;

      const conflictingBudget = await this.budgetRepository.findOne({
        where: {
          driver: { id: driver_id },
          date_hour_trip: LessThanOrEqual(dataVolta),
          date_hour_return_trip: MoreThanOrEqual(dataIda),
          id: Not(id),
        },
      });

      if (conflictingBudget) {
        this.logger.warn(`Conflito de viagem ao atualizar orçamento ID ${id} para motorista ${driver_id}`);
        throw new ConflictException('O motorista selecionado já possui outra viagem nesse período.');
      }

      const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
      const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const { distance } = await this.calculateDistance(origem, destino);
      const totalDistance = distance * 2;

      const { consumption, fixed_cost } = await this.carApiService.findById(car_id, userId);
      const { driverCost, dailyPriceDriver, email: driverEmail, name: driverName } =
        await this.driverApiService.findById(driver_id, userId);
      const dieselPrice = await this.gasApiService.getDieselSC();

      const calc = calculateBudgetValues({
        totalDistance,
        consumption,
        dieselPrice: dieselPrice.preco,
        driverCost,
        dailyPriceDriver,
        numMotoristas,
        diasFora,
        pedagio,
        fixed_cost: fixed_cost!,
        lucroDesejado,
        impostoPercent,
        custoExtra,
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
        driver: { id: driver_id } as any,
        cliente: { id: cliente_id } as any,
        user: { id: userId } as any,
      });

      const updatedBudget = await this.budgetRepository.save(budget);
      this.logger.log(`Orçamento ID ${id} atualizado com sucesso`);

      const dataIdaFormatada = dataIda.toLocaleDateString('pt-BR');
      const horaIdaFormatada = dataIda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dataVoltaFormatada = dataVolta.toLocaleDateString('pt-BR');
      const horaVoltaFormatada = dataVolta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

      if (
        budget.origin !== origem ||
        budget.destiny !== destino ||
        budget.date_hour_trip.getTime() !== dataIda.getTime() ||
        budget.date_hour_return_trip.getTime() !== dataVolta.getTime()
      ) {
        const emailSubject = 'Atualização na sua viagem';
        const emailText = `
          Olá ${driverName},

          Houve uma atualização nos detalhes da sua viagem.

          Origem: ${origem}
          Destino: ${destino}
          Data e hora de ida: ${dataIdaFormatada} às ${horaIdaFormatada}
          Data e hora de retorno: ${dataVoltaFormatada} às ${horaVoltaFormatada}
          Número de dias fora: ${diasFora}

          Por favor, verifique os novos detalhes.
        `;

        await this.emailSender.sendEmail(driverEmail, emailSubject, emailText);
        this.logger.log(`Email enviado para ${driverEmail} sobre atualização de viagem`);
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
    } 
    catch (err) {
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

      if (dto.status === BudgetStatus.APPROVED) {
        const driver = await this.driverApiService.findById(budget.driver.id, userId);

        const dataIdaFormatada = budget.date_hour_trip.toLocaleDateString('pt-BR');
        const horaIdaFormatada = budget.date_hour_trip.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const dataVoltaFormatada = budget.date_hour_return_trip.toLocaleDateString('pt-BR');
        const horaVoltaFormatada = budget.date_hour_return_trip.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

        const emailSubject = 'Nova Viagem Confirmada 🚚';
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

      return updatedBudget;
    } 
    catch (err) {
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


// async createBudgetMock() {
//   // ==== MOCKS (valores simulados) ====
//   const quilometragemTotal = 885.5652;        // ida e volta (km)

//   // isso vem de car
//   const mediaKmPorLitro = 2.5;            // média de consumo do ônibus

//   // isso vem da api de diesel
//   const precoDiesel = 6.13;               // valor atual do diesel (R$)

//   // isso vem de driver
//   const salarioMotorista = 5500;          // salário mensal (R$)

//   // isso vem de driver
//   const diariaMotorista = 250;            // valor da diária (R$)


//   const diasFora = 4;                     // quantidade de dias fora
//   const pedagio = 225.60;                 // valor total de pedágios (R$)
//   const custoFixo = 253.9;               // custo fixo para manter o carro (R$)
//   const lucroDesejado = 4000;             // lucro que deseja obter na viagem (R$)
//   const impostoPercent = 0.09;            // 9% de imposto
//   const numMotoristas = 2;                // número de motoristas na viagem
//   const custoExtra = 500;

//   // ==== 1. Quilometragem total e média ====
//   const litrosConsumidos = quilometragemTotal / mediaKmPorLitro;

//   // ==== 2. Custo com combustível ====
//   const custoCombustivel = litrosConsumidos * precoDiesel;

//   // ==== 3. Custo do motorista (salário dividido por 15) * número de motoristas ====
//   const custoMotoristaMensal = (salarioMotorista / 15) * numMotoristas;

//   // ==== 4. Diária do motorista * número de motoristas ====
//   const custoDiaria = diariaMotorista * diasFora;

//   // ==== 8. Soma de todos os custos + lucro ====
//   const subtotal = custoCombustivel + custoMotoristaMensal + custoDiaria + pedagio + custoFixo + lucroDesejado + custoExtra;

//   // ==== 9. Imposto (9%) ====
//   const imposto = subtotal * impostoPercent;

//   // ==== 10. Valor total da viagem ====
//   const valorTotal = subtotal + imposto;

//   // ==== 13. Verificação de lucratividade ====
//   const percentualCombustivel = (custoCombustivel / valorTotal) * 100;
//   const houveLucro = percentualCombustivel < 30;

//   // ==== Resultado final ====
//   const resultado = {
//     quilometragemTotal,
//     mediaKmPorLitro,
//     precoDiesel,
//     litrosConsumidos,
//     custoCombustivel,
//     custoMotoristaMensal,
//     custoDiaria,
//     pedagio,
//     custoFixo,
//     lucroDesejado,
//     numMotoristas,
//     subtotal,
//     impostoPercent: impostoPercent * 100,
//     imposto,
//     valorTotal,
//     percentualCombustivel: percentualCombustivel.toFixed(2) + '%',
//     houveLucro,
//   };

//   console.table(resultado);
//   return resultado;
// }
