import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveFieldAtDriver1761873065095 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query('ALTER TABLE `drivers` DROP COLUMN `paymentType`;');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Caso queira restaurar:
        await queryRunner.query('ALTER TABLE `drivers` ADD COLUMN `paymentType` enum(\'option1\', \'option2\') NOT NULL;');
    }

}
