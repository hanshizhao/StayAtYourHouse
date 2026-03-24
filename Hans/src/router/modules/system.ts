import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/system',
    name: 'system',
    component: Layout,
    redirect: '/system/user',
    meta: { title: { zh_CN: '系统管理', en_US: 'System' }, icon: 'setting' },
    children: [
      {
        path: 'user',
        name: 'SystemUser',
        component: () => import('@/pages/system/user/index.vue'),
        meta: { title: { zh_CN: '用户管理', en_US: 'User Management' } },
      },
    ],
  },
];
