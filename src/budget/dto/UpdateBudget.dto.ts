import { PartialType } from '@nestjs/mapped-types';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { BudgetStatus } from 'src/enums/BudgetStatus';
import { CreateBudgetDto } from './CreateBudget.dto';

export class UpdateBudgetDto extends PartialType(CreateBudgetDto) {
  @IsOptional()
  @IsNumber()
  distancia_total?: number;

  @IsOptional()
  @IsNumber()
  preco_viagem?: number;

  @IsOptional()
  @IsEnum(BudgetStatus)
  status?: BudgetStatus;
}
