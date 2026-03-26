<template>
  <div class="bill-list">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
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
            @change="handleFilterChange"
          />
          <t-date-picker
            v-model="filterMonth"
            mode="month"
            format="YYYY-MM"
            value-format="YYYY-MM"
            placeholder="选择月份"
            clearable
            data-testid="month-filter"
            @change="handleFilterChange"
          />
        </div>
      </t-row>

      <!-- 数据表格 -->
      <t-table
        :data="data"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        data-testid="bill-table"
        @page-change="handlePageChange"
      >
        <template #tenantName="{ row }">
          <span class="tenant-name">{{ row.tenantName }}</span>
        </template>
        <template #roomInfo="{ row }">
          <span class="room-info">{{ row.roomInfo }}</span>
        </template>
        <template #periodText="{ row }">
          <span>{{ row.periodText }}</span>
        </template>
        <template #totalAmount="{ row }">
          <span class="amount">¥{{ formatMoney(row.totalAmount) }}</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ row.statusText }}
          </t-tag>
        </template>
        <template #daysRemaining="{ row }">
          <span v-if="row.daysRemaining !== null && row.daysRemaining !== undefined" :class="getDaysRemainingClass(row.daysRemaining)">
            {{ getDaysRemainingText(row.daysRemaining) }}
          </span>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #dueDate="{ row }">
          {{ formatDate(row.dueDate) }}
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link
              v-if="row.status !== BillStatus.Paid"
              theme="primary"
              data-testid="collect-button"
              @click="handleCollect(row)"
            >
              催收
            </t-link>
            <t-link theme="primary" data-testid="view-button" @click="handleView(row)">详情</t-link>
            <t-link
              v-if="row.status !== BillStatus.Paid"
              theme="danger"
              data-testid="delete-button"
              @click="handleDelete(row)"
            >
              删除
            </t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 催收弹窗 -->
    <collect-dialog
      v-model:visible="collectDialogVisible"
      :bill="collectingBill"
      @success="handleCollectSuccess"
    />

    <!-- 删除确认对话框 -->
    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      :body="deleteConfirmBody"
      :confirm-btn="{ theme: 'danger', content: '删除', loading: deleteLoading }"
      data-testid="confirm-dialog"
      @confirm="onConfirmDelete"
    >
      <p data-testid="confirm-dialog-message">{{ deleteConfirmBody }}</p>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import type { PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { BillItem, BillListParams } from '@/api/model/billModel';
import { BillStatus } from '@/api/model/billModel';
import { deleteBill, getBillList } from '@/api/bill';
import { getCommunityList } from '@/api/community';
import type { CommunityItem } from '@/api/model/communityModel';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDate, formatMoney } from '@/utils/date';

import CollectDialog from './components/CollectDialog.vue';

defineOptions({
  name: 'BillList',
});

// ==================== 类型定义 ====================

/** 表头固定配置类型 */
interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

// ==================== 状态 ====================
const settingStore = useSettingStore();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'tenantName', title: '租客姓名', width: 120 },
  { colKey: 'roomInfo', title: '房间信息', width: 200, ellipsis: true },
  { colKey: 'periodText', title: '账单周期', width: 200 },
  { colKey: 'totalAmount', title: '总金额', width: 120 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'daysRemaining', title: '剩余天数', width: 100 },
  { colKey: 'dueDate', title: '应收日期', width: 120 },
  { colKey: 'op', title: '操作', width: 150, fixed: 'right' },
];

// 数据状态
const loading = ref(false);
const data = ref<BillItem[]>([]);
const pagination = ref({
  pageSize: 20,
  total: 0,
  current: 1,
});

// 筛选条件
const filterStatus = ref<string | undefined>(undefined);
const filterCommunityId = ref<number | undefined>(undefined);
const filterMonth = ref<string | undefined>(undefined);

// 小区选项
const communityOptions = ref<SelectOption[]>([]);

// 状态选项
const statusOptions: SelectOption[] = [
  { label: '待收款', value: 'pending' },
  { label: '宽限中', value: 'grace' },
  { label: '已收款', value: 'paid' },
  { label: '已逾期', value: 'overdue' },
];

// 催收弹窗状态
const collectDialogVisible = ref(false);
const collectingBill = ref<BillItem | null>(null);

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingBill = ref<BillItem | null>(null);

const deleteConfirmBody = computed(() => {
  if (deletingBill.value) {
    return `确定要删除租客「${deletingBill.value.tenantName}」的账单吗？删除后无法恢复。`;
  }
  return '';
});

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 数据获取 ====================

// 获取账单列表
async function fetchData() {
  loading.value = true;
  try {
    const res = await getBillList({
      status: filterStatus.value,
      communityId: filterCommunityId.value,
      month: filterMonth.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    data.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取账单列表失败');
  } finally {
    loading.value = false;
  }
}

// 获取小区列表
async function fetchCommunities() {
  try {
    const res = await getCommunityList();
    communityOptions.value = (res || []).map((item: CommunityItem) => ({
      label: item.name,
      value: item.id,
    }));
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取小区列表失败');
  }
}

// 分页变化
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.current = pageInfo.current;
  pagination.value.pageSize = pageInfo.pageSize;
  fetchData();
}

// 筛选变化
function handleFilterChange() {
  pagination.value.current = 1;
  fetchData();
}

// ==================== 操作 ====================

// 催收
function handleCollect(row: BillItem) {
  collectingBill.value = row;
  collectDialogVisible.value = true;
}

// 催收成功回调
function handleCollectSuccess() {
  fetchData();
}

// 查看详情
function handleView(row: BillItem) {
  // TODO: 实现账单详情页后启用
  MessagePlugin.info(`账单详情功能待实现，账单ID: ${row.id}`);
}

// 删除账单
function handleDelete(row: BillItem) {
  deletingBill.value = row;
  deleteConfirmVisible.value = true;
}

// 确认删除
async function onConfirmDelete() {
  if (!deletingBill.value) return;

  deleteLoading.value = true;
  try {
    await deleteBill(deletingBill.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData();
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '删除失败');
  } finally {
    deleteLoading.value = false;
    deletingBill.value = null;
  }
}

// ==================== 辅助函数 ====================

// 获取状态标签主题
function getStatusTheme(status: BillStatus): string {
  switch (status) {
    case BillStatus.Pending:
      return 'warning';
    case BillStatus.Grace:
      return 'primary';
    case BillStatus.Paid:
      return 'success';
    case BillStatus.Overdue:
      return 'danger';
    default:
      return 'default';
  }
}

// 获取剩余天数样式
function getDaysRemainingClass(days: number): string {
  if (days < 0) return 'days-overdue';
  if (days <= 3) return 'days-warning';
  return 'days-normal';
}

// 获取剩余天数文本
function getDaysRemainingText(days: number): string {
  if (days < 0) return `逾期 ${Math.abs(days)} 天`;
  if (days === 0) return '今日到期';
  return `${days} 天`;
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchCommunities();
  fetchData();
});
</script>

<style lang="less" scoped>
.bill-list {
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

    :deep(.t-date-picker) {
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

  .text-secondary {
    color: var(--td-text-color-secondary);
  }

  .days-normal {
    color: var(--td-text-color-primary);
  }

  .days-warning {
    color: var(--td-warning-color);
  }

  .days-overdue {
    color: var(--td-error-color);
    font-weight: 500;
  }
}
</style>
