<template>
  <div class="debt-management">
    <t-card :bordered="false" class="debt-main-card">
      <div class="debt-page-header">
        <h2 class="debt-page-title">
          老赖管理
        </h2>
        <t-button theme="primary" data-testid="debt-add-btn" @click="handleCreate">
          <template #icon>
            <t-icon name="add" />
          </template>
          新增欠款
        </t-button>
      </div>

      <div class="debt-filter-bar">
        <t-input
          v-model="searchKeyword"
          placeholder="搜索租客姓名..."
          clearable
          :style="{ width: '280px' }"
          data-testid="debt-search-input"
          @clear="handleSearchClear"
        >
          <template #prefix-icon>
            <t-icon name="search" />
          </template>
        </t-input>

        <div class="debt-status-tabs">
          <button
            v-for="tab in statusTabs"
            :key="tab.value"
            class="debt-status-tab"
            :class="{ 'debt-status-tab--active': currentStatus === tab.value }"
            :data-testid="`debt-tab-${tab.value ?? 'all'}`"
            @click="handleStatusChange(tab.value)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>

      <t-loading :loading="loading">
        <div v-if="debtList.length > 0" class="debt-card-grid">
          <t-row :gutter="[20, 20]">
            <t-col
              v-for="item in debtList"
              :key="item.id"
              :xs="12"
              :sm="6"
              :md="4"
              :lg="4"
              :xl="4"
            >
              <DebtCard
                :data="item"
                @repay="handleRepay"
                @detail="handleDetail"
                @edit="handleEdit"
                @delete="handleDeleteConfirm"
              />
            </t-col>
          </t-row>
        </div>

        <t-empty v-else description="暂无欠款记录" />

        <div v-if="pagination.total > 0" class="debt-pagination">
          <t-pagination
            v-model="pagination.current"
            v-model:page-size="pagination.pageSize"
            :total="pagination.total"
            :page-size-options="[12, 24, 36]"
            show-jumper
            @current-change="handlePageChange"
            @page-size-change="handlePageSizeChange"
          />
        </div>
      </t-loading>
    </t-card>

    <DebtFormDialog
      v-model:visible="formDialogVisible"
      :edit-data="editingDebt"
      @success="fetchData"
    />

    <RepayDialog
      v-model:visible="repayDialogVisible"
      :debt="repayingDebt"
      @success="fetchData"
    />

    <DebtDetailDialog
      v-model:visible="detailDialogVisible"
      :debt-id="detailingDebtId"
      @refresh="fetchData"
    />

    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      :body="deleteConfirmBody"
      confirm-btn="确认删除"
      cancel-btn="取消"
      :confirm-btn-props="{ theme: 'danger' }"
      data-testid="debt-delete-dialog"
      :on-confirm="handleDelete"
    />
  </div>
</template>

<script setup lang="ts">
import type { DebtDetail, DebtListItem } from '@/api/model/debtModel';
import { DebtStatus } from '@/api/model/debtModel';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

import { deleteDebt, getDebtDetail, getDebtList } from '@/api/debt';

import DebtCard from './components/DebtCard.vue';
import DebtDetailDialog from './components/DebtDetailDialog.vue';
import DebtFormDialog from './components/DebtFormDialog.vue';
import RepayDialog from './components/RepayDialog.vue';

defineOptions({ name: 'DebtList' });

interface StatusTab {
  label: string;
  value: DebtStatus | undefined;
}

const statusTabs: StatusTab[] = [
  { label: '全部', value: undefined },
  { label: '进行中', value: DebtStatus.Ongoing },
  { label: '已还清', value: DebtStatus.Settled },
];

const loading = ref(false);
const debtList = ref<DebtListItem[]>([]);
const searchKeyword = ref('');
const currentStatus = ref<DebtStatus | undefined>(undefined);

const pagination = ref({
  current: 1,
  pageSize: 12,
  total: 0,
});

const formDialogVisible = ref(false);
const editingDebt = ref<DebtDetail | null>(null);

const repayDialogVisible = ref(false);
const repayingDebt = ref<DebtListItem | null>(null);

const detailDialogVisible = ref(false);
const detailingDebtId = ref<number | null>(null);

const deleteConfirmVisible = ref(false);
const deletingDebtId = ref<number | null>(null);
const deleteConfirmBody = computed(() =>
  deletingDebtId.value !== null ? '删除后不可恢复，确认删除该欠款记录吗？' : '',
);

async function fetchData() {
  loading.value = true;
  try {
    const res = await getDebtList({
      keyword: searchKeyword.value || undefined,
      status: currentStatus.value,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    debtList.value = res.list;
    pagination.value.total = res.total;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '获取欠款列表失败';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;

watch(searchKeyword, () => {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    pagination.value.current = 1;
    fetchData();
  }, 300);
});

function handleSearchClear() {
  searchKeyword.value = '';
  pagination.value.current = 1;
  fetchData();
}

function handleStatusChange(status: DebtStatus | undefined) {
  currentStatus.value = status;
  pagination.value.current = 1;
  fetchData();
}

function handlePageChange(current: number) {
  pagination.value.current = current;
  fetchData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize;
  pagination.value.current = 1;
  fetchData();
}

function handleCreate() {
  editingDebt.value = null;
  formDialogVisible.value = true;
}

async function handleEdit(item: DebtListItem) {
  try {
    editingDebt.value = await getDebtDetail(item.id);
    formDialogVisible.value = true;
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '获取欠款详情失败';
    MessagePlugin.error(errorMessage);
  }
}

function handleRepay(item: DebtListItem) {
  repayingDebt.value = item;
  repayDialogVisible.value = true;
}

function handleDetail(item: DebtListItem) {
  detailingDebtId.value = item.id;
  detailDialogVisible.value = true;
}

function handleDeleteConfirm(item: DebtListItem) {
  deletingDebtId.value = item.id;
  deleteConfirmVisible.value = true;
}

async function handleDelete() {
  if (deletingDebtId.value === null) return;

  try {
    await deleteDebt(deletingDebtId.value);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    fetchData();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '删除失败';
    MessagePlugin.error(errorMessage);
  }
}

onMounted(() => {
  fetchData();
});

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});
</script>

<style lang="less" scoped>
.debt-management {
  height: 100%;
}

.debt-main-card {
  height: 100%;

  :deep(.t-card__body) {
    padding: 24px 32px;
  }
}

.debt-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.debt-page-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0;
  color: var(--td-text-color-primary);
}

.debt-filter-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
}

.debt-status-tabs {
  display: flex;
  gap: 8px;
}

.debt-status-tab {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 13px;
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-container);
  color: var(--td-text-color-primary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;

  &:hover {
    border-color: var(--td-brand-color);
    color: var(--td-brand-color);
  }

  &--active {
    background: var(--td-brand-color);
    color: #fff;
    border-color: var(--td-brand-color);

    &:hover {
      background: var(--td-brand-color-hover, var(--td-brand-color));
      color: #fff;
      border-color: var(--td-brand-color-hover, var(--td-brand-color));
    }
  }
}

.debt-card-grid {
  margin-top: 24px;
}

.debt-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
}
</style>
