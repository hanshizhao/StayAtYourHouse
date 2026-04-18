import type { CreateRoomParams, GetRoomListParams, RoomItem, RoomListResult, UpdateRoomParams } from '@/api/model/roomModel';
import { request } from '@/utils/request';

const Api = {
  List: '/room/list',
  Detail: '/room',
  Create: '/room/add',
  Update: '/room/edit',
  Delete: '/room/remove',
};

/**
 * 获取房间列表
 */
export function getRoomList(params?: GetRoomListParams) {
  return request.get<RoomListResult>({
    url: Api.List,
    params,
  });
}

/**
 * 根据ID获取房间详情
 */
export function getRoomById(id: number) {
  return request.get<RoomItem>({
    url: `${Api.Detail}/${id}`,
  });
}

/**
 * 创建房间
 */
export function createRoom(data: CreateRoomParams) {
  return request.post<RoomItem>({
    url: Api.Create,
    data,
  });
}

/**
 * 更新房间
 */
export function updateRoom(data: UpdateRoomParams) {
  return request.put<RoomItem>({
    url: Api.Update,
    data,
  });
}

/**
 * 删除房间
 */
export function deleteRoom(id: number) {
  return request.delete({
    url: `${Api.Delete}/${id}`,
  });
}
