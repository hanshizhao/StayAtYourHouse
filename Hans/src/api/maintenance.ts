import type {
  CompleteMaintenanceInput,
  MaintenanceAddInput,
  MaintenanceDetail,
  MaintenanceListParams,
  MaintenanceListResult,
  MaintenanceUpdateInput,
} from '@/api/model/maintenanceModel';
import { request } from '@/utils/request';

const Api = {
  List: '/maintenance/list',
  Detail: '/maintenance',
  Add: '/maintenance/add',
  Edit: '/maintenance/edit',
  Complete: '/maintenance',
  Delete: '/maintenance/remove',
};

/**
 * 获取维修记录列表
 */
export function getMaintenanceList(params?: MaintenanceListParams) {
  return request.get<MaintenanceListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取维修记录详情
 */
export function getMaintenanceById(id: number) {
  return request.get<MaintenanceDetail>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 新增维修记录
 */
export function addMaintenance(data: MaintenanceAddInput) {
  return request.post<MaintenanceDetail>({
    url: Api.Add,
    data,
  });
}

/**
 * 更新维修记录
 */
export function updateMaintenance(data: MaintenanceUpdateInput) {
  return request.put<MaintenanceDetail>({
    url: Api.Edit,
    data,
  });
}

/**
 * 完成维修
 */
export function completeMaintenance(id: number, data: CompleteMaintenanceInput) {
  return request.post<MaintenanceDetail>({
    url: `${Api.Complete}/${id}/complete`,
    data,
  });
}

/**
 * 删除维修记录
 */
export function deleteMaintenance(id: number) {
  return request.delete<void>({
    url: `${Api.Delete}/${id}`,
  });
}
