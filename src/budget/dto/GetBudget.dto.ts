import { BudgetStatus } from '../../enums/BudgetStatus';

export class GetBudgetDto {
  constructor(

    readonly id: string,
    
    readonly origem: string,
    
    readonly destino: string,
    
    readonly data_hora_viagem: Date,
    
    readonly date_hour_return_trip: Date,
    
    readonly cliente_id: string,
    
    readonly driver_id: string[],
    
    readonly car_id: string,
    
    readonly distancia_total: number,
    
    readonly preco_viagem: number,
    
    readonly lucroDesejado: number,
    
    readonly status: BudgetStatus,
  )
  {}
}
