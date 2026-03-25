import type { CheckInInput, CheckOutInput, RentalRecordDto } from '@/api/model/rentalModel';
import { request } from '@/utils/request';

const Api = {
  List: '/rental/list',
  Detail: '/rental',
  CheckIn: '/rental/check-in',
  CheckOut: '/rental/check-out',
  Delete: '/rental/remove',
};

/**
 * 获取租住记录列表
 */
export function getRentalList(params?: { status?: string; roomId?: number; tenantId?: number }) {
  return request.get<RentalRecordDto[]>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取租住记录
 */
export function getRentalById(id: number) {
  return request.get<RentalRecordDto>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 入住办理
 */
export function checkIn(data: CheckInInput) {
  return request.post<RentalRecordDto>({
    url: Api.CheckIn,
    data,
  });
}

/**
 * 退租办理
 */
export function checkOut(data: CheckOutInput) {
  return request.post<RentalRecordDto>({
    url: Api.CheckOut,
    data,
  });
}

/**
 * 删除租住记录
 */
export function deleteRental(id: number) {
  return request.delete({
    url: `${Api.Delete}/${id}`,
  });
}
