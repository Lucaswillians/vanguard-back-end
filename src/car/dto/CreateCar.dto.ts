import { IsNotEmpty, IsNumber, IsString, Max, Min } from "class-validator";

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  readonly model: string;

  @IsNotEmpty()
  readonly plate: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  readonly consumption: number;

  @IsNumber()
  @Min(0)
  @Max(50)
  readonly fixed_cost: number;
}