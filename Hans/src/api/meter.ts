import type {
  LastReadingsResult,
  MeterListParams,
  MeterListResult,
  PayUtilityBillInput,
  RecordMeterInput,
  UtilityBillItem,
  UtilityBillListParams,
  UtilityBillListResult,
} from '@/api/model/meterModel';
import { request } from '@/utils/request';

const Api = {
  List: '/meter-app/get-list',
  LastReadings: '/meter-app/get-last-readings',
  Record: '/meter-app/record',
  Delete: '/meter-app/remove',
  GetById: '/meter-app/get-by-id',
  UtilityBills: '/meter-app/get-utility-bills',
  UtilityBillById: '/meter-app/get-utility-bill',
  Pay: '/meter-app/pay',
  DeleteUtilityBill: '/meter-app/remove-utility-bill',
};

// ==================== 抄表记录相关 API ====================

/**
 * 获取抄表记录列表
 */
export function getMeterList(params?: MeterListParams) {
  return request.get<MeterListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 获取房间上次抄表读数
 */
export function getLastReadings(roomId: number) {
  return request.get<LastReadingsResult>({
    url: `${Api.LastReadings}/${roomId}`,
  });
}

/**
 * 录入抄表记录
 */
export function recordMeter(data: RecordMeterInput) {
  return request.post<MeterListResult['items'][0]>({
    url: Api.Record,
    data,
  });
}

/**
 * 根据ID获取抄表记录详情
 */
export function getMeterById(id: number) {
  return request.get<MeterListResult['items'][0]>({
    url: `${Api.GetById}/${id}`,
  });
}

/**
 * 删除抄表记录
 */
export function deleteMeter(id: number) {
  return request.delete<void>({
    url: `${Api.Delete}/${id}`,
  });
}

// ==================== 水电账单相关 API ====================

/**
 * 获取水电账单列表
 */
export function getUtilityBills(params?: UtilityBillListParams) {
  return request.get<UtilityBillListResult>({
    url: Api.UtilityBills,
    params,
  });
}

/**
 * 根据ID获取水电账单详情
 */
export function getUtilityBillById(id: number) {
  return request.get<UtilityBillItem>({
    url: `${Api.UtilityBillById}/${id}`,
  });
}

/**
 * 收取水电费
 */
export function payUtilityBill(data: PayUtilityBillInput) {
  return request.post<UtilityBillItem>({
    url: Api.Pay,
    data,
  });
}

/**
 * 删除水电账单
 */
export function deleteUtilityBill(id: number) {
  return request.delete<void>({
    url: `${Api.DeleteUtilityBill}/${id}`,
  });
}
