import { UserEntity } from "../User/user.entity";
import { BudgetEntity } from "../budget/budget.entity";
import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn, OneToMany, ManyToOne, Unique } from "typeorm";

@Entity({ name: 'client' })
@Unique(['user', 'email'])
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nome', length: 100, nullable: false })
  name: string;

  @Column({ name: 'email', length: 70, nullable: false })
  email: string;

  @Column({ name: 'telephone', length: 12, nullable: false })
  telephone: string;

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