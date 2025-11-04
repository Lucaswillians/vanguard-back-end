import { IsEnum } from 'class-validator';
import { BudgetStatus } from '../../enums/BudgetStatus';

export class UpdateBudgetStatusDto {
  @IsEnum(BudgetStatus)
  status: BudgetStatus;
}
