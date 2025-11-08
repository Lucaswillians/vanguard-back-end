import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableColumn } from "typeorm";

export class NewRelationsAtBudgetAndDriver1762353405824 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("budgets");

        // 🔹 Remove a FK antiga de driver_id, se existir
        const foreignKey = table?.foreignKeys.find((fk) =>
            fk.columnNames.includes("driver_id")
        );
        if (foreignKey) {
            await queryRunner.dropForeignKey("budgets", foreignKey);
        }

        // 🔹 Dropa a coluna antiga driver_id, se existir
        const hasDriverId = table?.findColumnByName("driver_id");
        if (hasDriverId) {
            await queryRunner.dropColumn("budgets", "driver_id");
        }

        // 🔹 Cria a tabela intermediária (Many-to-Many)
        await queryRunner.createTable(
            new Table({
                name: "budget_drivers",
                columns: [
                    {
                        name: "budget_id",
                        type: "char",
                        length: "36",
                        isPrimary: true,
                    },
                    {
                        name: "driver_id",
                        type: "char",
                        length: "36",
                        isPrimary: true,
                    },
                ],
            }),
            true
        );

        // 🔹 Foreign keys da tabela intermediária
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
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 🔹 Remove FKs e tabela intermediária
        const table = await queryRunner.getTable("budget_drivers");
        if (table) {
            await queryRunner.dropForeignKeys("budget_drivers", table.foreignKeys);
            await queryRunner.dropTable("budget_drivers");
        }

        // 🔹 Recria a coluna driver_id
        await queryRunner.addColumn(
            "budgets",
            new TableColumn({
                name: "driver_id",
                type: "char",
                length: "36",
                isNullable: true,
            })
        );

        // 🔹 Recria a foreign key antiga
        await queryRunner.createForeignKey(
            "budgets",
            new TableForeignKey({
                columnNames: ["driver_id"],
                referencedTableName: "drivers",
                referencedColumnNames: ["id"],
                onDelete: "SET NULL",
            })
        );
    }
}
