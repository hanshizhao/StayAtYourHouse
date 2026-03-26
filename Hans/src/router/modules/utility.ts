import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/utility',
    name: 'utility',
    component: Layout,
    redirect: '/utility/meter',
    meta: { title: { zh_CN: '水电管理', en_US: 'Utility' }, icon: 'lightbulb' },
    children: [
      {
        path: 'meter',
        name: 'UtilityMeter',
        component: () => import('@/pages/utility/meter/index.vue'),
        meta: { title: { zh_CN: '抄表录入', en_US: 'Meter Reading' } },
      },
      {
        path: 'bill',
        name: 'UtilityBill',
        component: () => import('@/pages/utility/bill/index.vue'),
        meta: { title: { zh_CN: '水电账单', en_US: 'Utility Bill' } },
      },
    ],
  },
];
