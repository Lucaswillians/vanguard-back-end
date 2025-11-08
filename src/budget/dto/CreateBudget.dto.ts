import { ArrayNotEmpty, IsArray, IsDateString, IsEnum, IsIn, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Matches } from 'class-validator';
import { BudgetStatus } from '../../enums/BudgetStatus';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  origem: string;

  @IsString()
  @IsNotEmpty()
  destino: string;

  @IsDateString()
  data_hora_viagem: Date;

  @IsDateString()
  data_hora_viagem_retorno: Date;

  @IsInt()
  diasFora: number;

  @IsNumber()
  pedagio: number;

  @IsNumber()
  lucroDesejado: number;
  
  @IsNumber()
  impostoPercent: number;

  @IsInt()
  numMotoristas: number;

  @IsNumber()
  custoExtra: number;

  @IsEnum(BudgetStatus)
  readonly budgetStatus: BudgetStatus

  @IsInt()
  cliente_id: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  driver_id: string[];

  @IsInt()
  car_id: string;
}
