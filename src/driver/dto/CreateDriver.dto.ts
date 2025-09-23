import { IsEmail, IsEnum, IsNotEmpty, IsString, Matches, MinLength } from "class-validator";
import { PaymentType } from "../../enums/PaymentType";

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

  @IsEnum(PaymentType)
  readonly paymentType: PaymentType
}
