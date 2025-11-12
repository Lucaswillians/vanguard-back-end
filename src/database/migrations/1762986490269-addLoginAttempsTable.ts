import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddLoginAttempsTable1762986490269 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "login_attempts",
                columns: [
                    {
                        name: "id",
                        type: "int",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "increment",
                    },
                    {
                        name: "userId",
                        type: "varchar",
                        length: "255",
                        isNullable: true,
                    },
                    {
                        name: "ip",
                        type: "varchar",
                        length: "45",
                        isNullable: false,
                    },
                    {
                        name: "attemptTime",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                    },
                ],
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("login_attempts");
    }

}
