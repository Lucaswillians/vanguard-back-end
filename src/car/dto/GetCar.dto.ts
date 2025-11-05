export class GetCarDto {
  constructor(readonly id: string, readonly model: string, 
    readonly plate: string, readonly consumption: number, 
    readonly fixed_cost?: number) { }
}