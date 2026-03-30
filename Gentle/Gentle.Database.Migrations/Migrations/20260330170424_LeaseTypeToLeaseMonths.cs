using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class LeaseTypeToLeaseMonths : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LeaseMonths",
                table: "rental_record",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1);

            // 将 LeaseType 枚举值转换为月数：0(月租)→1, 1(半年租)→6, 2(年租)→12
            migrationBuilder.Sql(
                "UPDATE rental_record SET LeaseMonths = CASE \"LeaseType\" WHEN 0 THEN 1 WHEN 1 THEN 6 WHEN 2 THEN 12 ELSE 1 END");

            migrationBuilder.DropColumn(
                name: "LeaseType",
                table: "rental_record");

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$fbucXYo9CpDZM9swfFPf3O5ILxpWd/at831ajC.9xpuR/khOYK3LO");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "LeaseType",
                table: "rental_record",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            // 将月数转换回 LeaseType 枚举值：1→0(月租), 6→1(半年租), 12→2(年租)
            migrationBuilder.Sql(
                "UPDATE rental_record SET \"LeaseType\" = CASE \"LeaseMonths\" WHEN 1 THEN 0 WHEN 6 THEN 1 WHEN 12 THEN 2 ELSE 0 END");

            migrationBuilder.DropColumn(
                name: "LeaseMonths",
                table: "rental_record");

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$Thqw53PBBv7108tFQ7Quie46tHOELnytNnpFyF09.vy6Tt5nud1Aa");
        }
    }
}
