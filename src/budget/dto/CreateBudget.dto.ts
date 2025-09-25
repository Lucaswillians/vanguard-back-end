import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateBudgetDto {
  @IsString()
  @IsNotEmpty()
  readonly model: string;

  @IsEmail()
  @IsNotEmpty()
  readonly plate: string;
}