using Gentle.Application.Dtos.Debt;

namespace Gentle.Application.Services;

/// <summary>
/// 欠款服务接口
/// </summary>
public interface IDebtService : ITransient
{
    /// <summary>
    /// 获取欠款分页列表
    /// </summary>
    Task<DebtListResult> GetListAsync(DebtListInput input);

    /// <summary>
    /// 根据ID获取欠款详情
    /// </summary>
    Task<DebtDetailDto> GetByIdAsync(int id);

    /// <summary>
    /// 新增欠款
    /// </summary>
    Task<DebtDetailDto> AddAsync(CreateDebtInput input);

    /// <summary>
    /// 更新欠款
    /// </summary>
    Task<DebtDetailDto> UpdateAsync(UpdateDebtInput input);

    /// <summary>
    /// 删除欠款
    /// </summary>
    Task DeleteAsync(int id);

    /// <summary>
    /// 添加还款记录
    /// </summary>
    Task<DebtRepaymentDto> AddRepaymentAsync(int debtId, AddRepaymentInput input);

    /// <summary>
    /// 删除还款记录
    /// </summary>
    Task DeleteRepaymentAsync(int repaymentId);
}
