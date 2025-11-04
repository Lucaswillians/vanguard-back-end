import { IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString, Matches, Min, MinLength } from "class-validator";

export class CreateDriverDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, {
    message: "CPF must be in the format 000.000.000-00",
  })
  readonly cpf: string;

  @IsNumber()
  readonly driverCost: number;

  @IsNumber()
  readonly dailyPriceDriver: number
}