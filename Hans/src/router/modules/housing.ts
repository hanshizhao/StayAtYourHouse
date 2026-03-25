import Layout from '@/layouts/index.vue';

export default [
  {
    path: '/housing',
    name: 'housing',
    component: Layout,
    redirect: '/housing/community',
    meta: { title: { zh_CN: '房源管理', en_US: 'Housing' }, icon: 'home' },
    children: [
      {
        path: 'community',
        name: 'HousingCommunity',
        component: () => import('@/pages/housing/community/index.vue'),
        meta: { title: { zh_CN: '小区管理', en_US: 'Community' } },
      },
      {
        path: 'room',
        name: 'HousingRoom',
        component: () => import('@/pages/housing/room/index.vue'),
        meta: { title: { zh_CN: '房间管理', en_US: 'Room' } },
      },
      {
        path: 'room/detail/:id',
        name: 'RoomDetail',
        component: () => import('@/pages/housing/room/detail.vue'),
        meta: { title: { zh_CN: '房间详情', en_US: 'Room Detail' }, hidden: true },
      },
    ],
  },
];
