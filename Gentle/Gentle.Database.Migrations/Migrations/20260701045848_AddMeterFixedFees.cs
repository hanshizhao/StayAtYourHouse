using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddMeterFixedFees : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "ElevatorFee",
                table: "utility_bill",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InternetFee",
                table: "utility_bill",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OtherFees",
                table: "utility_bill",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PropertyFee",
                table: "utility_bill",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "ElevatorFee",
                table: "meter_record",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "InternetFee",
                table: "meter_record",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OtherFees",
                table: "meter_record",
                type: "decimal(10,2)",
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "PropertyFee",
                table: "meter_record",
                type: "decimal(10,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ElevatorFee",
                table: "utility_bill");

            migrationBuilder.DropColumn(
                name: "InternetFee",
                table: "utility_bill");

            migrationBuilder.DropColumn(
                name: "OtherFees",
                table: "utility_bill");

            migrationBuilder.DropColumn(
                name: "PropertyFee",
                table: "utility_bill");

            migrationBuilder.DropColumn(
                name: "ElevatorFee",
                table: "meter_record");

            migrationBuilder.DropColumn(
                name: "InternetFee",
                table: "meter_record");

            migrationBuilder.DropColumn(
                name: "OtherFees",
                table: "meter_record");

            migrationBuilder.DropColumn(
                name: "PropertyFee",
                table: "meter_record");
        }
    }
}
