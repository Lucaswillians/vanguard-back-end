import { IsEmail, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsEmail()
  @IsNotEmpty()
  readonly email: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]{1}[0-9]{7,14}$/, {
    message: 'Telefone inválido. Deve conter entre 8 e 15 dígitos, podendo iniciar com +',
  })
  readonly telephone: string;
}