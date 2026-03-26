using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddBillAndCollectionRecordOnly : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 只创建 bill 和 collection_record 表（其他表已存在）

            migrationBuilder.CreateTable(
                name: "bill",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    RentalRecordId = table.Column<int>(type: "int", nullable: false),
                    PeriodStart = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    PeriodEnd = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    DueDate = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    RentAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    WaterFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    ElectricFee = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<int>(type: "int", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: true),
                    PaidDate = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    GraceUntil = table.Column<DateTime>(type: "datetime(6)", nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<Guid>(type: "char(36)", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_bill", x => x.Id);
                    table.ForeignKey(
                        name: "FK_bill_rental_record_RentalRecordId",
                        column: x => x.RentalRecordId,
                        principalTable: "rental_record",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "collection_record",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySQL:ValueGenerationStrategy", MySQLValueGenerationStrategy.IdentityColumn),
                    BillId = table.Column<int>(type: "int", nullable: false),
                    CollectDate = table.Column<DateTime>(type: "date", nullable: false),
                    Result = table.Column<int>(type: "int", nullable: false),
                    GraceUntil = table.Column<DateTime>(type: "date", nullable: true),
                    Remark = table.Column<string>(type: "varchar(500)", maxLength: 500, nullable: true),
                    TenantId = table.Column<Guid>(type: "char(36)", nullable: true),
                    CreatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: false),
                    UpdatedTime = table.Column<DateTimeOffset>(type: "datetime", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_collection_record", x => x.Id);
                    table.ForeignKey(
                        name: "FK_collection_record_bill_BillId",
                        column: x => x.BillId,
                        principalTable: "bill",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySQL:Charset", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_bill_RentalRecordId",
                table: "bill",
                column: "RentalRecordId");

            migrationBuilder.CreateIndex(
                name: "IX_collection_record_BillId",
                table: "collection_record",
                column: "BillId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "collection_record");

            migrationBuilder.DropTable(
                name: "bill");
        }
    }
}
