import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BudgetEntity } from './budget.entity';
import { GeocodeApiService } from '../geocodeApi/geocodeApi.service';
import { GasApiService } from '../gasApi/gasApi.service';
import { CreateBudgetDto } from './dto/CreateBudget.dto';
import { HttpService } from '@nestjs/axios';
import { EmailSenderService } from '../email-sender/emailSender.serivce';
import { CarService } from '../car/car.service';
import { DriverService } from '../driver/driver.service';
import { BudgetStatus } from '../enums/BudgetStatus';
import { GetBudgetDto } from './dto/GetBudget.dto';
import { UpdateBudgetDto } from './dto/UpdateBudget.dto';
import { GetTripDetails } from './dto/GetTripDetails.dto';

@Injectable()
export class BudgetService {
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
    const origemCoord = await this.geocodeApiService.getCoordinates(origem);
    const destinoCoord = await this.geocodeApiService.getCoordinates(destino);

    const url = `http://router.project-osrm.org/route/v1/driving/${origemCoord.lng},${origemCoord.lat};${destinoCoord.lng},${destinoCoord.lat}?overview=false`;
    const response = await this.http.axiosRef.get(url);
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      throw new Error('Não foi possível calcular a distância');
    }

    const distance = data.routes[0].distance / 1000; // km
    const duracao = Math.round(data.routes[0].duration / 60); // minutos

    return { distance, duracao };
  }

  async createBudget(dto: CreateBudgetDto) {
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
    const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
    const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

    const { distance } = await this.calculateDistance(origem, destino);
    const totalDistance = distance * 2;
    const { consumption, fixed_cost } = await this.carApiService.findById(car_id);
    const { driverCost, dailyPriceDriver, email: driverEmail, name: driverName } = await this.driverApiService.findById(driver_id);
    const dieselPrice = await this.gasApiService.getDieselSC();

    const litersConsumed = totalDistance / consumption;
    const gasCost = litersConsumed * dieselPrice.preco;
    const custoMotoristaMensal = (driverCost / 15) * numMotoristas;
    const custoDiaria = dailyPriceDriver * diasFora;

    const subtotal = gasCost + custoMotoristaMensal + custoDiaria + pedagio + fixed_cost + lucroDesejado + custoExtra;
    const imposto = subtotal * (impostoPercent / 100);
    const valorTotal = subtotal + imposto;
    const percentualCombustivel = (gasCost / valorTotal) * 100;
    const houveLucro = percentualCombustivel < 30;

    const budget = this.budgetRepository.create({
      origin: origem,
      destiny: destino,
      date_hour_trip: dataIda,
      date_hour_return_trip: dataVolta,
      total_distance: totalDistance,
      trip_price: valorTotal,
      desired_profit: lucroDesejado,
      days_out: diasFora,
      toll: pedagio,
      fixed_cost: fixed_cost,
      extra_cost: custoExtra,
      number_of_drivers: numMotoristas,
      houveLucro,
      status: BudgetStatus.PENDING,
      cliente: { id: cliente_id },
      driver: { id: driver_id },
      car: { id: car_id },
    });

    const savedBudget = await this.budgetRepository.save(budget);

    const dataIdaFormatada = dataIda.toLocaleDateString('pt-BR');
    const horaIdaFormatada = dataIda.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dataVoltaFormatada = dataVolta.toLocaleDateString('pt-BR');
    const horaVoltaFormatada = dataVolta.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const emailSubject = 'Nova viagem atribuída';
    const emailText = `
      Olá ${driverName},

      Você foi designado para uma nova viagem.

      Origem: ${origem}
      Destino: ${destino}
      Data e hora de ida: ${dataIdaFormatada} às ${horaIdaFormatada}
      Data e hora de retorno: ${dataVoltaFormatada} às ${horaVoltaFormatada}
      Número de dias fora: ${diasFora}
      `;

    await this.emailSender.sendEmail(driverEmail, emailSubject, emailText);

    return {
      ...savedBudget,
      data_ida: dataIdaFormatada,
      hora_ida: horaIdaFormatada,
      data_retorno: dataVoltaFormatada,
      hora_retorno: horaVoltaFormatada,
      litersConsumed,
      gasCost,
      custoMotoristaMensal,
      custoDiaria,
      subtotal,
      imposto,
      valorTotal,
      percentualCombustivel: percentualCombustivel.toFixed(2) + '%',
      houveLucro,
      dieselPrice: dieselPrice.preco,
    };
  }

  async getAllBudgets() {
    const savedBudget = await this.budgetRepository.find({ relations: ['cliente', 'driver', 'car'] });
    const budgetList = savedBudget.map((budget) => new GetBudgetDto(
      budget.id, budget.origin, budget.destiny,
      budget.date_hour_trip, budget.date_hour_return_trip, 
      budget.cliente.name, budget.driver.name, budget.car.model, budget.total_distance,
      budget.trip_price, budget.desired_profit, budget.status,
    ));

    return budgetList;
  }

  async getAllTrips() {
    const savedBudget = await this.budgetRepository.find({ relations: ['cliente', 'driver', 'car'] });
    const budgetList = savedBudget.map((budget) => new GetTripDetails(
      budget.id, budget.origin, budget.destiny,
      budget.date_hour_trip, budget.date_hour_return_trip,
      budget.cliente.name, budget.driver.name, budget.car.model, budget.total_distance,
    ));

    return budgetList;
  }

  async updateBudget(id: string, dto: UpdateBudgetDto) {
    const budget = await this.budgetRepository.findOne({
      where: { id },
      relations: ['cliente', 'driver', 'car'],
    });

    if (!budget) {
      throw new NotFoundException('Orçamento não encontrado');
    }

    // === Captura dos valores anteriores (para comparação) ===
    const oldOrigem = budget.origin;
    const oldDestino = budget.destiny;
    const oldDataIda = budget.date_hour_trip;
    const oldDataVolta = budget.date_hour_return_trip;

    // === Novos valores com fallback ===
    const origem = dto.origem ?? budget.origin;
    const destino = dto.destino ?? budget.destiny;
    const data_hora_viagem = dto.data_hora_viagem ?? budget.date_hour_trip;
    const data_hora_viagem_retorno = dto.data_hora_viagem_retorno ?? budget.date_hour_return_trip;
    const pedagio: number = dto.pedagio ?? budget.toll ?? 0;
    const lucroDesejado = dto.lucroDesejado ?? budget.desired_profit;
    const impostoPercent = dto.impostoPercent ?? 0;
    const numMotoristas = dto.numMotoristas ?? budget.number_of_drivers;
    const custoExtra = dto.custoExtra ?? budget.extra_cost;
    const driver_id = dto.driver_id ?? budget.driver.id;
    const car_id = dto.car_id ?? budget.car.id;
    const cliente_id = dto.cliente_id ?? budget.cliente.id;
    const status = dto.status ?? budget.status;

    // === Cálculos ===
    const dataIda = new Date(data_hora_viagem);
    const dataVolta = new Date(data_hora_viagem_retorno);
    const diffTime = Math.abs(dataVolta.getTime() - dataIda.getTime());
    const diasFora = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const { distance } = await this.calculateDistance(origem, destino);
    const totalDistance = distance * 2;

    const { consumption, fixed_cost } = await this.carApiService.findById(car_id);
    const { driverCost, dailyPriceDriver, email: driverEmail, name: driverName } =
      await this.driverApiService.findById(driver_id);
    const dieselPrice = await this.gasApiService.getDieselSC();

    const litersConsumed = totalDistance / consumption;
    const gasCost = litersConsumed * dieselPrice.preco;
    const custoMotoristaMensal = (driverCost / 15) * numMotoristas;
    const custoDiaria = dailyPriceDriver * diasFora;

    const subtotal =
      gasCost +
      custoMotoristaMensal +
      custoDiaria +
      pedagio +
      fixed_cost +
      lucroDesejado +
      custoExtra;
    const imposto = subtotal * (impostoPercent / 100);
    const valorTotal = subtotal + imposto;
    const percentualCombustivel = (gasCost / valorTotal) * 100;
    const houveLucro = percentualCombustivel < 30;

    // === Atualiza os campos ===
    budget.origin = origem;
    budget.destiny = destino;
    budget.date_hour_trip = dataIda;
    budget.date_hour_return_trip = dataVolta;
    budget.total_distance = totalDistance;
    budget.trip_price = valorTotal;
    budget.desired_profit = lucroDesejado;
    budget.days_out = diasFora;
    budget.toll = pedagio;
    budget.fixed_cost = fixed_cost;
    budget.extra_cost = custoExtra;
    budget.number_of_drivers = numMotoristas;
    budget.houveLucro = houveLucro;
    budget.status = status;
    budget.car = { id: car_id } as any;
    budget.driver = { id: driver_id } as any;
    budget.cliente = { id: cliente_id } as any;

    const updatedBudget = await this.budgetRepository.save(budget);

    // === Verifica se houve mudança em campos relevantes ===
    const origemAlterada = oldOrigem !== origem;
    const destinoAlterado = oldDestino !== destino;
    const dataAlterada =
      oldDataIda.getTime() !== dataIda.getTime() ||
      oldDataVolta.getTime() !== dataVolta.getTime();

    if (origemAlterada || destinoAlterado || dataAlterada) {
      const dataIdaFormatada = dataIda.toLocaleDateString('pt-BR');
      const horaIdaFormatada = dataIda.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });
      const dataVoltaFormatada = dataVolta.toLocaleDateString('pt-BR');
      const horaVoltaFormatada = dataVolta.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

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
    }

    // === Retorno ===
    const dataIdaFormatada = dataIda.toLocaleDateString('pt-BR');
    const horaIdaFormatada = dataIda.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const dataVoltaFormatada = dataVolta.toLocaleDateString('pt-BR');
    const horaVoltaFormatada = dataVolta.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    return {
      ...updatedBudget,
      data_ida: dataIdaFormatada,
      hora_ida: horaIdaFormatada,
      data_retorno: dataVoltaFormatada,
      hora_retorno: horaVoltaFormatada,
      litersConsumed,
      gasCost,
      custoMotoristaMensal,
      custoDiaria,
      subtotal,
      imposto,
      valorTotal,
      percentualCombustivel: percentualCombustivel.toFixed(2) + '%',
      houveLucro,
      dieselPrice: dieselPrice.preco,
    };
  }

  async createBudgetMock() {
    // ==== MOCKS (valores simulados) ====
    const quilometragemTotal = 885.5652;        // ida e volta (km)

    // isso vem de car
    const mediaKmPorLitro = 2.5;            // média de consumo do ônibus

    // isso vem da api de diesel 
    const precoDiesel = 6.11;               // valor atual do diesel (R$)

    // isso vem de driver 
    const salarioMotorista = 5500;          // salário mensal (R$)

    // isso vem de driver
    const diariaMotorista = 250;            // valor da diária (R$)


    const diasFora = 4;                     // quantidade de dias fora
    const pedagio = 225.60;                 // valor total de pedágios (R$)
    const custoFixo = 253.9;               // custo fixo para manter o carro (R$)
    const lucroDesejado = 4000;             // lucro que deseja obter na viagem (R$)
    const impostoPercent = 0.09;            // 9% de imposto
    const numMotoristas = 2;                // número de motoristas na viagem
    const custoExtra = 500;

    // ==== 1. Quilometragem total e média ====
    const litrosConsumidos = quilometragemTotal / mediaKmPorLitro;

    // ==== 2. Custo com combustível ====
    const custoCombustivel = litrosConsumidos * precoDiesel;

    // ==== 3. Custo do motorista (salário dividido por 15) * número de motoristas ====
    const custoMotoristaMensal = (salarioMotorista / 15) * numMotoristas;

    // ==== 4. Diária do motorista * número de motoristas ====
    const custoDiaria = diariaMotorista * diasFora;

    // ==== 8. Soma de todos os custos + lucro ====
    const subtotal = custoCombustivel + custoMotoristaMensal + custoDiaria + pedagio + custoFixo + lucroDesejado + custoExtra;

    // ==== 9. Imposto (9%) ====
    const imposto = subtotal * impostoPercent;

    // ==== 10. Valor total da viagem ====
    const valorTotal = subtotal + imposto;

    // ==== 13. Verificação de lucratividade ====
    const percentualCombustivel = (custoCombustivel / valorTotal) * 100;
    const houveLucro = percentualCombustivel < 30;

    // ==== Resultado final ====
    const resultado = {
      quilometragemTotal,
      mediaKmPorLitro,
      precoDiesel,
      litrosConsumidos,
      custoCombustivel,
      custoMotoristaMensal,
      custoDiaria,
      pedagio,
      custoFixo,
      lucroDesejado,
      numMotoristas,
      subtotal,
      impostoPercent: impostoPercent * 100,
      imposto,
      valorTotal,
      percentualCombustivel: percentualCombustivel.toFixed(2) + '%',
      houveLucro,
    };

    console.table(resultado);
    return resultado;
  }
}
