<template>
  <div class="utility-bill-list">
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
        data-testid="utility-bill-table"
        @page-change="handlePageChange"
      >
        <template #roomInfo="{ row }">
          <span class="room-info">{{ row.roomInfo }}</span>
        </template>
        <template #tenantName="{ row }">
          <span v-if="row.tenantName" class="tenant-name">{{ row.tenantName }}</span>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #periodText="{ row }">
          <span>{{ row.periodStart }} ~ {{ row.periodEnd }}</span>
        </template>
        <template #waterUsage="{ row }">
          <span>{{ row.waterUsage.toFixed(2) }} 吨</span>
        </template>
        <template #electricUsage="{ row }">
          <span>{{ row.electricUsage.toFixed(2) }} 度</span>
        </template>
        <template #waterFee="{ row }">
          <span>¥{{ formatMoney(row.waterFee) }}</span>
        </template>
        <template #electricFee="{ row }">
          <span>¥{{ formatMoney(row.electricFee) }}</span>
        </template>
        <template #totalAmount="{ row }">
          <span class="amount">¥{{ formatMoney(row.totalAmount) }}</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ row.statusText }}
          </t-tag>
        </template>
        <template #remark="{ row }">
          <t-tooltip v-if="row.remark" :content="row.remark" placement="top">
            <span class="remark-text">{{ row.remark }}</span>
          </t-tooltip>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #createdTime="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link
              v-if="row.status === UtilityBillStatus.Pending"
              theme="primary"
              data-testid="pay-button"
              @click="handlePay(row)"
            >
              收款
            </t-link>
            <t-link theme="primary" data-testid="view-button" @click="handleView(row)">详情</t-link>
            <t-link
              v-if="row.status === UtilityBillStatus.Pending"
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

    <!-- 收款弹窗 -->
    <t-dialog
      v-model:visible="payDialogVisible"
      header="水电费收款"
      width="500px"
      :confirm-btn="{ content: '确认收款', loading: payLoading }"
      data-testid="pay-dialog"
      :on-confirm="handlePayConfirm"
      :on-close="handlePayDialogClose"
    >
      <t-form ref="payFormRef" :data="payFormData" :rules="payFormRules" label-align="right" label-width="100px">
        <t-form-item label="房间">
          <span>{{ payingBill?.roomInfo }}</span>
        </t-form-item>
        <t-form-item label="账单周期">
          <span>{{ payingBill?.periodStart }} ~ {{ payingBill?.periodEnd }}</span>
        </t-form-item>
        <t-form-item label="水费">
          <span>¥{{ formatMoney(payingBill?.waterFee || 0) }}</span>
        </t-form-item>
        <t-form-item label="电费">
          <span>¥{{ formatMoney(payingBill?.electricFee || 0) }}</span>
        </t-form-item>
        <t-form-item label="应收金额">
          <span class="total-fee">¥{{ formatMoney(payingBill?.totalAmount || 0) }}</span>
        </t-form-item>
        <t-form-item label="实收金额" name="paidAmount">
          <t-input-number
            v-model="payFormData.paidAmount"
            placeholder="请输入实收金额"
            :min="0"
            :decimal-places="2"
            data-testid="paid-amount-input"
            style="width: 100%"
          />
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="payFormData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            data-testid="pay-remark-input"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 账单详情弹窗 -->
    <t-dialog
      v-model:visible="detailDialogVisible"
      header="账单详情"
      width="500px"
      :footer="false"
      data-testid="detail-dialog"
    >
      <t-descriptions v-if="viewingBill" :column="1" bordered>
        <t-descriptions-item label="房间">{{ viewingBill.roomInfo }}</t-descriptions-item>
        <t-descriptions-item label="租客">{{ viewingBill.tenantName || '-' }}</t-descriptions-item>
        <t-descriptions-item label="账单周期">
          {{ viewingBill.periodStart }} ~ {{ viewingBill.periodEnd }}
        </t-descriptions-item>
        <t-descriptions-item label="用水量">{{ viewingBill.waterUsage.toFixed(2) }} 吨</t-descriptions-item>
        <t-descriptions-item label="用电量">{{ viewingBill.electricUsage.toFixed(2) }} 度</t-descriptions-item>
        <t-descriptions-item label="水费">¥{{ formatMoney(viewingBill.waterFee) }}</t-descriptions-item>
        <t-descriptions-item label="电费">¥{{ formatMoney(viewingBill.electricFee) }}</t-descriptions-item>
        <t-descriptions-item label="总金额">
          <span class="total-fee">¥{{ formatMoney(viewingBill.totalAmount) }}</span>
        </t-descriptions-item>
        <t-descriptions-item label="状态">
          <t-tag :theme="getStatusTheme(viewingBill.status)" variant="light">
            {{ viewingBill.statusText }}
          </t-tag>
        </t-descriptions-item>
        <t-descriptions-item v-if="viewingBill.paidAmount" label="实收金额">
          ¥{{ formatMoney(viewingBill.paidAmount) }}
        </t-descriptions-item>
        <t-descriptions-item v-if="viewingBill.paidDate" label="收款日期">
          {{ formatDate(viewingBill.paidDate) }}
        </t-descriptions-item>
        <t-descriptions-item v-if="viewingBill.remark" label="备注">
          {{ viewingBill.remark }}
        </t-descriptions-item>
        <t-descriptions-item label="创建时间">
          {{ formatDateTime(viewingBill.createdTime) }}
        </t-descriptions-item>
      </t-descriptions>
    </t-dialog>

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
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getCommunityList } from '@/api/community';
import { deleteUtilityBill, getUtilityBills, payUtilityBill } from '@/api/meter';
import type { CommunityItem } from '@/api/model/communityModel';
import type { PayUtilityBillInput, UtilityBillItem, UtilityBillListParams } from '@/api/model/meterModel';
import { UtilityBillStatus } from '@/api/model/meterModel';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDate, formatDateTime } from '@/utils/date';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'UtilityBill',
});

// ==================== 类型定义 ====================

/** 表头固定配置类型 */
interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

/** 收款表单数据 */
interface PayFormData {
  paidAmount?: number;
  remark?: string;
}

// ==================== 状态 ====================

const settingStore = useSettingStore();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 70 },
  { colKey: 'roomInfo', title: '房间', width: 160, ellipsis: true },
  { colKey: 'tenantName', title: '租客', width: 100 },
  { colKey: 'periodText', title: '账单周期', width: 200 },
  { colKey: 'waterUsage', title: '用水量', width: 100 },
  { colKey: 'electricUsage', title: '用电量', width: 100 },
  { colKey: 'waterFee', title: '水费', width: 90 },
  { colKey: 'electricFee', title: '电费', width: 90 },
  { colKey: 'totalAmount', title: '总金额', width: 100 },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'remark', title: '备注', width: 120, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 160 },
  { colKey: 'op', title: '操作', width: 140, fixed: 'right' },
];

// 数据状态
const loading = ref(false);
const data = ref<UtilityBillItem[]>([]);
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
  { label: '已收款', value: 'paid' },
  { label: '已合并', value: 'merged' },
];

// 收款弹窗状态
const payDialogVisible = ref(false);
const payLoading = ref(false);
const payingBill = ref<UtilityBillItem | null>(null);
const payFormRef = ref<FormInstanceFunctions>();
const payFormData = ref<PayFormData>({
  paidAmount: undefined,
  remark: '',
});

const payFormRules: Record<string, FormRule[]> = {
  paidAmount: [{ required: true, message: '请输入实收金额', trigger: 'blur' }],
};

// 详情弹窗状态
const detailDialogVisible = ref(false);
const viewingBill = ref<UtilityBillItem | null>(null);

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingBill = ref<UtilityBillItem | null>(null);

const deleteConfirmBody = computed(() => {
  if (deletingBill.value) {
    return `确定要删除「${deletingBill.value.roomInfo}」的水电账单吗？删除后无法恢复。`;
  }
  return '';
});

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 数据获取 ====================

// 获取水电账单列表
async function fetchData() {
  loading.value = true;
  try {
    const params: UtilityBillListParams = {
      status: filterStatus.value,
      communityId: filterCommunityId.value,
      month: filterMonth.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    };
    const res = await getUtilityBills(params);
    data.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取水电账单列表失败');
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

// 收款
function handlePay(row: UtilityBillItem) {
  payingBill.value = row;
  payFormData.value = {
    paidAmount: row.totalAmount,
    remark: '',
  };
  payDialogVisible.value = true;
}

// 确认收款
async function handlePayConfirm() {
  const valid = await payFormRef.value?.validate();
  if (valid !== true || !payingBill.value) return;

  payLoading.value = true;
  try {
    const input: PayUtilityBillInput = {
      billId: payingBill.value.id,
      paidAmount: payFormData.value.paidAmount!,
      remark: payFormData.value.remark || undefined,
    };
    await payUtilityBill(input);
    MessagePlugin.success('收款成功');
    payDialogVisible.value = false;
    await fetchData();
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '收款失败');
  } finally {
    payLoading.value = false;
  }
}

// 关闭收款弹窗
function handlePayDialogClose() {
  payFormRef.value?.reset();
  payDialogVisible.value = false;
}

// 查看详情
function handleView(row: UtilityBillItem) {
  viewingBill.value = row;
  detailDialogVisible.value = true;
}

// 删除账单
function handleDelete(row: UtilityBillItem) {
  deletingBill.value = row;
  deleteConfirmVisible.value = true;
}

// 确认删除
async function onConfirmDelete() {
  if (!deletingBill.value) return;

  deleteLoading.value = true;
  try {
    await deleteUtilityBill(deletingBill.value.id);
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
function getStatusTheme(status: UtilityBillStatus): 'default' | 'warning' | 'success' | 'primary' {
  switch (status) {
    case UtilityBillStatus.Pending:
      return 'warning';
    case UtilityBillStatus.Paid:
      return 'success';
    case UtilityBillStatus.Merged:
      return 'primary';
    default:
      return 'default';
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchCommunities();
  fetchData();
});
</script>
<style lang="less" scoped>
.utility-bill-list {
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

  .room-info {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .tenant-name {
    color: var(--td-text-color-primary);
  }

  .text-secondary {
    color: var(--td-text-color-secondary);
  }

  .amount {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .remark-text {
    display: inline-block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .total-fee {
    font-weight: 600;
    color: var(--td-brand-color);
  }
}
</style>
