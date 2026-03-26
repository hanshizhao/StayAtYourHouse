import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/bill',
    name: 'bill',
    component: Layout,
    redirect: '/bill/list',
    meta: { title: { zh_CN: '账单管理', en_US: 'Bill' }, icon: 'wallet' },
    children: [
      {
        path: 'list',
        name: 'BillList',
        component: () => import('@/pages/bill/index.vue'),
        meta: { title: { zh_CN: '账单列表', en_US: 'Bill List' } },
      },
    ],
  },
];
