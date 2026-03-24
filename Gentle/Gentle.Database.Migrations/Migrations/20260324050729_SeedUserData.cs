using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class SeedUserData : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "sys_user",
                columns: new[] { "Id", "CreatedTime", "DisplayName", "IsEnabled", "LastLoginTime", "PasswordHash", "TenantId", "UpdatedTime", "Username" },
                values: new object[] { 1, new DateTimeOffset(new DateTime(2024, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), new TimeSpan(0, 8, 0, 0, 0)), "管理员", true, null, "$2a$11$vbZcRGmkkYfLA.AhuUOJtuBU.nCsM9BfuN7xlxr/DtxLvgvIqpz9O", null, null, "zhs" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "sys_user",
                keyColumn: "Id",
                keyValue: 1);
        }
    }
}
