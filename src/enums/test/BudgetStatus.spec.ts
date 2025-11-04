import { BudgetStatus } from "../BudgetStatus";


describe('BudgetStatus enum', () => {
  it('deve conter as chaves esperadas', () => {
    expect(Object.keys(BudgetStatus)).toEqual(['PENDING', 'APPROVED']);
  });

  it('deve ter os valores corretos', () => {
    expect(BudgetStatus.PENDING).toBe('Pendente');
    expect(BudgetStatus.APPROVED).toBe('Aprovada');
  });
});
