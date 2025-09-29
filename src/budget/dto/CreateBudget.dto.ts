import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  readonly origin: string;

  @IsEmail()
  @IsNotEmpty()
  readonly destiny: string;
}