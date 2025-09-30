import { IsEmail, IsNotEmpty, IsNumber, IsString, Matches, Max, Min, MinLength } from "class-validator";

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  readonly model: string;

  @IsEmail()
  @IsNotEmpty()
  readonly plate: string;

  @IsNumber()
  @Min(0)
  @Max(50)
  readonly consumption: number;
}