import type { LoginParams, LoginResult, ProfileResult } from '@/api/model/authModel';
import { request } from '@/utils/request';

const Api = {
  Login: '/auth/login',
  Profile: '/auth/profile',
  Logout: '/auth/logout',
};

export function login(data: LoginParams) {
  return request.post<LoginResult>({
    url: Api.Login,
    data,
  });
}

export function getProfile() {
  return request.get<ProfileResult>({
    url: Api.Profile,
  });
}

export function logout() {
  return request.post({
    url: Api.Logout,
  });
}
