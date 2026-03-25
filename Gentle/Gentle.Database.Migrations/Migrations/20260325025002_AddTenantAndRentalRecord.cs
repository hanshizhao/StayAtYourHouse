using System;
using Microsoft.EntityFrameworkCore.Migrations;
using MySql.EntityFrameworkCore.Metadata;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantAndRentalRecord : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 使用原始 SQL 创建表（如果不存在）
            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS `tenant` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `Name` varchar(50) NOT NULL,
    `Phone` varchar(20) NOT NULL,
    `IdCard` varchar(18) NULL,
    `Gender` int NOT NULL DEFAULT 0,
    `EmergencyContact` varchar(100) NULL,
    `Remark` longtext NULL,
    `TenantId` char(36) NULL,
    `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedTime` datetime NULL,
    PRIMARY KEY (`Id`)
) CHARACTER SET utf8mb4;
");

            migrationBuilder.Sql(@"
CREATE TABLE IF NOT EXISTS `rental_record` (
    `Id` int NOT NULL AUTO_INCREMENT,
    `RenterId` int NOT NULL,
    `RoomId` int NOT NULL,
    `CheckInDate` datetime(6) NOT NULL,
    `LeaseType` int NOT NULL DEFAULT 0,
    `ContractEndDate` datetime(6) NOT NULL,
    `MonthlyRent` decimal(18,2) NOT NULL,
    `Deposit` decimal(18,2) NOT NULL,
    `DepositStatus` int NOT NULL DEFAULT 0,
    `DepositDeduction` decimal(18,2) NULL,
    `Status` int NOT NULL DEFAULT 0,
    `CheckOutDate` datetime(6) NULL,
    `Remark` varchar(500) NULL,
    `CheckOutRemark` varchar(500) NULL,
    `TenantId` char(36) NULL,
    `CreatedTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `UpdatedTime` datetime NULL,
    PRIMARY KEY (`Id`),
    INDEX `IX_rental_record_RenterId` (`RenterId`),
    INDEX `IX_rental_record_RoomId` (`RoomId`),
    CONSTRAINT `FK_rental_record_tenant_RenterId` FOREIGN KEY (`RenterId`) REFERENCES `tenant` (`Id`) ON DELETE RESTRICT,
    CONSTRAINT `FK_rental_record_room_RoomId` FOREIGN KEY (`RoomId`) REFERENCES `room` (`Id`) ON DELETE RESTRICT
) CHARACTER SET utf8mb4;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP TABLE IF EXISTS `rental_record`;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS `tenant`;");
        }
    }
}
