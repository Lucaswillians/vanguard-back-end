import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateTables1762984770418 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // ✅ USER
        await queryRunner.createTable(new Table({
            name: "user",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "nome", type: "varchar", length: "100", isNullable: false },
                { name: "email", type: "varchar", length: "70", isNullable: false },
                { name: "senha", type: "varchar", length: "255", isNullable: false },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "deleted_at", type: "timestamp", isNullable: true },
            ],
        }));

        // ✅ DRIVER
        await queryRunner.createTable(new Table({
            name: "drivers",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "name", type: "varchar", length: "255" },
                { name: "email", type: "varchar" },
                { name: "cpf", type: "varchar", length: "14" },
                { name: "driverCost", type: "float" },
                { name: "dailyPriceDriver", type: "float" },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "deleted_at", type: "timestamp", isNullable: true },
                { name: "userId", type: "char", length: "36", isNullable: true },
            ],
            uniques: [{ name: "UQ_driver_user_cpf", columnNames: ["userId", "cpf"] }],
        }));

        await queryRunner.createForeignKey("drivers", new TableForeignKey({
            columnNames: ["userId"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));

        // ✅ CLIENT
        await queryRunner.createTable(new Table({
            name: "client",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "nome", type: "varchar", length: "100" },
                { name: "email", type: "varchar", length: "70" },
                { name: "telephone", type: "varchar", length: "12" },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "deleted_at", type: "timestamp", isNullable: true },
                { name: "userId", type: "char", length: "36", isNullable: true },
            ],
            uniques: [{ name: "UQ_client_user_email", columnNames: ["userId", "email"] }],
        }));

        await queryRunner.createForeignKey("client", new TableForeignKey({
            columnNames: ["userId"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));

        // ✅ CAR
        await queryRunner.createTable(new Table({
            name: "car",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "nome", type: "varchar", length: "100" },
                { name: "plate", type: "varchar", length: "70" },
                { name: "consumption", type: "float" },
                { name: "fixed_cost", type: "float", default: 0 },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "deleted_at", type: "timestamp", isNullable: true },
                { name: "userId", type: "char", length: "36", isNullable: true },
            ],
            uniques: [{ name: "UQ_car_user_plate", columnNames: ["userId", "plate"] }],
        }));

        await queryRunner.createForeignKey("car", new TableForeignKey({
            columnNames: ["userId"],
            referencedTableName: "user",
            referencedColumnNames: ["id"],
            onDelete: "CASCADE",
        }));

        // ✅ BUDGET
        await queryRunner.createTable(new Table({
            name: "budgets",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "origin", type: "varchar", length: "255" },
                { name: "destiny", type: "varchar", length: "255" },
                { name: "date_hour_trip", type: "timestamp" },
                { name: "date_hour_return_trip", type: "timestamp" },
                { name: "total_distance", type: "float", isNullable: true },
                { name: "trip_price", type: "float", isNullable: true },
                { name: "desired_profit", type: "float", isNullable: true },
                { name: "days_out", type: "int" },
                { name: "toll", type: "float", isNullable: true },
                { name: "fixed_cost", type: "float" },
                { name: "extra_cost", type: "float" },
                { name: "status", type: "varchar", default: "'PENDING'" },
                { name: "tax", type: "float", isNullable: true },
                { name: "number_of_drivers", type: "int", default: 1 },
                { name: "houveLucro", type: "boolean", default: false },
                { name: "created_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "updated_at", type: "timestamp", default: "CURRENT_TIMESTAMP" },
                { name: "deleted_at", type: "timestamp", isNullable: true },
                { name: "cliente_id", type: "char", length: "36", isNullable: true },
                { name: "car_id", type: "char", length: "36", isNullable: true },
                { name: "userId", type: "char", length: "36", isNullable: true },
            ],
        }));

        await queryRunner.createForeignKeys("budgets", [
            new TableForeignKey({
                columnNames: ["cliente_id"],
                referencedTableName: "client",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            }),
            new TableForeignKey({
                columnNames: ["car_id"],
                referencedTableName: "car",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            }),
            new TableForeignKey({
                columnNames: ["userId"],
                referencedTableName: "user",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        ]);

        // ✅ PIVÔ: BUDGET_DRIVERS
        await queryRunner.createTable(new Table({
            name: "budget_drivers",
            columns: [
                { name: "budget_id", type: "char", length: "36", isPrimary: true },
                { name: "driver_id", type: "char", length: "36", isPrimary: true },
            ],
        }));

        await queryRunner.createForeignKeys("budget_drivers", [
            new TableForeignKey({
                columnNames: ["budget_id"],
                referencedTableName: "budgets",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
            new TableForeignKey({
                columnNames: ["driver_id"],
                referencedTableName: "drivers",
                referencedColumnNames: ["id"],
                onDelete: "CASCADE",
            }),
        ]);

        // ✅ PASSWORD RESET
        await queryRunner.createTable(new Table({
            name: "password_reset_codes",
            columns: [
                { name: "id", type: "char", length: "36", isPrimary: true, default: "(UUID())" },
                { name: "email", type: "varchar" },
                { name: "code", type: "varchar" },
                { name: "createdAt", type: "timestamp", default: "CURRENT_TIMESTAMP" },
            ],
            indices: [{ columnNames: ["email"] }],
        }));
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("password_reset_codes");
        await queryRunner.dropTable("budget_drivers");
        await queryRunner.dropTable("budgets");
        await queryRunner.dropTable("car");
        await queryRunner.dropTable("client");
        await queryRunner.dropTable("drivers");
        await queryRunner.dropTable("user");
    }
}
