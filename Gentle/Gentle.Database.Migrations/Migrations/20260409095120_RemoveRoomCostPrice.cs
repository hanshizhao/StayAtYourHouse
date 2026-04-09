using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class RemoveRoomCostPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CostPrice",
                table: "Room");

            migrationBuilder.AddColumn<decimal>(
                name: "ElevatorFee",
                table: "Room",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InternetFee",
                table: "Room",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OtherFees",
                table: "Room",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PropertyFee",
                table: "Room",
                type: "decimal(10,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ElevatorFee",
                table: "Room");

            migrationBuilder.DropColumn(
                name: "InternetFee",
                table: "Room");

            migrationBuilder.DropColumn(
                name: "OtherFees",
                table: "Room");

            migrationBuilder.DropColumn(
                name: "PropertyFee",
                table: "Room");

            migrationBuilder.AddColumn<decimal>(
                name: "CostPrice",
                table: "Room",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);
        }
    }
}
