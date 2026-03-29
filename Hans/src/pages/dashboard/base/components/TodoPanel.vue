<template>
  <div class="todo-panel">
    <!-- 顶部日期和统计 -->
    <div class="todo-header">
      <div class="todo-date">
        <span class="date-text">{{ todayDate }}</span>
        <span class="weekday-text">{{ weekdayText }}</span>
      </div>
      <div class="todo-summary">
        <t-tag theme="primary" variant="light"> 待办 {{ todoCount }} 项 </t-tag>
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

    <!-- 待办列表 -->
    <div v-else-if="todoItems.length > 0" class="todo-list">
      <div
        v-for="item in todoItems"
        :key="`${item.type}-${item.id}`"
        class="todo-item"
        :class="`todo-item--${getTodoTypeClass(item.type)}`"
        @click="handleTodoClick(item)"
      >
        <div class="todo-icon" :class="`todo-icon--${getTodoTypeClass(item.type)}`">
          <t-icon :name="getTodoIcon(item.type)" size="20px" />
        </div>
        <div class="todo-content">
          <div class="todo-title">{{ item.roomInfo }}</div>
          <div class="todo-desc">
            <template v-if="item.type === TodoType.Utility">
              <span class="todo-type-tag todo-type-tag--utility">水电费</span>
              待收款 ¥{{ formatMoney(item.amount ?? 0) }}
            </template>
            <template v-else>
              <span class="todo-type-tag todo-type-tag--rental">催收房租</span>
              {{ item.tenantName }} · ¥{{ formatMoney(item.monthlyRent ?? 0) }}/月
              <span v-if="item.deferralCount > 0" class="deferral-badge"> 宽限{{ item.deferralCount }}次 </span>
            </template>
          </div>
        </div>
        <div class="todo-arrow">
          <t-icon name="chevron-right" size="16px" />
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="todo-empty">
      <t-icon name="check-circle" size="48px" style="color: var(--td-success-color)" />
      <p>暂无待办事项</p>
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
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { UtilityBillItem } from '@/api/model/meterModel';
import type { TodoItem, TodoListResult } from '@/api/model/todoModel';
import { TodoType } from '@/api/model/todoModel';
import { getTodoList } from '@/api/todo';
import { formatMoney } from '@/utils/format';

import PayUtilityDialog from './PayUtilityDialog.vue';
import RentalReminderDialog from './RentalReminderDialog.vue';

defineOptions({
  name: 'TodoPanel',
});

// ==================== 类型定义 ====================

type FilterTypeValue = TodoType | undefined;

// ==================== 状态 ====================

// 加载状态
const loading = ref(false);
const todoItems = ref<TodoItem[]>([]);

// 筛选状态
const filterType = ref<FilterTypeValue>(undefined);

// 类型筛选选项
const typeOptions = [
  { label: '全部类型', value: undefined },
  { label: '水电费', value: TodoType.Utility },
  { label: '催收房租', value: TodoType.Rental },
];

// 弹窗状态
const payUtilityDialogVisible = ref(false);
const selectedUtilityBill = ref<UtilityBillItem | null>(null);

const rentalReminderDialogVisible = ref(false);
const selectedRentalReminder = ref<TodoItem | null>(null);

// ==================== 计算属性 ====================

// 当前日期（每次访问获取最新）
const currentDate = computed(() => new Date());

// 今日日期
const todayDate = computed(() => {
  const date = currentDate.value;
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
});

// 星期
const weekdayText = computed(() => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[currentDate.value.getDay()];
});

// 待办数量
const todoCount = computed(() => todoItems.value.length);

// ==================== 数据获取 ====================

// 获取待办数据
async function fetchTodos() {
  loading.value = true;
  try {
    const res: TodoListResult | undefined = await getTodoList(filterType.value, 1, 10);
    todoItems.value = res?.items || [];
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取待办数据失败');
  } finally {
    loading.value = false;
  }
}

// 筛选变化
function handleFilterChange() {
  fetchTodos();
}

// ==================== 事件处理 ====================

// 点击待办项
function handleTodoClick(item: TodoItem) {
  if (item.type === TodoType.Utility) {
    // 水电费待办 - 打开收款弹窗
    selectedUtilityBill.value = item.utilityBill ?? null;
    payUtilityDialogVisible.value = true;
  } else {
    // 催收房租待办 - 打开催收弹窗
    selectedRentalReminder.value = item;
    rentalReminderDialogVisible.value = true;
  }
}

// 水电费收款成功
function handlePaySuccess() {
  payUtilityDialogVisible.value = false;
  selectedUtilityBill.value = null;
  fetchTodos();
}

// 催收房租操作成功（宽限/续租）
function handleRentalSuccess() {
  rentalReminderDialogVisible.value = false;
  selectedRentalReminder.value = null;
  fetchTodos();
}

// ==================== 辅助函数 ====================

// 获取待办类型图标
function getTodoIcon(type: TodoType): string {
  return type === TodoType.Utility ? 'money-circle' : 'home';
}

// 获取待办类型样式类名
function getTodoTypeClass(type: TodoType): string {
  return type === TodoType.Utility ? 'utility' : 'rental';
}

// ==================== 生命周期 ====================

// 暴露刷新方法供父组件调用
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
  padding: 40px 0;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.todo-item {
  display: flex;
  align-items: center;
  padding: 12px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: all 0.2s ease;
  border-left: 3px solid transparent;

  &:hover {
    background: var(--td-bg-color-specialcomponent);
    transform: translateX(2px);
    box-shadow: var(--todo-hover-shadow);
  }

  // 水电费样式
  &--utility {
    --todo-hover-shadow: 0 2px 8px rgba(0, 82, 217, 0.1);
    border-left-color: var(--td-brand-color);
  }

  // 催收房租样式
  &--rental {
    --todo-hover-shadow: 0 2px 8px rgba(237, 125, 43, 0.1);
    border-left-color: var(--td-warning-color);
  }
}

.todo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  margin-right: 12px;
  flex-shrink: 0;

  // 水电费图标
  &--utility {
    background: rgba(0, 82, 217, 0.1);
    color: var(--td-brand-color);
  }

  // 催收房租图标
  &--rental {
    background: rgba(237, 125, 43, 0.1);
    color: var(--td-warning-color);
  }
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--td-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-desc {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.todo-type-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;

  &--utility {
    background: rgba(0, 82, 217, 0.1);
    color: var(--td-brand-color);
  }

  &--rental {
    background: rgba(237, 125, 43, 0.1);
    color: var(--td-warning-color);
  }
}

.deferral-badge {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  background: rgba(227, 77, 77, 0.1);
  color: var(--td-error-color);
  border-radius: 4px;
  font-size: 11px;
}

.todo-arrow {
  color: var(--td-text-color-placeholder);
  flex-shrink: 0;
}

.todo-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
  color: var(--td-text-color-placeholder);

  p {
    margin-top: 12px;
    font-size: 14px;
  }
}
</style>
