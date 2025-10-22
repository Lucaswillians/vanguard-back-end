import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeClientMultiUserByEmail1761011600000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1️⃣ Adiciona a coluna userId (UUID, nullable por enquanto)
        await queryRunner.query(`
            ALTER TABLE client
            ADD COLUMN userId CHAR(36) NULL;
        `);

        // 2️⃣ Cria a constraint UNIQUE composta: userId + email
        await queryRunner.query(`
            ALTER TABLE client
            ADD CONSTRAINT UQ_client_user_email UNIQUE (userId, email);
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove constraint composta
        await queryRunner.query(`
            ALTER TABLE client
            DROP INDEX UQ_client_user_email;
        `);

        // Remove a coluna userId
        await queryRunner.query(`
            ALTER TABLE client
            DROP COLUMN userId;
        `);
    }
}
