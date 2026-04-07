<template>
  <div class="maintenance-list">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" data-testid="add-maintenance-button" @click="handleAdd">
            <template #icon><add-icon /></template>
            新增报修
          </t-button>
        </div>
        <div class="filter-container">
          <t-select
            v-model="filterStatus"
            :options="statusFilterOptions"
            placeholder="全部状态"
            clearable
            class="filter-select"
            data-testid="maintenance-status-filter"
            @change="handleFilterChange"
          />
          <t-select
            v-model="filterPriority"
            :options="priorityFilterOptions"
            placeholder="全部优先级"
            clearable
            class="filter-select"
            data-testid="maintenance-priority-filter"
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
        data-testid="maintenance-table"
        @page-change="handlePageChange"
      >
        <template #roomInfo="{ row }">
          <span>{{ row.roomInfo || '-' }}</span>
        </template>
        <template #description="{ row }">
          <t-tooltip v-if="row.description" :content="row.description" placement="top">
            <span class="description-text">{{ row.description }}</span>
          </t-tooltip>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #priority="{ row }">
          <t-tag :theme="getPriorityTheme(row.priority)" variant="light">
            {{ row.priorityText || MaintenancePriorityText[row.priority as MaintenancePriority] }}
          </t-tag>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ row.statusText || MaintenanceStatusText[row.status as MaintenanceStatus] }}
          </t-tag>
        </template>
        <template #reportDate="{ row }">
          {{ formatDate(row.reportDate) }}
        </template>
        <template #cost="{ row }">
          <span>{{ row.cost != null ? `¥${row.cost.toFixed(2)}` : '-' }}</span>
        </template>
        <template #repairPerson="{ row }">
          <span>{{ row.repairPerson || '-' }}</span>
        </template>
        <template #createdTime="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" data-testid="view-maintenance-button" @click="handleView(row)">查看</t-link>
            <t-link theme="primary" data-testid="edit-maintenance-button" @click="handleEdit(row)">编辑</t-link>
            <t-link
              v-if="row.status !== MaintenanceStatus.Completed"
              theme="warning"
              data-testid="complete-maintenance-button"
              @click="handleComplete(row)"
            >
              标记完成
            </t-link>
            <t-link theme="danger" data-testid="delete-maintenance-button" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 完成维修确认对话框 -->
    <t-dialog
      v-model:visible="completeDialogVisible"
      header="确认完成维修"
      width="480px"
      :confirm-btn="{ content: '确认完成', loading: completeLoading }"
      data-testid="complete-dialog"
      :on-confirm="onConfirmComplete"
    >
      <p>确定将此维修记录标记为已完成吗？</p>
      <t-form label-align="right" label-width="90px" style="margin-top: 16px">
        <t-form-item label="实际费用">
          <t-input-number
            v-model="completeForm.actualCost"
            theme="normal"
            placeholder="请输入实际费用"
            :min="0"
            :decimal-places="2"
            suffix="元"
            data-testid="complete-actual-cost-input"
          />
        </t-form-item>
        <t-form-item label="备注">
          <t-textarea
            v-model="completeForm.remark"
            placeholder="请输入备注"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            data-testid="complete-remark-input"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      width="480px"
      :confirm-btn="{ theme: 'danger', content: '删除', loading: deleteLoading }"
      data-testid="delete-dialog"
      @confirm="onConfirmDelete"
    >
      <p data-testid="delete-dialog-message">{{ deleteConfirmBody }}</p>
    </t-dialog>

    <!-- 查看详情对话框 -->
    <t-dialog
      v-model:visible="detailDialogVisible"
      header="维修记录详情"
      width="560px"
      :footer="false"
      data-testid="detail-dialog"
    >
      <template v-if="currentRecord">
        <t-descriptions :data="detailData" :column="2" bordered />
      </template>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { AddIcon } from 'tdesign-icons-vue-next';
import type { PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { completeMaintenance, deleteMaintenance, getMaintenanceList } from '@/api/maintenance';
import type { MaintenanceDetail, MaintenanceListParams, MaintenanceListResult } from '@/api/model/maintenanceModel';
import {
  MaintenancePriority,
  MaintenancePriorityText,
  MaintenanceStatus,
  MaintenanceStatusText,
} from '@/api/model/maintenanceModel';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDate, formatDateTime } from '@/utils/date';

defineOptions({
  name: 'MaintenanceList',
});

// ==================== 类型定义 ====================

interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

interface CompleteFormData {
  actualCost?: number;
  remark?: string;
}

// ==================== 状态 ====================

const router = useRouter();
const settingStore = useSettingStore();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'roomInfo', title: '房间', width: 140 },
  { colKey: 'description', title: '描述', width: 180, ellipsis: true },
  { colKey: 'priority', title: '优先级', width: 100 },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'reportDate', title: '报修日期', width: 120 },
  { colKey: 'cost', title: '预算费用', width: 100 },
  { colKey: 'repairPerson', title: '维修人员', width: 100 },
  { colKey: 'createdTime', title: '创建时间', width: 160 },
  { colKey: 'op', title: '操作', width: 200, fixed: 'right' },
];

// 数据状态
const loading = ref(false);
const data = ref<MaintenanceDetail[]>([]);
const pagination = ref({
  defaultPageSize: 20,
  total: 0,
  defaultCurrent: 1,
});

// 筛选
const filterStatus = ref<MaintenanceStatus | undefined>(undefined);
const filterPriority = ref<MaintenancePriority | undefined>(undefined);

const statusFilterOptions: SelectOption[] = [
  { label: '待处理', value: MaintenanceStatus.Pending },
  { label: '进行中', value: MaintenanceStatus.InProgress },
  { label: '已完成', value: MaintenanceStatus.Completed },
];

const priorityFilterOptions: SelectOption[] = [
  { label: '紧急', value: MaintenancePriority.Urgent },
  { label: '普通', value: MaintenancePriority.Normal },
  { label: '低优先级', value: MaintenancePriority.Low },
];

// 完成对话框
const completeDialogVisible = ref(false);
const completeLoading = ref(false);
const completingRecord = ref<MaintenanceDetail | null>(null);
const completeForm = ref<CompleteFormData>({});

// 删除对话框
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingRecord = ref<MaintenanceDetail | null>(null);
const deleteConfirmBody = computed(() => {
  if (deletingRecord.value) {
    return `确定要删除「${deletingRecord.value.roomInfo}」的维修记录吗？删除后无法恢复。`;
  }
  return '';
});

// 详情对话框
const detailDialogVisible = ref(false);
const currentRecord = ref<MaintenanceDetail | null>(null);

const detailData = computed(() => {
  if (!currentRecord.value) return [];
  const r = currentRecord.value;
  return [
    { label: '房间', content: r.roomInfo || '-' },
    { label: '优先级', content: r.priorityText || MaintenancePriorityText[r.priority as MaintenancePriority] },
    { label: '状态', content: r.statusText || MaintenanceStatusText[r.status as MaintenanceStatus] },
    { label: '报修日期', content: formatDate(r.reportDate) },
    { label: '描述', content: r.description || '-' },
    { label: '预算费用', content: r.cost != null ? `¥${r.cost.toFixed(2)}` : '-' },
    { label: '维修人员', content: r.repairPerson || '-' },
    { label: '联系电话', content: r.repairPhone || '-' },
    { label: '完成日期', content: formatDate(r.completedDate) },
    { label: '备注', content: r.remark || '-' },
    { label: '创建时间', content: formatDateTime(r.createdTime) },
  ];
});

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 方法 ====================

/** 获取优先级主题 */
function getPriorityTheme(priority: MaintenancePriority): 'danger' | 'warning' | 'default' {
  const themes: Record<MaintenancePriority, 'danger' | 'warning' | 'default'> = {
    [MaintenancePriority.Urgent]: 'danger',
    [MaintenancePriority.Normal]: 'warning',
    [MaintenancePriority.Low]: 'default',
  };
  return themes[priority] ?? 'default';
}

/** 获取状态主题 */
function getStatusTheme(status: MaintenanceStatus): 'warning' | 'primary' | 'success' {
  const themes: Record<MaintenanceStatus, 'warning' | 'primary' | 'success'> = {
    [MaintenanceStatus.Pending]: 'warning',
    [MaintenanceStatus.InProgress]: 'primary',
    [MaintenanceStatus.Completed]: 'success',
  };
  return themes[status] ?? 'warning';
}

/** 获取维修记录列表 */
async function fetchData() {
  loading.value = true;
  try {
    const params: MaintenanceListParams = {
      page: pagination.value.defaultCurrent,
      pageSize: pagination.value.defaultPageSize,
    };
    if (filterStatus.value !== undefined) {
      params.status = filterStatus.value;
    }
    if (filterPriority.value !== undefined) {
      params.priority = filterPriority.value;
    }
    const res: MaintenanceListResult = await getMaintenanceList(params);
    data.value = res?.items || [];
    pagination.value.total = res?.total || 0;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取维修列表失败');
  } finally {
    loading.value = false;
  }
}

/** 筛选变化 */
function handleFilterChange() {
  pagination.value.defaultCurrent = 1;
  fetchData();
}

/** 分页 */
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.defaultCurrent = pageInfo.current;
  pagination.value.defaultPageSize = pageInfo.pageSize;
  fetchData();
}

/** 新增报修 */
function handleAdd() {
  router.push('/maintenance/add');
}

/** 查看 */
function handleView(row: MaintenanceDetail) {
  currentRecord.value = row;
  detailDialogVisible.value = true;
}

/** 编辑 */
function handleEdit(row: MaintenanceDetail) {
  router.push(`/maintenance/edit/${row.id}`);
}

/** 标记完成 */
function handleComplete(row: MaintenanceDetail) {
  completingRecord.value = row;
  completeForm.value = { actualCost: row.cost, remark: '' };
  completeDialogVisible.value = true;
}

/** 确认完成 */
async function onConfirmComplete() {
  if (!completingRecord.value) return;

  completeLoading.value = true;
  try {
    await completeMaintenance(completingRecord.value.id, {
      actualCost: completeForm.value.actualCost,
      remark: completeForm.value.remark || undefined,
    });
    MessagePlugin.success('维修已完成');
    completeDialogVisible.value = false;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '操作失败');
  } finally {
    completeLoading.value = false;
    completingRecord.value = null;
  }
}

/** 删除 */
function handleDelete(row: MaintenanceDetail) {
  deletingRecord.value = row;
  deleteConfirmVisible.value = true;
}

/** 确认删除 */
async function onConfirmDelete() {
  if (!deletingRecord.value) return;

  deleteLoading.value = true;
  try {
    await deleteMaintenance(deletingRecord.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
    deleteConfirmVisible.value = false;
  } finally {
    deleteLoading.value = false;
    deletingRecord.value = null;
  }
}

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.maintenance-list {
  .list-card-container {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
  }

  .left-operation-container {
    display: flex;
    align-items: center;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .filter-container {
    display: flex;
    gap: 16px;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .filter-select {
    width: 160px;
  }

  .description-text {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .text-secondary {
    color: var(--td-text-color-secondary);
  }
}
</style>
