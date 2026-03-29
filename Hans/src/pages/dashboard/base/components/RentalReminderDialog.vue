<template>
  <t-dialog v-model:visible="dialogVisible" header="催收房租" width="560px" :footer="false" data-testid="rental-reminder-dialog">
    <div v-if="reminder" class="rental-reminder-content">
      <!-- 租客信息 -->
      <div class="info-section">
        <div class="section-title">租客信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">房间</span>
            <span class="info-value">{{ reminder.roomInfo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">租客</span>
            <span class="info-value">{{ reminder.tenantName }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">月租金</span>
            <span class="info-value amount">¥{{ formatMoney(reminder.monthlyRent ?? 0) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">合同到期</span>
            <span class="info-value">{{ formatDate(reminder.rentalReminder?.contractEndDate) }}</span>
          </div>
        </div>
      </div>

      <!-- 宽限信息 -->
      <div class="info-section">
        <div class="section-title">
          宽限记录
          <t-link v-if="reminder.deferralCount > 0" theme="primary" hover="color" @click="showDeferralRecords">
            查看详情
          </t-link>
        </div>
        <div class="deferral-info">
          <t-tag :theme="reminder.deferralCount > 0 ? 'warning' : 'default'" variant="light">
            已宽限 {{ reminder.deferralCount }} 次
          </t-tag>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <t-button variant="outline" @click="handleDefer">
          <template #icon><t-icon name="time" /></template>
          宽限处理
        </t-button>
        <t-button theme="primary" @click="handleRenew">
          <template #icon><t-icon name="refresh" /></template>
          续租
        </t-button>
        <t-button variant="outline" theme="default" @click="handleClose"> 取消 </t-button>
      </div>
    </div>

    <div v-else class="empty-state">
      <t-icon name="error-circle" size="48px" style="color: var(--td-text-color-placeholder)" />
      <p>暂无催收信息</p>
    </div>

    <!-- 宽限弹窗 -->
    <defer-dialog v-model:visible="deferDialogVisible" :reminder-id="reminder?.rentalReminder?.id ?? 0" @success="handleDeferSuccess" />

    <!-- 续租弹窗 -->
    <renew-rental-dialog v-model:visible="renewDialogVisible" :reminder="reminder" @success="handleRenewSuccess" />

    <!-- 宽限记录弹窗 -->
    <deferral-records-dialog v-model:visible="deferralRecordsDialogVisible" :reminder-id="reminder?.rentalReminder?.id ?? 0" />
  </t-dialog>
</template>
<script setup lang="ts">
import { computed, ref } from 'vue';

import type { TodoItem } from '@/api/model/todoModel';
import { formatDate } from '@/utils/date';
import { formatMoney } from '@/utils/format';

import DeferDialog from './DeferDialog.vue';
import DeferralRecordsDialog from './DeferralRecordsDialog.vue';
import RenewRentalDialog from './RenewRentalDialog.vue';

defineOptions({
  name: 'RentalReminderDialog',
});

// ==================== Props & Emits ====================

const props = defineProps<{
  visible: boolean;
  reminder: TodoItem | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// ==================== 状态 ====================

// 子弹窗状态
const deferDialogVisible = ref(false);
const renewDialogVisible = ref(false);
const deferralRecordsDialogVisible = ref(false);

// 计算属性：双向绑定 visible
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// ==================== 事件处理 ====================

// 宽限处理
function handleDefer() {
  deferDialogVisible.value = true;
}

// 宽限成功
function handleDeferSuccess() {
  deferDialogVisible.value = false;
  emit('success');
}

// 续租
function handleRenew() {
  renewDialogVisible.value = true;
}

// 续租成功
function handleRenewSuccess() {
  renewDialogVisible.value = false;
  emit('success');
}

// 查看宽限记录
function showDeferralRecords() {
  deferralRecordsDialogVisible.value = true;
}

// 关闭弹窗
function handleClose() {
  dialogVisible.value = false;
}
</script>
<style lang="less" scoped>
.rental-reminder-content {
  .info-section {
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--td-component-border);

    &:last-of-type {
      border-bottom: none;
      margin-bottom: 16px;
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;

    :deep(.t-link) {
      font-size: 12px;
      font-weight: normal;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .info-label {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  .info-value {
    font-size: 14px;
    color: var(--td-text-color-primary);

    &.amount {
      font-weight: 600;
      color: var(--td-warning-color);
    }
  }

  .deferral-info {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-border);
  }
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
