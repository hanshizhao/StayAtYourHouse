import type { CreateLandlordLeaseParams, LandlordLeaseDetail, UpdateLandlordLeaseParams } from '@/api/model/landlordLeaseModel';
import { request } from '@/utils/request';

const Api = {
  GetByRoomId: '/landlord-lease/room',
  Add: '/landlord-lease/add',
  Edit: '/landlord-lease/edit',
  Remove: '/landlord-lease/remove',
};

/**
 * 根据房间ID获取房东租约
 */
export function getLandlordLeaseByRoomId(roomId: number) {
  return request.get<LandlordLeaseDetail>({
    url: `${Api.GetByRoomId}/${roomId}`,
  });
}

/**
 * 新增房东租约
 */
export function addLandlordLease(data: CreateLandlordLeaseParams) {
  return request.post<LandlordLeaseDetail>({
    url: Api.Add,
    data,
  });
}

/**
 * 更新房东租约
 */
export function updateLandlordLease(data: UpdateLandlordLeaseParams) {
  return request.put<LandlordLeaseDetail>({
    url: Api.Edit,
    data,
  });
}

/**
 * 删除房东租约
 */
export function removeLandlordLease(id: number) {
  return request.delete({
    url: `${Api.Remove}/${id}`,
  });
}
