using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddMeterRecordAndUtilityBill : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "meter_record",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    MeterDate = table.Column<DateTime>(type: "date", nullable: false),
                    WaterReading = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ElectricReading = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrevWaterReading = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PrevElectricReading = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WaterUsage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ElectricUsage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WaterFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ElectricFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meter_record", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meter_record_room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "utility_bill",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    BillTenantId = table.Column<int>(type: "int", nullable: true),
                    MeterRecordId = table.Column<int>(type: "int", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "date", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "date", nullable: false),
                    WaterUsage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ElectricUsage = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WaterFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ElectricFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    PaidDate = table.Column<DateTime>(type: "date", nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime(6)", nullable: true),
                    IsDeleted = table.Column<bool>(type: "tinyint(1)", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_utility_bill", x => x.Id);
                    table.ForeignKey(
                        name: "FK_utility_bill_room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_utility_bill_tenant_BillTenantId",
                        column: x => x.BillTenantId,
                        principalTable: "tenant",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_utility_bill_meter_record_MeterRecordId",
                        column: x => x.MeterRecordId,
                        principalTable: "meter_record",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_meter_record_RoomId",
                table: "meter_record",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_RoomId",
                table: "utility_bill",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_BillTenantId",
                table: "utility_bill",
                column: "BillTenantId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_MeterRecordId",
                table: "utility_bill",
                column: "MeterRecordId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "utility_bill");

            migrationBuilder.DropTable(
                name: "meter_record");
        }
    }
}
