export default {
  title: 'Dashboard Overview',
  stats: {
    totalRooms: 'Total Rooms',
    rentedRooms: 'Rented',
    vacantRooms: 'Vacant',
    renovatingRooms: 'Renovating',
    unit: 'units',
  },
  finance: {
    title: 'Monthly Summary',
    rentIncome: 'Rent Income',
    utilityIncome: 'Utility Income',
    expense: 'Expenses',
    netProfit: 'Net Profit',
  },
  occupancy: {
    label: 'Occupancy Rate',
  },
  community: {
    title: 'Community Statistics',
    emptyMessage: 'No community data available',
    columns: {
      communityName: 'Community',
      totalRooms: 'Total Rooms',
      rentedCount: 'Rented',
      vacantCount: 'Vacant',
      occupancyRate: 'Occupancy',
    },
  },
  vacant: {
    title: 'Vacant Rooms',
    emptyMessage: 'No vacant room data available',
    dayUnit: 'days',
    columns: {
      roomInfo: 'Room Info',
      vacantDays: 'Vacant Days',
      rentPrice: 'Monthly Rent',
    },
  },
  todo: {
    label: 'Todo',
    itemUnit: 'items',
    filterPlaceholder: 'Filter type',
    loading: 'Loading...',
    emptyMessage: 'No pending tasks',
    types: {
      utility: 'Utility Bill',
      rent: 'Rent Collection',
    },
    pendingAmount: 'Pending',
    graceLabel: 'Grace',
    graceUnit: 'times',
    filterOptions: {
      all: 'All Types',
      utility: 'Utility Bill',
      rent: 'Rent Collection',
    },
    date: {
      year: 'Y',
      month: 'M',
      day: 'D',
      weekdays: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    },
    fetchError: 'Failed to load todo data',
  },
  error: {
    loading: 'Loading...',
    retry: 'Retry',
    fetchFailed: 'Failed to load data, please retry',
  },
};
