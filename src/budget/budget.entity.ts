import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { BudgetStatus } from 'src/enums/BudgetStatus';
import { ClientEntity } from 'src/client/client.entity';
import { DriverEntity } from 'src/driver/driver.entity';
import { CarEntity } from 'src/car/car.entity';

@Entity({ name: 'budgets' })
export class BudgetEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  origin: string;

  @Column({ type: 'varchar', length: 255 })
  destiny: string;

  @Column({ type: 'timestamp' })
  date_hour_trip: Date;

  @Column({ type: 'timestamp' })
  date_hour_return_trip: Date;

  @Column({ type: 'float', nullable: true })
  total_distance: number;

  @Column({ type: 'float', nullable: true })
  trip_price: number;

  @Column({ type: 'float', nullable: true })
  desired_profit: number;

  @Column({ type: 'int', nullable: false })
  days_out: number;

  @Column({ type: 'float' })
  toll?: number;

  @Column({ type: 'float', nullable: false })
  fixed_cost: number;

  @Column({ type: 'float' })
  extra_cost: number;

  @Column({ type: 'enum', enum: BudgetStatus, default: BudgetStatus.PENDING })
  status: BudgetStatus;

  @Column({ type: 'float', nullable: true })
  tax?: number;

  @Column({ type: 'int', nullable: false, default: 1 })
  number_of_drivers: number;

  @Column({ type: 'boolean', default: false })
  houveLucro: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @ManyToOne(() => ClientEntity, (cliente) => cliente.budgets)
  @JoinColumn({ name: 'cliente_id' })
  cliente: ClientEntity;

  @ManyToOne(() => DriverEntity, (driver) => driver.budgets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'driver_id' })
  driver: DriverEntity;

  @Column({ name: 'driver_id' })
  driver_id: string;


  @ManyToOne(() => CarEntity, (car) => car.budgets)
  @JoinColumn({ name: 'car_id' })
  car: CarEntity;
}
