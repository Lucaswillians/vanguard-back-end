import { IsDateString, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Matches } from 'class-validator';
import { BudgetStatus } from 'src/enums/BudgetStatus';

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  origem: string;

  @IsString()
  @IsNotEmpty()
  destino: string;

  @IsDateString()
  data_hora_viagem: Date;

  @IsInt()
  cliente_id: number;

  @IsInt()
  driver_id: number;

  @IsInt()
  car_id: number;
}
