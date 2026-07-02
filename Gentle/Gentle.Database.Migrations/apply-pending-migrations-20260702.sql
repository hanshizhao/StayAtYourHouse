-- ============================================================================
-- StayAtYourHouse 待应用迁移脚本（纯 SQL 版，不依赖 dotnet ef）
-- 目标库: sayh_db @ 47.118.90.88:13306
-- 生成日期: 2026-07-02
-- 对应迁移（按 EF Core 时间戳顺序）:
--   1. 20260701044624_AddAnJuCodeRegisteredNames   （加列，可逆，安全）
--   2. 20260701045848_AddMeterFixedFees            （加 8 列，可逆，安全）
--   3. 20260702060917_DropRoomReclaimedStatus       （⚠️ 物理删除 Status=3 房间及其级联数据，不可逆）
-- EF Core ProductVersion: 10.0.5
--
-- !!! 执行前必读 !!!
--   1. 务必先备份数据库（见下方备份命令）
--   2. 迁移 3 会永久删除 Status=3 的房间及关联数据，请确认可丢弃
--   3. 确认服务器库当前版本 <= 20260419055416_AddDebtTables，本脚本只补这 3 个迁移
--
-- 执行方式（任选其一）：
--   命令行:  mysql -h 47.118.90.88 -P 13306 -u sayh_db_user -p sayh_db < apply-pending-migrations-20260702.sql
--   GUI:     Navicat / DBeaver / MySQL Workbench 打开本文件，选择 sayh_db 后整篇执行
--
-- 备份命令:
--   mysqldump -h 47.118.90.88 -P 13306 -u sayh_db_user -p sayh_db > sayh_db_backup_$(date +%Y%m%d_%H%M%S).sql
--
-- 本脚本是【列级别幂等】的：已存在的列/已记录的迁移会自动跳过，可安全重复执行。
-- ============================================================================

-- 可选：显式指定目标库（取消注释并把 sayh_db 改成实际库名）
-- USE sayh_db;


-- ----------------------------------------------------------------------------
-- 0. 确保 EF Core 迁移历史表存在（已存在则跳过，幂等）
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `__EFMigrationsHistory` (
    `MigrationId`    VARCHAR(150) NOT NULL,
    `ProductVersion` VARCHAR(32)  NOT NULL,
    PRIMARY KEY (`MigrationId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================================
-- 迁移 1/3:  20260701044624_AddAnJuCodeRegisteredNames
-- 作用: rental_record 新增「安居码登记人员名单」列（一套房多人登记备忘）
-- ============================================================================
-- 1.1 幂等加列 rental_record.AnJuCodeRegisteredNames VARCHAR(200) NULL
SET @col_exists = (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME   = 'rental_record'
      AND COLUMN_NAME  = 'AnJuCodeRegisteredNames'
);
SET @ddl = IF(@col_exists = 0,
    'ALTER TABLE `rental_record` ADD COLUMN `AnJuCodeRegisteredNames` VARCHAR(200) NULL',
    'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 1.2 登记迁移历史（INSERT IGNORE 幂等；ProductVersion 必须填 10.0.5）
INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260701044624_AddAnJuCodeRegisteredNames', '10.0.5');


-- ============================================================================
-- 迁移 2/3:  20260701045848_AddMeterFixedFees
-- 作用: 抄表账单计入固定费用（电梯费/物业费/网络费/其他费用），快照存储
--       utility_bill  与  meter_record  各加 4 列
-- ============================================================================

-- 2.1 utility_bill.ElevatorFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utility_bill' AND COLUMN_NAME = 'ElevatorFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `utility_bill` ADD COLUMN `ElevatorFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.2 utility_bill.InternetFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utility_bill' AND COLUMN_NAME = 'InternetFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `utility_bill` ADD COLUMN `InternetFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.3 utility_bill.OtherFees
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utility_bill' AND COLUMN_NAME = 'OtherFees');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `utility_bill` ADD COLUMN `OtherFees` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.4 utility_bill.PropertyFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'utility_bill' AND COLUMN_NAME = 'PropertyFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `utility_bill` ADD COLUMN `PropertyFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.5 meter_record.ElevatorFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meter_record' AND COLUMN_NAME = 'ElevatorFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `meter_record` ADD COLUMN `ElevatorFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.6 meter_record.InternetFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meter_record' AND COLUMN_NAME = 'InternetFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `meter_record` ADD COLUMN `InternetFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.7 meter_record.OtherFees
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meter_record' AND COLUMN_NAME = 'OtherFees');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `meter_record` ADD COLUMN `OtherFees` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.8 meter_record.PropertyFee
SET @col_exists = (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'meter_record' AND COLUMN_NAME = 'PropertyFee');
SET @ddl = IF(@col_exists = 0, 'ALTER TABLE `meter_record` ADD COLUMN `PropertyFee` DECIMAL(10,2) NULL', 'DO 0');
PREPARE _stmt FROM @ddl; EXECUTE _stmt; DEALLOCATE PREPARE _stmt;

-- 2.9 登记迁移历史
INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260701045848_AddMeterFixedFees', '10.0.5');


-- ============================================================================
-- 迁移 3/3:  20260702060917_DropRoomReclaimedStatus       ⚠️ 不可逆
-- 作用: 移除 RoomStatus.Reclaimed(=3) 后，清理存量软删除（已收回）房间
--       关联数据（rental_record / meter_record / utility_bill /
--       maintenance_record / landlord_lease）由外键 OnDelete(Cascade) 自动级联删除
--
-- ⚠️ 警告:
--   - 此 DELETE 会【永久删除】所有 Status=3 的房间记录及其全部历史关联数据
--   - 由外键级联触发，无法单独保留关联数据
--   - Down 迁移无法恢复（状态枚举已移除）
--   - 执行前请务必确认：服务器上 Status=3 的房间数据可以丢弃
--     （可先执行下方【预检】统计将被删除的数据量）
-- ============================================================================

-- 【预检-可选】统计将被删除的房间数量（执行前先看一眼，注释掉下面两行则跳过预检）
SELECT CONCAT('⚠️ 即将删除 Status=3 房间数量: ', COUNT(*)) AS will_delete_room_count
FROM `Room` WHERE `Status` = 3;

-- 【执行】DELETE 本身幂等（无 Status=3 记录时删除 0 行，可安全重跑）
--        保持 FOREIGN_KEY_CHECKS=1 以触发正常级联删除
DELETE FROM `Room` WHERE `Status` = 3;

-- 3.x 登记迁移历史
INSERT IGNORE INTO `__EFMigrationsHistory` (`MigrationId`, `ProductVersion`)
VALUES ('20260702060917_DropRoomReclaimedStatus', '10.0.5');


-- ============================================================================
-- 验证（执行后检查，预期见下方注释）
-- ============================================================================

-- 验证 1: 历史表应包含这 3 条迁移记录（预期返回 3 行）
SELECT `MigrationId`, `ProductVersion`
FROM `__EFMigrationsHistory`
WHERE `MigrationId` IN (
    '20260701044624_AddAnJuCodeRegisteredNames',
    '20260701045848_AddMeterFixedFees',
    '20260702060917_DropRoomReclaimedStatus'
)
ORDER BY `MigrationId`;

-- 验证 2: rental_record.AnJuCodeRegisteredNames 列应存在（预期 1 行）
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME = 'rental_record'
  AND COLUMN_NAME = 'AnJuCodeRegisteredNames';

-- 验证 3: utility_bill / meter_record 应各新增 4 个固定费用列（预期共 8 行）
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('utility_bill', 'meter_record')
  AND COLUMN_NAME IN ('ElevatorFee', 'InternetFee', 'OtherFees', 'PropertyFee')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- 验证 4: 应已无 Status=3 的房间（预期返回 0）
SELECT COUNT(*) AS remaining_reclaimed_rooms FROM `Room` WHERE `Status` = 3;

-- ============================================================================
-- 完成。如需回滚（仅迁移 1、2 可逆，迁移 3 不可逆）:
--   回滚迁移 1: ALTER TABLE `rental_record` DROP COLUMN `AnJuCodeRegisteredNames`;
--   回滚迁移 2: 对 utility_bill / meter_record 各 DROP 上述 4 列
--   并删除对应 __EFMigrationsHistory 记录
-- 迁移 3 的数据删除无法通过 SQL 恢复，只能从备份还原。
-- ============================================================================
