import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateCarDto {
  @IsString()
  @IsNotEmpty()
  readonly model: string;

  @IsEmail()
  @IsNotEmpty()
  readonly plate: string;
}