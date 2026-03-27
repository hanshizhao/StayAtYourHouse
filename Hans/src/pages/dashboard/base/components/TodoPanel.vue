<template>
  <div class="todo-panel">
    <!-- 顶部日期和统计 -->
    <div class="todo-header">
      <div class="todo-date">
        <span class="date-text">{{ todayDate }}</span>
        <span class="weekday-text">{{ weekdayText }}</span>
      </div>
      <div v-if="todoData" class="todo-summary">
        <t-tag theme="primary" variant="light"> 待办 {{ todoData.summary.totalCount }} 项 </t-tag>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="todo-loading">
      <t-loading text="加载中..." />
    </div>

    <!-- 空状态 -->
    <div v-else-if="!todoData || todoData.summary.totalCount === 0" class="todo-empty">
      <t-icon name="check-circle" size="48px" style="color: var(--td-success-color)" />
      <p>暂无待办事项</p>
    </div>

    <!-- 待办列表 -->
    <div v-else class="todo-content">
      <!-- 逾期账单 -->
      <div v-if="todoData.overdue.length > 0" class="todo-section" data-testid="overdue-todos">
        <div class="section-header overdue">
          <t-icon name="close-circle" />
          <span>逾期账单</span>
          <t-tag theme="danger" size="small">{{ todoData.overdue.length }}</t-tag>
        </div>
        <div class="section-list">
          <div
            v-for="item in todoData.overdue"
            :key="item.id"
            class="todo-item"
            data-testid="todo-item"
            @click="handleItemClick(item)"
          >
            <div class="item-main">
              <span class="tenant-name">{{ item.tenantName }}</span>
              <span class="room-info">{{ item.roomInfo }}</span>
            </div>
            <div class="item-meta">
              <span class="amount">¥{{ formatMoney(item.totalAmount) }}</span>
              <span class="days-overdue">逾期 {{ Math.abs(item.daysRemaining || 0) }} 天</span>
            </div>
            <t-button
              size="small"
              theme="danger"
              variant="outline"
              data-testid="todo-collect-button"
              @click.stop="handleCollect(item)"
            >
              催收
            </t-button>
          </div>
        </div>
      </div>

      <!-- 宽限到期账单 -->
      <div v-if="todoData.graceExpiring.length > 0" class="todo-section" data-testid="grace-todos">
        <div class="section-header grace">
          <t-icon name="time-filled" />
          <span>宽限到期</span>
          <t-tag theme="warning" size="small">{{ todoData.graceExpiring.length }}</t-tag>
        </div>
        <div class="section-list">
          <div
            v-for="item in todoData.graceExpiring"
            :key="item.id"
            class="todo-item"
            data-testid="todo-item"
            @click="handleItemClick(item)"
          >
            <div class="item-main">
              <span class="tenant-name">{{ item.tenantName }}</span>
              <span class="room-info">{{ item.roomInfo }}</span>
            </div>
            <div class="item-meta">
              <span class="amount">¥{{ formatMoney(item.totalAmount) }}</span>
              <span class="days-grace">宽限今日截止</span>
            </div>
            <t-button
              size="small"
              theme="warning"
              variant="outline"
              data-testid="todo-collect-button"
              @click.stop="handleCollect(item)"
            >
              催收
            </t-button>
          </div>
        </div>
      </div>

      <!-- 今日到期账单 -->
      <div v-if="todoData.dueToday.length > 0" class="todo-section" data-testid="today-todos">
        <div class="section-header today">
          <t-icon name="calendar" />
          <span>今日到期</span>
          <t-tag theme="primary" size="small">{{ todoData.dueToday.length }}</t-tag>
        </div>
        <div class="section-list">
          <div
            v-for="item in todoData.dueToday"
            :key="item.id"
            class="todo-item"
            data-testid="todo-item"
            @click="handleItemClick(item)"
          >
            <div class="item-main">
              <span class="tenant-name">{{ item.tenantName }}</span>
              <span class="room-info">{{ item.roomInfo }}</span>
            </div>
            <div class="item-meta">
              <span class="amount">¥{{ formatMoney(item.totalAmount) }}</span>
              <span class="days-today">今日应收</span>
            </div>
            <t-button
              size="small"
              theme="primary"
              variant="outline"
              data-testid="todo-collect-button"
              @click.stop="handleCollect(item)"
            >
              催收
            </t-button>
          </div>
        </div>
      </div>

      <!-- 即将到期账单 -->
      <div v-if="todoData.upcoming.length > 0" class="todo-section" data-testid="upcoming-todos">
        <div class="section-header upcoming">
          <t-icon name="info-circle" />
          <span>即将到期</span>
          <t-tag theme="default" size="small">{{ todoData.upcoming.length }}</t-tag>
        </div>
        <div class="section-list">
          <div
            v-for="item in todoData.upcoming"
            :key="item.id"
            class="todo-item"
            data-testid="todo-item"
            @click="handleItemClick(item)"
          >
            <div class="item-main">
              <span class="tenant-name">{{ item.tenantName }}</span>
              <span class="room-info">{{ item.roomInfo }}</span>
            </div>
            <div class="item-meta">
              <span class="amount">¥{{ formatMoney(item.totalAmount) }}</span>
              <span class="days-upcoming">{{ item.daysRemaining }} 天后到期</span>
            </div>
            <t-button
              size="small"
              theme="default"
              variant="outline"
              data-testid="todo-collect-button"
              @click.stop="handleCollect(item)"
            >
              催收
            </t-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getTodayTodos } from '@/api/bill';
import type { BillItem, TodoBillsDto } from '@/api/model/billModel';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'TodoPanel',
});

const router = useRouter();
const loading = ref(true);
const todoData = ref<TodoBillsDto | null>(null);

// 共享当前时间，避免跨午夜不一致
const now = new Date();

// 今日日期
const todayDate = computed(() => {
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}年${month}月${day}日`;
});

// 星期
const weekdayText = computed(() => {
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  return weekdays[now.getDay()];
});

// 加载待办数据
const loadTodoData = async () => {
  loading.value = true;
  try {
    const result = await getTodayTodos();
    todoData.value = result;
  } catch {
    MessagePlugin.error('加载待办数据失败');
  } finally {
    loading.value = false;
  }
};

// 跳转到账单页
const navigateToBill = (item: BillItem, action?: string) => {
  router.push({
    path: '/bill/list',
    query: {
      highlight: item.id,
      ...(action && { action }),
    },
  });
};

// 点击待办项 - 跳转到账单页
const handleItemClick = (item: BillItem) => navigateToBill(item);

// 催收按钮 - 跳转到账单页并触发催收
const handleCollect = (item: BillItem) => navigateToBill(item, 'collect');

onMounted(() => {
  loadTodoData();
});

// 暴露刷新方法供父组件调用
defineExpose({
  refresh: loadTodoData,
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
  margin-bottom: 16px;
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

.todo-loading,
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

.todo-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.todo-section {
  .section-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px dashed var(--td-component-border);
    font-size: 14px;
    font-weight: 500;

    &.overdue {
      color: var(--td-error-color);
    }

    &.grace {
      color: var(--td-warning-color);
    }

    &.today {
      color: var(--td-brand-color);
    }

    &.upcoming {
      color: var(--td-text-color-secondary);
    }
  }

  .section-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
}

.todo-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: var(--td-bg-color-container-active);
  }

  .item-main {
    display: flex;
    flex-direction: column;
    gap: 4px;
    flex: 1;
    min-width: 0;

    .tenant-name {
      font-size: 14px;
      font-weight: 500;
      color: var(--td-text-color-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .room-info {
      font-size: 12px;
      color: var(--td-text-color-secondary);
    }
  }

  .item-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
    margin: 0 12px;

    .amount {
      font-size: 14px;
      font-weight: 600;
      color: var(--td-error-color);
    }

    .days-overdue,
    .days-grace,
    .days-today,
    .days-upcoming {
      font-size: 12px;
      color: var(--td-text-color-placeholder);
    }
  }
}

@media (max-width: 768px) {
  .todo-item {
    flex-wrap: wrap;

    .item-meta {
      order: 3;
      width: 100%;
      flex-direction: row;
      justify-content: space-between;
      margin: 8px 0 0 0;
    }
  }
}
</style>
