import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateDriverUniqueCpf1761010000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1️⃣ Remove índices antigos (se existirem)
        await queryRunner.query(`
            ALTER TABLE drivers
            DROP INDEX IF EXISTS UQ_driver_user;
        `);

        await queryRunner.query(`
            ALTER TABLE drivers
            DROP INDEX IF EXISTS UQ_driver_user_cpf;
        `);

        await queryRunner.query(`
            ALTER TABLE drivers
            DROP INDEX IF EXISTS UQ_driver_cpf;
        `);

        // 2️⃣ Cria o novo índice único apenas no CPF
        await queryRunner.query(`
            ALTER TABLE drivers
            ADD CONSTRAINT UQ_driver_cpf UNIQUE (cpf);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 1️⃣ Remove o novo índice
        await queryRunner.query(`
            ALTER TABLE drivers
            DROP INDEX IF EXISTS UQ_driver_cpf;
        `);

        // 2️⃣ Restaura o índice antigo composto (userId + cpf)
        await queryRunner.query(`
            ALTER TABLE drivers
            ADD CONSTRAINT UQ_driver_user_cpf UNIQUE (userId, cpf);
        `);
    }

}
