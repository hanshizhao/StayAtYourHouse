import { defineStore } from 'pinia';

import { getProfile, login, logout } from '@/api/auth';
import { usePermissionStore } from '@/store';
import type { UserInfo } from '@/types/interface';

const InitUserInfo: UserInfo = {
  name: '',
  roles: ['all'],
};

export const useUserStore = defineStore('user', {
  state: () => ({
    token: '',
    userInfo: { ...InitUserInfo },
  }),
  getters: {
    roles: (state) => {
      return state.userInfo?.roles;
    },
  },
  actions: {
    async login(userInfo: { account: string; password: string }) {
      const res = await login({
        account: userInfo.account,
        password: userInfo.password,
      });
      this.token = res.token;
    },
    async getUserInfo() {
      const res = await getProfile();
      this.userInfo = {
        name: res.displayName,
        roles: ['all'],
      };
    },
    async logout() {
      await logout();
      this.token = '';
      this.userInfo = { ...InitUserInfo };
    },
  },
  persist: {
    afterRestore: () => {
      const permissionStore = usePermissionStore();
      permissionStore.initRoutes();
    },
    key: 'user',
    paths: ['token'],
  },
});
