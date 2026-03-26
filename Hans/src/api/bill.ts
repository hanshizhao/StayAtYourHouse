import type { BillItem, BillListParams, BillListResult, CollectInput } from '@/api/model/billModel';
import { request } from '@/utils/request';

const Api = {
  List: '/bill-app/get-list',
  Detail: '/bill-app/get-by-id',
  Collect: '/bill-app/collect',
  Delete: '/bill-app/remove',
};

/**
 * 获取账单列表
 */
export function getBillList(params: BillListParams) {
  return request.get<BillListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取账单详情
 */
export function getBillById(id: number) {
  return request.get<BillItem>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 催收处理
 */
export function collectBill(data: CollectInput) {
  return request.post<BillItem>({
    url: Api.Collect,
    data,
  });
}

/**
 * 删除账单
 */
export function deleteBill(id: number) {
  return request.delete<void>({
    url: `${Api.Delete}/${id}`,
  });
}
