import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/tenant',
    name: 'tenant',
    component: Layout,
    redirect: '/tenant/list',
    meta: { title: { zh_CN: '租客管理', en_US: 'Tenant' }, icon: 'user', orderNo: 2 },
    children: [
      {
        path: 'list',
        name: 'TenantList',
        component: () => import('@/pages/tenant/index.vue'),
        meta: { title: { zh_CN: '租客列表', en_US: 'Tenant List' } },
      },
      {
        path: 'check-in',
        name: 'CheckIn',
        component: () => import('@/pages/tenant/check-in.vue'),
        meta: { title: { zh_CN: '入住办理', en_US: 'Check In' } },
      },
    ],
  },
];
