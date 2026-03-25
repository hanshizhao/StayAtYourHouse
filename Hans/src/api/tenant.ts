import type { CreateTenantParams, TenantItem, TenantListParams, TenantListResult, UpdateTenantParams } from '@/api/model/tenantModel';
import { request } from '@/utils/request';

const Api = {
  List: '/tenant-app/list',
  Detail: '/tenant-app',
  Create: '/tenant-app/add',
  Update: '/tenant-app/edit',
  Delete: '/tenant-app/remove',
};

/**
 * 获取租客分页列表
 * @description 获取租客分页列表，含当前房间和租住状态信息
 * @param params 分页参数（page, pageSize, keyword）
 */
export function getTenantList(params: TenantListParams) {
  return request.get<TenantListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取租客详情
 */
export function getTenantById(id: number) {
  return request.get<TenantItem>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 创建租客
 */
export function createTenant(data: CreateTenantParams) {
  return request.post<TenantItem>({
    url: Api.Create,
    data,
  });
}

/**
 * 更新租客
 */
export function updateTenant(data: UpdateTenantParams) {
  return request.put<TenantItem>({
    url: Api.Update,
    data,
  });
}

/**
 * 删除租客
 */
export function deleteTenant(id: number) {
  return request.delete({
    url: `${Api.Delete}/${id}`,
  });
}
