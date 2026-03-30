# Dashboard 页面重构设计

## 背景

当前 `/dashboard/base` 页面中，除待办事项外，TopPanel、MiddleChart、RankList、OutputOverview 均为 TDesign 脚手架示例，与业务无关。需要将其替换为房源报表的实际业务数据。

## 目标

将 `/report/housing` 房源报表内容迁移到 Dashboard，增加本月收支摘要，使其成为系统的核心数据概览页面。迁移后 `/report/housing` 页面删除。

## 布局设计

```
┌──────────────────────────────────────────────────┐
│  总房源  │  已出租  │  空置  │  装修中            │  ← 第一行：统计卡片
├──────────────────────┬───────────────────────────┤
│  本月收支摘要         │  📋 待办事项              │  ← 第二行
│  租金/水电/支出/净利   │  待办列表...             │
│  整体出租率 ████░░    │                          │
├──────────────────────┼───────────────────────────┤
│  小区统计             │  空置房源                 │  ← 第三行
│  表格...              │  列表...                  │
└──────────────────────┴───────────────────────────┘
```

- 第一行：4 个统计卡片全宽 4 列
- 第二行：收支摘要（左）+ 待办事项（右）左右分栏
- 第三行：小区统计表格（左）+ 空置房源列表（右）左右分栏

## 组件架构

```
DashboardBase (index.vue)
├── HousingStatsCards.vue       第一行：总房源/已出租/空置/装修中
├── 第二行 grid 布局
│   ├── FinanceSummary.vue      本月收支 + 出租率进度条
│   └── TodoPanel.vue           待办事项（保留现有组件）
└── 第三行 grid 布局
    ├── CommunityStatsTable.vue  小区统计表格
    └── VacantRoomsList.vue      空置房源列表
```

### 新增组件

**HousingStatsCards.vue**
- Props: `{ totalRooms: number; rentedCount: number; vacantCount: number; renovatingCount: number }`
- 4 列 grid 布局，每个卡片包含图标、标签、数字、单位
- 样式参考 `/report/housing` 中 `.stat-card` 的配色方案

**FinanceSummary.vue**
- Props: `{ rentIncome: number; utilityIncome: number; expense: number; netProfit: number; occupancyRate: number }`
- 上半部分 2x2 网格展示租金收入、水电收入、支出、净利润
- 下半部分展示出租率进度条
- 金额使用 `formatMoney()` 格式化
- 数据来源：`IncomeReport.monthlyDetails` 中当月数据

**CommunityStatsTable.vue**
- Props: `communityStats: CommunityStat[]`
- 表格列：小区名称、总房源、已出租、空置、出租率（进度条+百分比）
- 样式从 `/report/housing` 抽取

**VacantRoomsList.vue**
- Props: `vacantRooms: VacantRoomInfo[]`
- 表格列：房间信息、空置天数（颜色标签）、月租金
- 空置天数配色：≤7天绿色、≤30天橙色、>30天红色
- 样式从 `/report/housing` 抽取

### 保留组件

**TodoPanel.vue** — 不做任何修改，保持现有逻辑和样式。

### 修改文件

- `src/pages/dashboard/base/index.vue` — 重写：移除旧组件引用，改为新组件架构

### 删除文件

**TDesign 示例组件（`src/pages/dashboard/base/` 下）：**
- `components/TopPanel.vue`
- `components/MiddleChart.vue`
- `components/RankList.vue`
- `components/OutputOverview.vue`
- `constants.ts`（示例数据）
- `index.ts`（echarts 配置导出）

**注意保留 TodoPanel 相关文件：**
- `components/TodoPanel.vue`
- `components/PayUtilityDialog.vue`
- `components/RentalReminderDialog.vue`
- `components/DeferDialog.vue`
- `components/RenewRentalDialog.vue`
- `components/DeferralRecordsDialog.vue`

**房源报表页面：**
- `src/pages/report/housing/index.vue`
- `src/router/modules/report.ts` 中 housing 路由条目（侧边栏菜单由路由自动生成，移除路由即可）

## 数据获取

在 `index.vue` 中并行调用两个现有 API：

```typescript
const [housingData, incomeData] = await Promise.all([
  getHousingOverview(),
  getIncomeReport(),
]);
```

- 房源数据（统计卡片、小区统计、空置房源、出租率）来自 `getHousingOverview()`
- 收支数据（租金收入、水电收入、支出、净利润）来自当月月度明细：
  ```typescript
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const currentMonthData = incomeData.monthlyDetails.find(m => m.month === currentMonth);
  ```
  注意：使用 `find` 而非数组下标访问，因为 `month` 字段是 1-12 而数组可能不包含未来月份

不新建后端接口。

## 加载与错误处理

- `index.vue` 统一管理 loading/error 状态
- 房源数据和收支数据独立处理：一方失败不影响另一方显示
- 失败区域显示"加载失败"提示和重试按钮
- 使用 `MessagePlugin.error()` 显示轻提示
- 当月无收支数据时，FinanceSummary 显示"暂无本月数据"提示（租金收入、水电收入等均显示 ¥0）

## 响应式布局

| 屏幕宽度 | 第一行 | 第二行 | 第三行 |
|----------|--------|--------|--------|
| ≥ 992px | 4 列 | 左右分栏 | 左右分栏 |
| 577-991px | 2x2 网格 | 左右分栏 | 上下堆叠 |
| ≤ 576px | 单列 | 上下堆叠 | 上下堆叠 |

## 不做的事

- 不新建后端接口
- 不改动 TodoPanel 现有逻辑
- 不添加 ECharts 图表
- 不做数据缓存或轮询刷新
- `/report/housing` 页面直接删除，不做重定向
