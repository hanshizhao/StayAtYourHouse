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
    userInfoFetched: false,
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
      if (this.userInfoFetched) return;
      const res = await getProfile();
      this.userInfo = {
        name: res.displayName,
        roles: ['all'],
      };
      this.userInfoFetched = true;
    },
    async logout() {
      try {
        if (this.token) {
          await logout();
        }
      } catch {
        // 忽略 logout 失败，继续清理本地状态
      }
      this.token = '';
      this.userInfo = { ...InitUserInfo };
      this.userInfoFetched = false;
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
