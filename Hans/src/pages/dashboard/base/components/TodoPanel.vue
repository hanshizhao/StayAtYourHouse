<template>
  <div class="todo-panel">
    <!-- 顶部日期和统计 -->
    <div class="todo-header">
      <div class="todo-date">
        <span class="date-text">{{ todayDate }}</span>
        <span class="weekday-text">{{ weekdayText }}</span>
      </div>
      <div class="todo-summary">
        <t-tag theme="primary" variant="light"> 待办 {{ totalCount }} 项 </t-tag>
      </div>
    </div>

    <!-- 类型筛选 -->
    <div class="todo-filter">
      <t-select
        v-model="filterType"
        :options="typeOptions"
        placeholder="筛选类型"
        clearable
        size="small"
        @change="handleFilterChange"
      />
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="todo-loading">
      <t-loading text="加载中..." />
    </div>

    <!-- 待办网格 -->
    <div v-else-if="todoItems.length > 0" class="todo-grid">
      <div
        v-for="item in todoItems"
        :key="`${item.type}-${item.id}`"
        class="todo-card"
        :class="`todo-card--${getTodoTypeClass(item.type)}`"
        data-testid="todo-item"
        @click="handleTodoClick(item)"
      >
        <div class="todo-card__header">
          <div class="todo-card__icon" :class="`todo-card__icon--${getTodoTypeClass(item.type)}`">
            <t-icon :name="getTodoIcon(item.type)" size="18px" />
          </div>
          <span class="todo-card__type" :class="`todo-card__type--${getTodoTypeClass(item.type)}`">
            {{ getTypeLabel(item.type) }}
          </span>
        </div>
        <div class="todo-card__room">{{ item.roomInfo }}</div>
        <div class="todo-card__detail">
          <template v-if="item.type === TodoType.Utility">
            ¥{{ formatMoney(item.amount ?? 0) }}
          </template>
          <template v-else-if="item.type === TodoType.Rental">
            {{ item.tenantName }} · ¥{{ formatMoney(item.monthlyRent ?? 0) }}/月
          </template>
          <template v-else>
            {{ truncateText(item.description, 12) }}
          </template>
        </div>
        <div v-if="item.type === TodoType.Rental && item.deferralCount > 0" class="todo-card__badge">
          宽限{{ item.deferralCount }}次
        </div>
        <t-icon name="chevron-right" class="todo-card__arrow" size="16px" />
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="todo-empty">
      <t-icon name="check-circle" size="48px" style="color: var(--td-success-color)" />
      <p>暂无待办事项</p>
    </div>

    <!-- 分页器 -->
    <div v-if="totalCount > 0" class="todo-pagination">
      <t-pagination
        v-model="currentPage"
        :total="totalCount"
        :page-size="pageSize"
        :page-size-options="[12, 24, 36]"
        size="small"
        show-jumper
        @change="handlePageChange"
        @page-size-change="handlePageSizeChange"
      />
    </div>

    <!-- 水电费收款弹窗 -->
    <pay-utility-dialog
      v-model:visible="payUtilityDialogVisible"
      :bill="selectedUtilityBill"
      @success="handlePaySuccess"
    />

    <!-- 催收房租弹窗 -->
    <rental-reminder-dialog
      v-model:visible="rentalReminderDialogVisible"
      :reminder="selectedRentalReminder"
      @success="handleRentalSuccess"
    />

    <!-- 维修详情弹窗 -->
    <maintenance-detail-dialog
      v-model:visible="maintenanceDetailDialogVisible"
      :record="selectedMaintenanceRecord"
      @success="handleMaintenanceSuccess"
    />
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { MaintenanceDetail } from '@/api/model/maintenanceModel';
import { MaintenancePriority } from '@/api/model/maintenanceModel';
import type { UtilityBillItem } from '@/api/model/meterModel';
import type { TodoItem, TodoListResult } from '@/api/model/todoModel';
import { TodoType } from '@/api/model/todoModel';
import { getTodoList } from '@/api/todo';
import { formatMoney } from '@/utils/format';

import MaintenanceDetailDialog from './MaintenanceDetailDialog.vue';
import PayUtilityDialog from './PayUtilityDialog.vue';
import RentalReminderDialog from './RentalReminderDialog.vue';

defineOptions({
  name: 'TodoPanel',
});

// ==================== 类型定义 ====================

type FilterTypeValue = TodoType | undefined;

// ==================== 状态 ====================

const loading = ref(false);
const todoItems = ref<TodoItem[]>([]);
const totalCount = ref(0);

// 分页状态
const currentPage = ref(1);
const pageSize = ref(12);

// 筛选状态
const filterType = ref<FilterTypeValue>(undefined);

const typeOptions = [
  { label: '全部类型', value: undefined },
  { label: '水电费', value: TodoType.Utility },
  { label: '催收房租', value: TodoType.Rental },
  { label: '维修', value: TodoType.Maintenance },
];

// 弹窗状态
const payUtilityDialogVisible = ref(false);
const selectedUtilityBill = ref<UtilityBillItem | null>(null);

const rentalReminderDialogVisible = ref(false);
const selectedRentalReminder = ref<TodoItem | null>(null);

const maintenanceDetailDialogVisible = ref(false);
const selectedMaintenanceRecord = ref<MaintenanceDetail | null>(null);

// ==================== 计算属性 ====================

const currentDate = computed(() => new Date());

const todayDate = computed(() => {
  const date = currentDate.value;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

const weekdayText = computed(() => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[currentDate.value.getDay()];
});

// ==================== 数据获取 ====================

async function fetchTodos() {
  loading.value = true;
  try {
    const res: TodoListResult | undefined = await getTodoList(filterType.value, currentPage.value, pageSize.value);
    todoItems.value = res?.items || [];
    totalCount.value = res?.total ?? 0;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取待办数据失败');
  } finally {
    loading.value = false;
  }
}

function handleFilterChange() {
  currentPage.value = 1;
  fetchTodos();
}

function handlePageChange({ current }: { current: number }) {
  currentPage.value = current;
  fetchTodos();
}

function handlePageSizeChange(newPageSize: number) {
  currentPage.value = 1;
  pageSize.value = newPageSize;
  fetchTodos();
}

// ==================== 事件处理 ====================

function handleTodoClick(item: TodoItem) {
  if (item.type === TodoType.Utility) {
    selectedUtilityBill.value = item.utilityBill ?? null;
    payUtilityDialogVisible.value = true;
  } else if (item.type === TodoType.Rental) {
    selectedRentalReminder.value = item;
    rentalReminderDialogVisible.value = true;
  } else {
    selectedMaintenanceRecord.value = item.maintenanceDetail ?? null;
    maintenanceDetailDialogVisible.value = true;
  }
}

function handlePaySuccess() {
  payUtilityDialogVisible.value = false;
  selectedUtilityBill.value = null;
  fetchTodos();
}

function handleRentalSuccess() {
  rentalReminderDialogVisible.value = false;
  selectedRentalReminder.value = null;
  fetchTodos();
}

function handleMaintenanceSuccess() {
  maintenanceDetailDialogVisible.value = false;
  selectedMaintenanceRecord.value = null;
  fetchTodos();
}

// ==================== 辅助函数 ====================

function getTodoIcon(type: TodoType): string {
  if (type === TodoType.Utility) return 'money-circle';
  if (type === TodoType.Rental) return 'home';
  return 'tool';
}

function getTodoTypeClass(type: TodoType): string {
  if (type === TodoType.Utility) return 'utility';
  if (type === TodoType.Rental) return 'rental';
  return 'maintenance';
}

function getTypeLabel(type: TodoType): string {
  if (type === TodoType.Utility) return '水电费';
  if (type === TodoType.Rental) return '催收房租';
  return '维修';
}

function truncateText(text?: string, maxLen = 12): string {
  if (!text) return '';
  return text.length > maxLen ? `${text.slice(0, maxLen)}...` : text;
}

// ==================== 生命周期 ====================

defineExpose({
  refresh: fetchTodos,
});

onMounted(() => {
  fetchTodos();
});
</script>
<style lang="less" scoped>
.todo-panel {
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);
  padding: 20px;
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--td-component-border);
}

.todo-date {
  display: flex;
  flex-direction: column;
  gap: 4px;

  .date-text {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .weekday-text {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }
}

.todo-filter {
  margin-bottom: 12px;

  :deep(.t-select) {
    width: 120px;
  }
}

.todo-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 420px;
}

// ===== 网格布局 =====
.todo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  min-height: 420px;
}

// ===== 小卡片 =====
.todo-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: all 0.2s ease;
  border-top: 3px solid transparent;

  &:hover {
    background: var(--td-bg-color-specialcomponent);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    transform: translateY(-1px);
  }

  &--utility {
    border-top-color: var(--td-brand-color);
  }

  &--rental {
    border-top-color: var(--td-warning-color);
  }

  &--maintenance {
    border-top-color: var(--td-success-color);
  }
}

.todo-card__header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.todo-card__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  flex-shrink: 0;

  &--utility {
    background: rgba(0, 82, 217, 0.1);
    color: var(--td-brand-color);
  }

  &--rental {
    background: rgba(237, 125, 43, 0.1);
    color: var(--td-warning-color);
  }

  &--maintenance {
    background: rgba(0, 180, 42, 0.1);
    color: var(--td-success-color);
  }
}

.todo-card__type {
  font-size: 11px;
  font-weight: 500;
  padding: 1px 6px;
  border-radius: 4px;

  &--utility {
    background: rgba(0, 82, 217, 0.1);
    color: var(--td-brand-color);
  }

  &--rental {
    background: rgba(237, 125, 43, 0.1);
    color: var(--td-warning-color);
  }

  &--maintenance {
    background: rgba(0, 180, 42, 0.1);
    color: var(--td-success-color);
  }
}

.todo-card__room {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-card__detail {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-card__badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 1px 6px;
  background: rgba(227, 77, 77, 0.1);
  color: var(--td-error-color);
  border-radius: 4px;
  font-size: 11px;
}

.todo-card__arrow {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--td-text-color-placeholder);
}

// ===== 分页器 =====
.todo-pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;

  :deep(.t-pagination) {
    justify-content: center;
  }
}

// ===== 空状态 =====
.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 420px;
  color: var(--td-text-color-placeholder);

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}

// ===== 响应式 =====
@media (max-width: 900px) {
  .todo-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .todo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
