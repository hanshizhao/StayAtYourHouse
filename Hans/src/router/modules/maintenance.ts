import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/maintenance',
    name: 'maintenance',
    component: Layout,
    redirect: '/maintenance/list',
    meta: { title: { zh_CN: '维修管理', en_US: 'Maintenance' }, icon: 'tool', orderNo: 5 },
    children: [
      {
        path: 'list',
        name: 'MaintenanceList',
        component: () => import('@/pages/maintenance/list.vue'),
        meta: { title: { zh_CN: '维修列表', en_US: 'Maintenance List' } },
      },
      {
        path: 'add',
        name: 'MaintenanceAdd',
        component: () => import('@/pages/maintenance/add.vue'),
        meta: { title: { zh_CN: '新增报修', en_US: 'Add Maintenance' }, hidden: true },
      },
      {
        path: 'edit/:id',
        name: 'MaintenanceEdit',
        component: () => import('@/pages/maintenance/add.vue'),
        meta: { title: { zh_CN: '编辑报修', en_US: 'Edit Maintenance' }, hidden: true },
      },
    ],
  },
];
