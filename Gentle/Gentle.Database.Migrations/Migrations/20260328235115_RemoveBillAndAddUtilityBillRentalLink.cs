using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBillAndAddUtilityBillRentalLink : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. 数据迁移： 将 utility_bill 中 status = 2 (Merged) 的记录改为 status = 1 (Paid)
            migrationBuilder.Sql(
                "UPDATE utility_bill SET Status = 1 WHERE Status = 2");

            // 2. 删除 collection_record 表
            migrationBuilder.Sql(
                "DROP TABLE IF EXISTS collection_record");

            // 3. 删除 bill 表
            migrationBuilder.Sql(
                "DROP TABLE IF EXISTS bill");

            // 4. 添加 utility_bill 的 rental_record_id 列（如果不存在）
            // 检查列是否存在，如果不存在则添加
            migrationBuilder.Sql(
                @"SET @column_exists = (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.COLUMNS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'utility_bill'
                    AND COLUMN_NAME = 'RentalRecordId'
                );
                SET @sql = IF(@column_exists = 0,
                    'ALTER TABLE utility_bill ADD COLUMN RentalRecordId INT NULL',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;");

            // 5. 添加 rental_record_id 索引（如果不存在）
            migrationBuilder.Sql(
                @"SET @index_exists = (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.STATISTICS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'utility_bill'
                    AND INDEX_NAME = 'IX_utility_bill_RentalRecordId'
                );
                SET @sql = IF(@index_exists = 0,
                    'CREATE INDEX IX_utility_bill_RentalRecordId ON utility_bill(RentalRecordId)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;");

            // 6. 添加外键约束（如果不存在）
            migrationBuilder.Sql(
                @"SET @fk_exists = (
                    SELECT COUNT(*)
                    FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
                    WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'utility_bill'
                    AND CONSTRAINT_NAME = 'FK_utility_bill_rental_record_RentalRecordId'
                );
                SET @sql = IF(@fk_exists = 0,
                    'ALTER TABLE utility_bill ADD CONSTRAINT FK_utility_bill_rental_record_RentalRecordId FOREIGN KEY (RentalRecordId) REFERENCES rental_record(Id)',
                    'SELECT 1');
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;");

            // 更新用户密码
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Apk.iF7ilohOOHXfF0jIY.rkJlO3x1IAqrsdnO2wi4CQsqFXhobQa");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 回滚: 移除外键约束
            migrationBuilder.Sql(
                "ALTER TABLE utility_bill DROP FOREIGN KEY IF EXISTS FK_utility_bill_rental_record_RentalRecordId");

            // 回滚: 移除索引
            migrationBuilder.Sql(
                "DROP INDEX IF EXISTS IX_utility_bill_RentalRecordId ON utility_bill");

            // 回滚: 移除列
            migrationBuilder.Sql(
                "ALTER TABLE utility_bill DROP COLUMN IF EXISTS RentalRecordId");

            // 回滚: 恢复用户密码
            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$ThX89eiw8n/nv2ylGnlRE.heU7DVSknaazUt2FE52ocU2BqhV59u2");
        }
    }
}
