export default {
  title: '概览仪表盘',
  stats: {
    totalRooms: '总房源',
    rentedRooms: '已出租',
    vacantRooms: '空置',
    renovatingRooms: '装修中',
    unit: '间',
  },
  finance: {
    title: '本月收支摘要',
    rentIncome: '租金收入',
    utilityIncome: '水电收入',
    expense: '支出',
    netProfit: '净利润',
  },
  occupancy: {
    label: '整体出租率',
  },
  community: {
    title: '小区统计',
    emptyMessage: '暂无小区统计数据',
    columns: {
      communityName: '小区名称',
      totalRooms: '总房源',
      rentedCount: '已出租',
      vacantCount: '空置',
      occupancyRate: '出租率',
    },
  },
  vacant: {
    title: '空置房源',
    emptyMessage: '暂无空置房源数据',
    dayUnit: '天',
    columns: {
      roomInfo: '房间信息',
      vacantDays: '空置天数',
      rentPrice: '月租金',
    },
  },
  todo: {
    label: '待办',
    itemUnit: '项',
    filterPlaceholder: '筛选类型',
    loading: '加载中...',
    emptyMessage: '暂无待办事项',
    types: {
      utility: '水电费',
      rent: '催收房租',
    },
    pendingAmount: '待收款',
    graceLabel: '宽限',
    graceUnit: '次',
    filterOptions: {
      all: '全部类型',
      utility: '水电费',
      rent: '催收房租',
    },
    date: {
      year: '年',
      month: '月',
      day: '日',
      weekdays: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'],
    },
    fetchError: '获取待办数据失败',
  },
  error: {
    loading: '加载中...',
    retry: '重新加载',
    fetchFailed: '数据加载失败，请重试',
  },
};
