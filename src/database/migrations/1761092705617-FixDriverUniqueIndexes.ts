import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDriverUniqueIndexes1761010500000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remover índices duplicados
        await queryRunner.query(`
      DROP INDEX IDX_060d35babf99110d4acf5c1d57 ON drivers;
    `).catch(() => { }); // ignora erro se o índice não existir

        await queryRunner.query(`
      DROP INDEX UQ_driver_cpf ON drivers;
    `).catch(() => { });

        await queryRunner.query(`
      DROP INDEX IDX_d4cfc1aafe3a14622aee390edb ON drivers;
    `).catch(() => { });

        // Adicionar constraint única composta (userId + cpf)
        await queryRunner.query(`
      ALTER TABLE drivers
      ADD CONSTRAINT UQ_driver_user_cpf UNIQUE (userId, cpf);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraint composta
        await queryRunner.query(`
      ALTER TABLE drivers
      DROP INDEX UQ_driver_user_cpf;
    `);

        // Restaura índices individuais (se precisar reverter)
        await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_060d35babf99110d4acf5c1d57 ON drivers (cpf);
    `);

        await queryRunner.query(`
      CREATE UNIQUE INDEX IDX_d4cfc1aafe3a14622aee390edb ON drivers (email);
    `);
    }
}
