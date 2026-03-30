<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="宽限记录"
    width="600px"
    :footer="false"
    data-testid="deferral-records-dialog"
  >
    <div v-if="loading" class="loading-state">
      <t-loading text="加载中..." />
    </div>

    <div v-else-if="records.length > 0" class="records-table">
      <t-table :data="records" :columns="columns" row-key="id" size="small" hover stripe>
        <template #originalReminderDate="{ row }">
          {{ formatDate(row.originalReminderDate) }}
        </template>
        <template #deferredToDate="{ row }">
          {{ formatDate(row.deferredToDate) }}
        </template>
        <template #createdTime="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
      </t-table>
    </div>

    <div v-else class="empty-state">
      <t-icon name="folder" size="48px" style="color: var(--td-text-color-placeholder)" />
      <p>暂无宽限记录</p>
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { DeferralRecordItem } from '@/api/model/todoModel';
import { getDeferrals } from '@/api/todo';
import { formatDate, formatDateTime } from '@/utils/date';

defineOptions({
  name: 'DeferralRecordsDialog',
});

const props = defineProps<{
  visible: boolean;
  reminderId: number;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
}>();

// ==================== 状态 ====================

const loading = ref(false);
const records = ref<DeferralRecordItem[]>([]);

// 表格配置
const columns: PrimaryTableCol[] = [
  { colKey: 'originalReminderDate', title: '原提醒日期', width: 120, ellipsis: true },
  { colKey: 'deferredToDate', title: '宽限至', width: 116 },
  { colKey: 'deferralDays', title: '宽限天数', width: 100 },
  { colKey: 'remark', title: '备注', width: 150, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 150 },
];

// 计算属性：双向绑定 visible
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// ==================== 监听 ====================

// 弹窗可见性变化处理
watch(
  () => props.visible,
  async (visible) => {
    if (visible && props.reminderId) {
      // 弹窗打开时加载数据
      loading.value = true;
      try {
        const res = await getDeferrals(props.reminderId);
        records.value = res?.items || [];
      } catch (e: unknown) {
        const error = e as { message?: string };
        MessagePlugin.error(error.message || '获取宽限记录失败');
      } finally {
        loading.value = false;
      }
    } else if (!visible) {
      // 弹窗关闭时清理数据
      records.value = [];
    }
  },
  { immediate: true },
);
</script>
<style lang="less" scoped>
.loading-state {
  display: flex;
  justify-content: center;
  padding: 40px 0;
}

.empty-state {
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
