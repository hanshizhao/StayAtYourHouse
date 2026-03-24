import type { CreateUserParams, ResetPasswordParams, UpdateUserParams, UserItem } from '@/api/model/userModel';
import { request } from '@/utils/request';

const Api = {
  List: '/user',
  Detail: '/user',
  Create: '/user',
  Update: '/user',
  ResetPassword: '/user',
  Toggle: '/user',
};

export function getUserList() {
  return request.get<UserItem[]>({
    url: Api.List,
  });
}

export function getUserById(id: number) {
  return request.get<UserItem>({
    url: `${Api.Detail}/${id}`,
  });
}

export function createUser(data: CreateUserParams) {
  return request.post<UserItem>({
    url: Api.Create,
    data,
  });
}

export function updateUser(id: number, data: UpdateUserParams) {
  return request.put<UserItem>({
    url: `${Api.Update}/${id}`,
    data,
  });
}

export function resetPassword(id: number, data: ResetPasswordParams) {
  return request.put({
    url: `${Api.ResetPassword}/${id}/password`,
    data,
  });
}

export function toggleUser(id: number) {
  return request.put({
    url: `${Api.Toggle}/${id}/toggle`,
  });
}
