using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "maintenance_record",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    Description = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: false),
                    Priority = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ReportDate = table.Column<DateTime>(type: "date", nullable: false),
                    CompletedDate = table.Column<DateTime>(type: "date", nullable: true),
                    Cost = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    RepairPerson = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: true),
                    RepairPhone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    Images = table.Column<string>(type: "varchar(4000)", maxLength: 4000, nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_maintenance_record", x => x.Id);
                    table.ForeignKey(
                        name: "FK_maintenance_record_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$BetMp8NHZ.CSxyLwZmJwaO2ugNAC5rTmyLNznajxZkrP4vE0j2BUe");

            migrationBuilder.CreateIndex(
                name: "IX_maintenance_record_RoomId",
                table: "maintenance_record",
                column: "RoomId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "maintenance_record");

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$fbucXYo9CpDZM9swfFPf3O5ILxpWd/at831ajC.9xpuR/khOYK3LO");
        }
    }
}
