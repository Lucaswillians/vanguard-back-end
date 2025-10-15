export class GetDriverDto {
  constructor(
    readonly id: string, readonly name: string, 
    readonly email: string, readonly cpf: string, 
    readonly paymentType: string, readonly driverCost: number, 
    readonly dailyPriceDriver: number
  )  { }
}
