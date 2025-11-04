import { BudgetCalculationInput, calculateBudgetValues } from "../budgetCalculator.util";


describe('calculateBudgetValues', () => {
  const baseInput: BudgetCalculationInput = {
    totalDistance: 1000,      // km (ida e volta)
    consumption: 5,           // km/L
    dieselPrice: 6,           // R$/L
    driverCost: 3000,         // custo mensal
    dailyPriceDriver: 150,    // diária
    numMotoristas: 1,
    diasFora: 2,
    pedagio: 100,
    fixed_cost: 500,
    lucroDesejado: 1000,
    impostoPercent: 10,
    custoExtra: 50,
  };

  it('deve indicar que NÃO houve lucro quando combustível for maior que 30% do total', () => {
    const input = {
      ...baseInput,
      dieselPrice: 20, // combustível caríssimo
    };

    const result = calculateBudgetValues(input);

    expect(result.houveLucro).toBe(false);
  });

  it('deve lidar corretamente com imposto 0%', () => {
    const input = {
      ...baseInput,
      impostoPercent: 0,
    };

    const result = calculateBudgetValues(input);

    expect(result.imposto).toBe(0);
    expect(result.valorTotal).toBeCloseTo(result.subtotal);
  });

  it('deve lidar com valores mínimos', () => {
    const input: BudgetCalculationInput = {
      totalDistance: 0,
      consumption: 10,
      dieselPrice: 5,
      driverCost: 0,
      dailyPriceDriver: 0,
      numMotoristas: 0,
      diasFora: 0,
      pedagio: 0,
      fixed_cost: 0,
      lucroDesejado: 0,
      impostoPercent: 0,
      custoExtra: 0,
    };

    const result = calculateBudgetValues(input);

    expect(result.valorTotal).toBe(0);
    expect(result.houveLucro).toBe(false);
  });
});
