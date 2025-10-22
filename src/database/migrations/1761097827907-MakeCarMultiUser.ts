import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeCarMultiUser1761011000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1️⃣ Adiciona a coluna userId (UUID, nullable por enquanto)
        await queryRunner.query(`
      ALTER TABLE car
      ADD COLUMN userId CHAR(36) NULL;
    `);

        // 2️⃣ Cria a constraint UNIQUE composta: userId + plate
        await queryRunner.query(`
      ALTER TABLE car
      ADD CONSTRAINT UQ_car_user_plate UNIQUE (userId, plate);
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraint composta
        await queryRunner.query(`
      ALTER TABLE car
      DROP INDEX UQ_car_user_plate;
    `);

        // Remove a coluna userId
        await queryRunner.query(`
      ALTER TABLE car
      DROP COLUMN userId;
    `);
    }
}
