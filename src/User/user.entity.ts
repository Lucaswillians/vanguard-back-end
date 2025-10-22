import { BudgetEntity } from "src/budget/budget.entity";
import { CarEntity } from "src/car/car.entity";
import { ClientEntity } from "src/client/client.entity";
import { DriverEntity } from "src/driver/driver.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";

@Entity({ name: 'user' })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', length: 100, nullable: false })
  username: string;

  @Column({ name: 'email', length: 70, nullable: false })
  email: string;

  @Column({ name: 'senha', length: 255, nullable: false })
  password: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @OneToMany(() => DriverEntity, (driver) => driver.user)
  driver: DriverEntity[];

  @OneToMany(() => BudgetEntity, (budget) => budget.user)
  budget: BudgetEntity;

  @OneToMany(() => CarEntity, (car) => car.user)
  car: CarEntity[];

  @OneToMany(() => ClientEntity, (client) => client.user)
  client: CarEntity[];
}