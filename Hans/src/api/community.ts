import type { CommunityItem, CreateCommunityParams, UpdateCommunityParams } from '@/api/model/communityModel';
import { request } from '@/utils/request';

const Api = {
  List: '/community/list',
  Detail: '/community',
  Create: '/community/add',
  Update: '/community/edit',
  Delete: '/community/remove',
};

/**
 * 获取小区列表
 */
export function getCommunityList() {
  return request.get<CommunityItem[]>({
    url: Api.List,
  });
}

/**
 * 根据ID获取小区详情
 */
export function getCommunityById(id: number) {
  return request.get<CommunityItem>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 创建小区
 */
export function createCommunity(data: CreateCommunityParams) {
  return request.post<CommunityItem>({
    url: Api.Create,
    data,
  });
}

/**
 * 更新小区
 */
export function updateCommunity(data: UpdateCommunityParams) {
  return request.put<CommunityItem>({
    url: Api.Update,
    data,
  });
}

/**
 * 删除小区
 */
export function deleteCommunity(id: number) {
  return request.delete({
    url: `${Api.Delete}/${id}`,
  });
}
