import { IsEnum } from 'class-validator';
import { BudgetStatus } from 'src/enums/BudgetStatus';

export class UpdateBudgetStatusDto {
  @IsEnum(BudgetStatus)
  status: BudgetStatus;
}
