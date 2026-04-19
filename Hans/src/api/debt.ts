import type {
  AddRepaymentParams,
  CreateDebtParams,
  DebtDetail,
  DebtListResult,
  DebtRepaymentItem,
  GetDebtListParams,
  UpdateDebtParams,
} from '@/api/model/debtModel';
import { request } from '@/utils/request';

const Api = {
  List: '/debt/list',
  Detail: '/debt',
  Create: '/debt/add',
  Update: '/debt/edit',
  Delete: '/debt/remove',
  AddRepayment: '/debt',
  DeleteRepayment: '/debt/repay/remove',
};

/**
 * 获取欠款分页列表
 * @description 获取欠款分页列表，支持按租客关键字和状态筛选
 */
export function getDebtList(params: GetDebtListParams) {
  return request.get<DebtListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取欠款详情
 */
export function getDebtDetail(id: number) {
  return request.get<DebtDetail>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 新增欠款
 */
export function createDebt(data: CreateDebtParams) {
  return request.post<DebtDetail>({
    url: Api.Create,
    data,
  });
}

/**
 * 编辑欠款
 */
export function updateDebt(data: UpdateDebtParams) {
  return request.put<DebtDetail>({
    url: Api.Update,
    data,
  });
}

/**
 * 删除欠款
 */
export function deleteDebt(id: number) {
  return request.delete({
    url: `${Api.Delete}/${id}`,
  });
}

/**
 * 添加还款记录
 */
export function addRepayment(id: number, data: AddRepaymentParams) {
  return request.post<DebtRepaymentItem>({
    url: `${Api.AddRepayment}/${id}/repay`,
    data,
  });
}

/**
 * 删除还款记录
 */
export function deleteRepayment(id: number) {
  return request.delete({
    url: `${Api.DeleteRepayment}/${id}`,
  });
}
