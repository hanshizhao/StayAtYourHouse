using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class init1 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterDatabase()
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Community",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: false),
                    Address = table.Column<string>(type: "longtext", nullable: true),
                    PropertyPhone = table.Column<string>(type: "longtext", nullable: true),
                    Remark = table.Column<string>(type: "longtext", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Community", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Tenant",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Name = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    Phone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false),
                    IdCard = table.Column<string>(type: "varchar(18)", maxLength: 18, nullable: true),
                    Gender = table.Column<int>(type: "int", nullable: false),
                    EmergencyContact = table.Column<string>(type: "varchar(100)", maxLength: 100, nullable: true),
                    Remark = table.Column<string>(type: "longtext", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Tenant", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    Username = table.Column<string>(type: "longtext", nullable: false),
                    PasswordHash = table.Column<string>(type: "longtext", nullable: false),
                    DisplayName = table.Column<string>(type: "longtext", nullable: false),
                    IsEnabled = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    LastLoginTime = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "Room",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    CommunityId = table.Column<int>(type: "int", nullable: false),
                    Building = table.Column<string>(type: "longtext", nullable: false),
                    RoomNumber = table.Column<string>(type: "longtext", nullable: false),
                    Area = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    RoomType = table.Column<string>(type: "longtext", nullable: true),
                    CostPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RentPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Deposit = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    WaterPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ElectricPrice = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    ContractImage = table.Column<string>(type: "longtext", nullable: true),
                    Remark = table.Column<string>(type: "longtext", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Room", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Room_Community_CommunityId",
                        column: x => x.CommunityId,
                        principalTable: "Community",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

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
                    WaterUsage = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ElectricUsage = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    WaterFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    ElectricFee = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_meter_record", x => x.Id);
                    table.ForeignKey(
                        name: "FK_meter_record_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "rental_record",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RenterId = table.Column<int>(type: "int", nullable: false),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    CheckInDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    LeaseType = table.Column<int>(type: "int", nullable: false),
                    ContractEndDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    MonthlyRent = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Deposit = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    DepositStatus = table.Column<int>(type: "int", nullable: false),
                    DepositDeduction = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    Status = table.Column<int>(type: "int", nullable: false),
                    CheckOutDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CheckOutRemark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_rental_record", x => x.Id);
                    table.ForeignKey(
                        name: "FK_rental_record_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_rental_record_Tenant_RenterId",
                        column: x => x.RenterId,
                        principalTable: "Tenant",
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
                    RentalRecordId = table.Column<int>(type: "int", nullable: true),
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
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_utility_bill", x => x.Id);
                    table.ForeignKey(
                        name: "FK_utility_bill_Room_RoomId",
                        column: x => x.RoomId,
                        principalTable: "Room",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_utility_bill_Tenant_BillTenantId",
                        column: x => x.BillTenantId,
                        principalTable: "Tenant",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_utility_bill_meter_record_MeterRecordId",
                        column: x => x.MeterRecordId,
                        principalTable: "meter_record",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_utility_bill_rental_record_RentalRecordId",
                        column: x => x.RentalRecordId,
                        principalTable: "rental_record",
                        principalColumn: "Id");
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.InsertData(
                table: "User",
                columns: new[] { "Id", "CreatedTime", "DisplayName", "IsEnabled", "LastLoginTime", "PasswordHash", "UpdatedTime", "Username" },
                values: new object[] { 1, new DateTimeOffset(new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 8, 0, 0, 0)), "管理员", true, null, "$2a$11$jJoUNJ0hN/g0UjgEwNszkOKIkoQxPcGGgn8fE1wPZltGx4gIYNVkS", null, "zhs" });

            migrationBuilder.CreateIndex(
                name: "IX_meter_record_RoomId",
                table: "meter_record",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_rental_record_RenterId",
                table: "rental_record",
                column: "RenterId");

            migrationBuilder.CreateIndex(
                name: "IX_rental_record_RoomId",
                table: "rental_record",
                column: "RoomId");

            migrationBuilder.CreateIndex(
                name: "IX_Room_CommunityId",
                table: "Room",
                column: "CommunityId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_BillTenantId",
                table: "utility_bill",
                column: "BillTenantId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_MeterRecordId",
                table: "utility_bill",
                column: "MeterRecordId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_RentalRecordId",
                table: "utility_bill",
                column: "RentalRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_utility_bill_RoomId",
                table: "utility_bill",
                column: "RoomId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "User");

            migrationBuilder.DropTable(
                name: "utility_bill");

            migrationBuilder.DropTable(
                name: "meter_record");

            migrationBuilder.DropTable(
                name: "rental_record");

            migrationBuilder.DropTable(
                name: "Room");

            migrationBuilder.DropTable(
                name: "Tenant");

            migrationBuilder.DropTable(
                name: "Community");
        }
    }
}
