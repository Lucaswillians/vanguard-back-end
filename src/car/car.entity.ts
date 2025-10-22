import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany, ManyToOne, Unique } from "typeorm";
import { BudgetEntity } from "../budget/budget.entity";
import { UserEntity } from "src/User/user.entity";

@Entity({ name: 'car' })
@Unique(['user', 'plate'])
export class CarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', length: 100, nullable: false })
  model: string;

  @Column({ name: 'plate', length: 70, nullable: false })
  plate: string;

  @Column({ type: 'float' })
  consumption: number;

  @Column({ type: 'float', default: 0 })
  fixed_cost?: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @OneToMany(() => BudgetEntity, (budget) => budget.car)
  budgets: BudgetEntity[];

  @ManyToOne(() => UserEntity, (user) => user.car)
  user: UserEntity;
}
