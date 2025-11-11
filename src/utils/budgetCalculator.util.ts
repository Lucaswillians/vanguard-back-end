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
  const safe = (n: number | null | undefined) => (n == null || !Number.isFinite(n) ? 0 : n);

  const totalDistance = safe(input.totalDistance);
  const consumption = Math.max(safe(input.consumption), 0.0001);
  const dieselPrice = safe(input.dieselPrice);
  const driverCost = safe(input.driverCost);
  const dailyPriceDriver = safe(input.dailyPriceDriver);
  const numMotoristas = Math.max(safe(input.numMotoristas), 1);
  const diasFora = Math.max(safe(input.diasFora), 1);
  const pedagio = safe(input.pedagio);
  const fixed_cost = safe(input.fixed_cost);
  const lucroDesejado = safe(input.lucroDesejado);
  const impostoPercent = safe(input.impostoPercent);
  const custoExtra = safe(input.custoExtra);

  const litersConsumed = totalDistance / consumption;
  const gasCost = litersConsumed * dieselPrice;
  const custoMotoristaMensal = (driverCost / 15) * numMotoristas;
  const custoDiaria = dailyPriceDriver * diasFora;

  const subtotal =
    gasCost + custoMotoristaMensal + custoDiaria + pedagio + fixed_cost + lucroDesejado + custoExtra;

  const valorTotal = subtotal + subtotal * (impostoPercent / 100);

  const percentualCombustivel = valorTotal > 0 ? (gasCost / valorTotal) * 100 : 0;
  const houveLucro = percentualCombustivel < 30;

  return {
    litersConsumed,
    gasCost,
    custoMotoristaMensal,
    custoDiaria,
    subtotal,
    imposto: subtotal * (impostoPercent / 100),
    valorTotal,
    percentualCombustivel,
    houveLucro,
  };
}
