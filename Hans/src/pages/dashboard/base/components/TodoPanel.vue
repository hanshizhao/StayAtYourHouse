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

    <!-- 加载状态 -->
    <div v-if="loading" class="todo-loading">
      <t-loading text="加载中..." />
    </div>

    <!-- 待办列表 -->
    <div v-else-if="todoItems.length > 0" class="todo-list">
      <div v-for="item in todoItems" :key="item.id" class="todo-item" @click="handleTodoClick(item)">
        <div class="todo-icon">
          <t-icon name="money-circle" size="20px" style="color: var(--td-warning-color)" />
        </div>
        <div class="todo-content">
          <div class="todo-title">{{ item.roomInfo }}</div>
          <div class="todo-desc">
            水电费待收款 ¥{{ formatMoney(item.totalAmount) }}
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
  </div>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { getUtilityBills } from '@/api/meter';
import type { UtilityBillItem } from '@/api/model/meterModel';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'TodoPanel',
});

const router = useRouter();

// 共享当前时间，避免跨午夜不一致
const now = new Date();

// 状态
const loading = ref(false);
const todoItems = ref<UtilityBillItem[]>([]);

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

// 待办数量
const todoCount = computed(() => todoItems.value.length);

// 获取待办数据
async function fetchTodos() {
  loading.value = true;
  try {
    const res = await getUtilityBills({ status: 'pending', pageSize: 10 });
    todoItems.value = res?.items || [];
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取待办数据失败');
  } finally {
    loading.value = false;
  }
}

// 点击待办项
function handleTodoClick(item: UtilityBillItem) {
  router.push({
    path: '/utility/bill',
    query: { status: 'pending', highlight: item.id },
  });
}

// 暴露刷新方法供父组件调用
defineExpose({
  refresh: fetchTodos,
});

// 生命周期
onMounted(() => {
  fetchTodos();
});

onUnmounted(() => {
  // 清理资源
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
  transition: background-color 0.2s;

  &:hover {
    background: var(--td-bg-color-specialcomponent);
  }
}

.todo-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--td-warning-color-1);
  margin-right: 12px;
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
  margin-top: 2px;
}

.todo-arrow {
  color: var(--td-text-color-placeholder);
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
