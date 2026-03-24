import { defineStore } from 'pinia';
import type { RouteRecordRaw } from 'vue-router';

import router, { fixedRouterList, homepageRouterList } from '@/router';
import { store } from '@/store';

export const usePermissionStore = defineStore('permission', {
  state: () => ({
    whiteListRouters: ['/login'],
    routers: [],
    removeRoutes: [],
    asyncRoutes: [],
    routesBuilt: false, // 标记路由是否已构建
  }),
  actions: {
    async initRoutes() {
      const accessedRouters = this.asyncRoutes;

      // 在菜单展示全部路由
      this.routers = [...homepageRouterList, ...accessedRouters, ...fixedRouterList];
      // 在菜单只展示动态路由和首页
      // this.routers = [...homepageRouterList, ...accessedRouters];
      // 在菜单只展示动态路由
      // this.routers = [...accessedRouters];
    },
    async buildAsyncRoutes() {
      // 暂时使用静态路由，后续可在后端实现菜单 API 后改为动态获取
      // const asyncRoutes: Array<RouteItem> = (await getMenuList()).list;
      // this.asyncRoutes = transformObjectToRoute(asyncRoutes);
      this.asyncRoutes = [];
      this.routesBuilt = true; // 标记已构建
      await this.initRoutes();
      return this.asyncRoutes;
    },
    async restoreRoutes() {
      // 不需要在此额外调用initRoutes更新侧边导肮内容，在登录后asyncRoutes为空会调用
      this.asyncRoutes.forEach((item: RouteRecordRaw) => {
        if (item.name) {
          router.removeRoute(item.name);
        }
      });
      this.asyncRoutes = [];
      this.routesBuilt = false; // 重置构建标志
    },
  },
});

export function getPermissionStore() {
  return usePermissionStore(store);
}
