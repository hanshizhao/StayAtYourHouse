import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/report',
    name: 'report',
    component: Layout,
    redirect: '/report/income',
    meta: { title: { zh_CN: '统计报表', en_US: 'Report' }, icon: 'chart-line', orderNo: 6 },
    children: [
      {
        path: 'income',
        name: 'IncomeReport',
        component: () => import('@/pages/report/income/index.vue'),
        meta: { title: { zh_CN: '收支统计', en_US: 'Income Report' } },
      },
      {
        path: 'housing',
        name: 'HousingReport',
        component: () => import('@/pages/report/housing/index.vue'),
        meta: { title: { zh_CN: '房源概览', en_US: 'Housing Report' } },
      },
      {
        path: 'profit',
        name: 'ProfitReport',
        component: () => import('@/pages/report/profit/index.vue'),
        meta: { title: { zh_CN: '利润排行', en_US: 'Profit Report' } },
      },
    ],
  },
];
