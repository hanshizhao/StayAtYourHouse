using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddLandlordLease : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "LandlordLease",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RoomId = table.Column<int>(type: "int", nullable: false),
                    LandlordName = table.Column<string>(type: "varchar(50)", maxLength: 50, nullable: false),
                    LandlordPhone = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: true),
                    StartDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    EndDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    MonthlyRent = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    PaymentMethod = table.Column<int>(type: "int", nullable: false),
                    DepositMonths = table.Column<int>(type: "int", nullable: true),
                    WaterPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    ElectricPrice = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    ElevatorFee = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    PropertyFee = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    InternetFee = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    OtherFees = table.Column<decimal>(type: "decimal(10,2)", nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_LandlordLease", x => x.Id);
                    table.ForeignKey(
                        name: "FK_LandlordLease_Room_RoomId",
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
                value: "$2a$11$VNJqDkm7ATQM0JxVMLul9eDYZQ22oq25RQaJ8K5G.0vzTXTjlRhym");

            migrationBuilder.CreateIndex(
                name: "IX_LandlordLease_RoomId",
                table: "LandlordLease",
                column: "RoomId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "LandlordLease");

            migrationBuilder.UpdateData(
                table: "User",
                keyColumn: "Id",
                keyValue: 1,
                column: "PasswordHash",
                value: "$2a$11$BetMp8NHZ.CSxyLwZmJwaO2ugNAC5rTmyLNznajxZkrP4vE0j2BUe");
        }
    }
}
