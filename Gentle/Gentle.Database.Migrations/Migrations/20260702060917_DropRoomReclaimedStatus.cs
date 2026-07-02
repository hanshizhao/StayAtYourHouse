using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Gentle.Database.Migrations.Migrations
{
    /// <inheritdoc />
    public partial class DropRoomReclaimedStatus : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 移除 RoomStatus.Reclaimed(=3) 状态后，清理历史软删除（已收回）的房间记录。
            // 关联数据（rental_record / meter_record / utility_bill / maintenance_record / landlord_lease）
            // 由各表外键 OnDelete(Cascade) 自动级联删除。
            migrationBuilder.Sql("DELETE FROM Room WHERE Status = 3;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // 状态已从枚举中移除，无法将数据恢复为 Reclaimed，Down 不执行任何操作。
        }
    }
}
