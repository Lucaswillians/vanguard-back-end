import { BudgetStatus } from 'src/enums/BudgetStatus';

export class GetBudgetDto {
  id: number;

  origem: string;

  destino: string;

  data_hora_viagem: Date;

  cliente_id: number;

  driver_id: number;

  car_id: number;

  distancia_total: number; 
  
  preco_viagem: number;    

  lucro: number;           

  status: BudgetStatus;

  criado_em: Date;
}
