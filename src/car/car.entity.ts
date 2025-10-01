import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { BudgetEntity } from "src/budget/budget.entity";

@Entity({ name: 'car' })
export class CarEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', length: 100, nullable: false })
  model: string;

  @Column({ name: 'plate', length: 70, nullable: false })
  plate: string;

  @Column({ type: 'float' })
  consumption: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @OneToMany(() => BudgetEntity, (budget) => budget.car)
  budgets: BudgetEntity[];
}
