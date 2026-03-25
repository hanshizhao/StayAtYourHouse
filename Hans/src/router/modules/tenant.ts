import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/tenant',
    name: 'tenant',
    component: Layout,
    redirect: '/tenant/list',
    meta: { title: { zh_CN: '租客管理', en_US: 'Tenant' }, icon: 'user' },
    children: [
      {
        path: 'list',
        name: 'TenantList',
        component: () => import('@/pages/tenant/index.vue'),
        meta: { title: { zh_CN: '租客列表', en_US: 'Tenant List' } },
      },
    ],
  },
];
