import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BudgetStatus } from 'src/enums/BudgetStatus';
import { ClientEntity } from 'src/client/client.entity';
import { DriverEntity } from 'src/driver/driver.entity';
import { CarEntity } from 'src/car/car.entity';

@Entity({ name: 'budgets' })
export class BudgetEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 255 })
  origem: string;

  @Column({ type: 'varchar', length: 255 })
  destino: string;

  @Column({ type: 'timestamp' })
  data_hora_viagem: Date;

  @Column({ type: 'float', nullable: true })
  distancia_total?: number;

  @Column({ type: 'float', nullable: true })
  preco_viagem?: number;

  @Column({ type: 'float', nullable: true })
  lucro?: number;

  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.PENDING })
  status: BudgetStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @ManyToOne(() => ClientEntity, (cliente) => cliente.budgets)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClientEntity;

  @ManyToOne(() => DriverEntity, (driver) => driver.budgets)
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @ManyToOne(() => CarEntity, (car) => car.budgets)
  @JoinColumn({ name: 'car_id' })
  car: CarEntity;
}
