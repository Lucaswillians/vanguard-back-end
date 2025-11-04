export interface BudgetCalculationInput {
  totalDistance: number;
  consumption: number;
  dieselPrice: number;
  driverCost: number;
  dailyPriceDriver: number;
  numMotoristas: number;
  diasFora: number;
  pedagio: number;
  fixed_cost: number;
  lucroDesejado: number;
  impostoPercent: number;
  custoExtra: number;
}

export interface BudgetCalculationResult {
  litersConsumed: number;
  gasCost: number;
  custoMotoristaMensal: number;
  custoDiaria: number;
  subtotal: number;
  imposto: number;
  valorTotal: number;
  percentualCombustivel: number;
  houveLucro: boolean;
}

export function calculateBudgetValues(input: BudgetCalculationInput): BudgetCalculationResult {
  const {
    totalDistance,
    consumption,
    dieselPrice,
    driverCost,
    dailyPriceDriver,
    numMotoristas,
    diasFora,
    pedagio,
    fixed_cost,
    lucroDesejado,
    impostoPercent,
    custoExtra,
  } = input;

  const litersConsumed = totalDistance / consumption;
  const gasCost = litersConsumed * dieselPrice;
  const custoMotoristaMensal = (driverCost / 15) * numMotoristas;
  const custoDiaria = dailyPriceDriver * diasFora;

  const subtotal =
    gasCost + custoMotoristaMensal + custoDiaria + pedagio + fixed_cost + lucroDesejado + custoExtra;

  const imposto = subtotal * (impostoPercent / 100);
  const valorTotal = subtotal + imposto;
  const percentualCombustivel = (gasCost / valorTotal) * 100;
  const houveLucro = percentualCombustivel < 30;

  return {
    litersConsumed,
    gasCost,
    custoMotoristaMensal,
    custoDiaria,
    subtotal,
    imposto,
    valorTotal,
    percentualCombustivel,
    houveLucro,
  };
}
