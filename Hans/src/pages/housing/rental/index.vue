<template>
  <div class="rental-list">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部筛选栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-select
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
            data-testid="status-filter"
            @change="handleFilterChange"
          />
          <t-select
            v-model="filterCommunityId"
            :options="communityOptions"
            placeholder="全部小区"
            clearable
            data-testid="community-filter"
            @change="handleCommunityChange"
          />
          <t-select
            v-model="filterRoomId"
            :options="roomOptions"
            placeholder="全部房间"
            clearable
            :disabled="!filterCommunityId"
            data-testid="room-filter"
            @change="handleFilterChange"
          />
        </div>
      </t-row>

      <!-- 数据表格（可展开行） -->
      <t-table
        :data="data"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        :expanded-row-keys="expandedRowKeys"
        data-testid="rental-table"
        @page-change="handlePageChange"
        @expand-change="handleExpandChange"
      >
        <template #tenantName="{ row }">
          <span class="tenant-name">{{ row.tenantName }}</span>
        </template>
        <template #roomInfo="{ row }">
          <span class="room-info">{{ row.roomInfo }}</span>
        </template>
        <template #leaseTypeText="{ row }">
          <t-tag variant="light">{{ row.leaseTypeText }}</t-tag>
        </template>
        <template #monthlyRent="{ row }">
          <span class="amount">¥{{ formatMoney(row.monthlyRent) }}</span>
        </template>
        <template #deposit="{ row }">
          <span>¥{{ formatMoney(row.deposit) }}</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ row.statusText }}
          </t-tag>
        </template>
        <template #checkInDate="{ row }">
          {{ formatDate(row.checkInDate) }}
        </template>
        <template #contractEndDate="{ row }">
          {{ formatDate(row.contractEndDate) }}
        </template>

        <!-- 展开行：关联水电账单 -->
        <template #expandedRow="{ row: rentalRow }">
          <div v-if="!rentalRow.utilityBills?.length" class="expanded-bills-empty">暂无关联水电账单</div>
          <div v-else class="expanded-bills-container">
            <div class="expanded-bills-title">关联水电账单（{{ rentalRow.utilityBills.length }} 条）</div>
            <t-table :data="rentalRow.utilityBills" :columns="utilityBillColumns" row-key="id" size="small">
              <template #totalAmount="{ row: bill }">
                <span class="amount">¥{{ formatMoney(bill.totalAmount) }}</span>
              </template>
              <template #waterFee="{ row: bill }">
                <span>¥{{ formatMoney(bill.waterFee) }}</span>
              </template>
              <template #electricFee="{ row: bill }">
                <span>¥{{ formatMoney(bill.electricFee) }}</span>
              </template>
              <template #status="{ row: bill }">
                <t-tag :theme="getUtilityBillStatusTheme(bill.status)" variant="light" size="small">
                  {{ bill.statusText }}
                </t-tag>
              </template>
              <template #periodStart="{ row: bill }">
                {{ formatDate(bill.periodStart) }}
              </template>
              <template #periodEnd="{ row: bill }">
                {{ formatDate(bill.periodEnd) }}
              </template>
              <template #paidDate="{ row: bill }">
                {{ formatDate(bill.paidDate) || '-' }}
              </template>
            </t-table>
          </div>
        </template>
      </t-table>
    </t-card>
  </div>
</template>
<script setup lang="ts">
import type { PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';

import { getCommunityList } from '@/api/community';
import type { CommunityItem } from '@/api/model/communityModel';
import { UtilityBillStatus } from '@/api/model/meterModel';
import type { RentalPageParams, RentalRecordDto } from '@/api/model/rentalModel';
import { RentalStatus } from '@/api/model/rentalModel';
import type { RoomItem } from '@/api/model/roomModel';
import { getRentalPage } from '@/api/rental';
import { getRoomList } from '@/api/room';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'HousingRental',
});

// ==================== 类型定义 ====================

interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

// ==================== 状态 ====================
const settingStore = useSettingStore();

/** 组件卸载标志，防止异步回调更新已卸载组件 */
let isUnmounted = false;

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'tenantName', title: '租客姓名', width: 120 },
  { colKey: 'roomInfo', title: '房间信息', width: 200, ellipsis: true },
  { colKey: 'checkInDate', title: '入住日期', width: 120 },
  { colKey: 'contractEndDate', title: '合同到期', width: 120 },
  { colKey: 'leaseTypeText', title: '租期类型', width: 100 },
  { colKey: 'monthlyRent', title: '月租金', width: 110 },
  { colKey: 'deposit', title: '押金', width: 110 },
  { colKey: 'status', title: '状态', width: 100 },
];

// 展开行水电账单列配置
const utilityBillColumns: PrimaryTableCol[] = [
  { colKey: 'periodStart', title: '周期开始', width: 120 },
  { colKey: 'periodEnd', title: '周期结束', width: 120 },
  { colKey: 'waterFee', title: '水费', width: 100 },
  { colKey: 'electricFee', title: '电费', width: 100 },
  { colKey: 'totalAmount', title: '总金额', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'paidDate', title: '收款日期', width: 120 },
];

// 数据状态
const loading = ref(false);
const data = ref<RentalRecordDto[]>([]);
const pagination = ref({
  pageSize: 20,
  total: 0,
  current: 1,
});
const expandedRowKeys = ref<Array<string | number>>([]);

// 筛选条件
const filterStatus = ref<string | undefined>(undefined);
const filterCommunityId = ref<number | undefined>(undefined);
const filterRoomId = ref<number | undefined>(undefined);

// 下拉选项
const communityOptions = ref<SelectOption[]>([]);
const roomOptions = ref<SelectOption[]>([]);

/**
 * 状态筛选选项
 * 后端 API 接受字符串参数 'active'/'terminated'（见 RentalPageParams.status）
 * 前端 DTO (RentalRecordDto.status) 使用数字枚举 RentalStatus（0=Active, 1=Terminated）
 * 两者在 API 层自动转换，筛选和展示使用不同的值体系
 */
const statusOptions: SelectOption[] = [
  { label: '在租中', value: 'active' },
  { label: '已退租', value: 'terminated' },
];

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 数据获取 ====================

async function fetchData() {
  loading.value = true;
  try {
    const params: RentalPageParams = {
      status: filterStatus.value,
      roomId: filterRoomId.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    const res = await getRentalPage(params);
    if (isUnmounted) return;
    data.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } catch (e: unknown) {
    if (isUnmounted) return;
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取租赁记录失败');
  } finally {
    loading.value = false;
  }
}

async function fetchCommunities() {
  try {
    const res = await getCommunityList();
    if (isUnmounted) return;
    communityOptions.value = (res || []).map((item: CommunityItem) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (e: unknown) {
    if (isUnmounted) return;
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取小区列表失败');
  }
}

/** 按需加载指定小区的房间列表 */
async function fetchRoomsByCommunity(communityId: number) {
  try {
    const res = await getRoomList({ communityId });
    if (isUnmounted) return;
    roomOptions.value = (res || []).map((r: RoomItem) => ({
      label: `${r.building} - ${r.roomNumber}`,
      value: r.id,
    }));
  } catch (e: unknown) {
    if (isUnmounted) return;
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取房间列表失败');
  }
}

// ==================== 事件处理 ====================

function handlePageChange(pageInfo: PageInfo) {
  pagination.value.current = pageInfo.current;
  pagination.value.pageSize = pageInfo.pageSize;
  fetchData();
}

function handleFilterChange() {
  pagination.value.current = 1;
  fetchData();
}

/** 小区变更时，按需加载房间选项并刷新数据 */
async function handleCommunityChange() {
  filterRoomId.value = undefined;
  roomOptions.value = [];

  if (filterCommunityId.value) {
    await fetchRoomsByCommunity(filterCommunityId.value);
  }

  handleFilterChange();
}

function handleExpandChange(value: Array<string | number>) {
  expandedRowKeys.value = value;
}

// ==================== 辅助函数 ====================

function getStatusTheme(status: RentalStatus): 'success' | 'default' {
  return status === RentalStatus.Active ? 'success' : 'default';
}

function getUtilityBillStatusTheme(status: UtilityBillStatus): 'warning' | 'success' | 'default' {
  switch (status) {
    case UtilityBillStatus.Pending:
      return 'warning';
    case UtilityBillStatus.Paid:
      return 'success';
    default:
      return 'default';
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchCommunities();
  fetchData();
});

onUnmounted(() => {
  isUnmounted = true;
});
</script>
<style lang="less" scoped>
.rental-list {
  .list-card-container {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
  }

  .left-operation-container {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: var(--td-comp-margin-xxl);

    :deep(.t-select) {
      width: 140px;
    }
  }

  .tenant-name {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .room-info {
    color: var(--td-text-color-primary);
  }

  .amount {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  // 展开行样式
  .expanded-bills-container {
    padding: 12px 16px;
    background: var(--td-bg-color-container-hover);
    border-radius: 6px;
  }

  .expanded-bills-title {
    font-weight: 500;
    margin-bottom: 8px;
    color: var(--td-text-color-primary);
  }

  .expanded-bills-empty {
    padding: 12px 16px;
    color: var(--td-text-color-secondary);
    text-align: center;
  }
}
</style>
