import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, DeleteDateColumn, OneToMany, ManyToOne, Unique } from 'typeorm';
import { BudgetEntity } from '../budget/budget.entity';
import { UserEntity } from '../User/user.entity';

@Entity('drivers')
@Unique(['user', 'cpf'])
export class DriverEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar' })
  email: string;

  @Column({ type: 'varchar', length: 14 }) 
  cpf: string;

  @Column({ type: 'float', nullable: false })
  driverCost: number

  @Column({ type: 'float', nullable: false })
  dailyPriceDriver: number

  @CreateDateColumn({ name: 'created_at' })
  createdAt: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: string;

  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt: string;

  @OneToMany(() => BudgetEntity, (budget) => budget.driver)
  budgets: BudgetEntity[];

  @ManyToOne(() => UserEntity, (user) => user.driver)
  user: UserEntity;
}
