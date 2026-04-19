import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/debt',
    name: 'debt',
    component: Layout,
    redirect: '/debt/list',
    meta: { title: { zh_CN: '老赖管理', en_US: 'Debt' }, icon: 'money-circle', orderNo: 3 },
    children: [
      {
        path: 'list',
        name: 'DebtList',
        component: () => import('@/pages/debt/index.vue'),
        meta: { title: { zh_CN: '欠款列表', en_US: 'Debt List' } },
      },
    ],
  },
];
