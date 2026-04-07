<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="维修详情"
    width="560px"
    :footer="false"
    data-testid="maintenance-detail-dialog"
  >
    <div v-if="record" class="maintenance-detail-content">
      <!-- 基本信息 -->
      <div class="info-section">
        <div class="section-title">基本信息</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">房间</span>
            <span class="info-value">{{ record.roomInfo }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">状态</span>
            <span class="info-value">
              <t-tag :theme="statusTheme" variant="light" size="small">
                {{ record.statusText }}
              </t-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">优先级</span>
            <span class="info-value">
              <t-tag :theme="priorityTheme" variant="light" size="small">
                {{ record.priorityText }}
              </t-tag>
            </span>
          </div>
          <div class="info-item">
            <span class="info-label">报修日期</span>
            <span class="info-value">{{ record.reportDate }}</span>
          </div>
        </div>
      </div>

      <!-- 维修描述 -->
      <div class="info-section">
        <div class="section-title">维修描述</div>
        <div class="description-text">{{ record.description }}</div>
      </div>

      <!-- 费用与人员 -->
      <div class="info-section">
        <div class="section-title">费用与人员</div>
        <div class="info-grid">
          <div class="info-item">
            <span class="info-label">预估费用</span>
            <span class="info-value amount">¥{{ formatMoney(record.cost ?? 0) }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">维修人员</span>
            <span class="info-value">{{ record.repairPerson || '-' }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">联系电话</span>
            <span class="info-value">{{ record.repairPhone || '-' }}</span>
          </div>
          <div v-if="record.completedDate" class="info-item">
            <span class="info-label">完成日期</span>
            <span class="info-value">{{ record.completedDate }}</span>
          </div>
        </div>
      </div>

      <!-- 备注 -->
      <div v-if="record.remark" class="info-section">
        <div class="section-title">备注</div>
        <div class="description-text">{{ record.remark }}</div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <t-button v-if="canComplete" theme="success" :loading="completing" @click="handleComplete">
          <template #icon><t-icon name="check-circle" /></template>
          标记完成
        </t-button>
        <t-button variant="outline" theme="primary" @click="goToMaintenance">
          <template #icon><t-icon name="browse" /></template>
          前往维修管理
        </t-button>
        <t-button variant="outline" theme="default" @click="handleClose">关闭</t-button>
      </div>
    </div>

    <div v-else class="empty-state">
      <t-icon name="error-circle" size="48px" style="color: var(--td-text-color-placeholder)" />
      <p>暂无维修信息</p>
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';

import { completeMaintenance } from '@/api/maintenance';
import type { MaintenanceDetail } from '@/api/model/maintenanceModel';
import { MaintenancePriority, MaintenanceStatus } from '@/api/model/maintenanceModel';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'MaintenanceDetailDialog',
});

// ==================== Props & Emits ====================

const props = defineProps<{
  visible: boolean;
  record: MaintenanceDetail | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// ==================== 状态 ====================

const router = useRouter();
const completing = ref(false);

const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// ==================== 计算属性 ====================

// 是否可标记完成（状态为待处理或进行中）
const canComplete = computed(() => {
  if (!props.record) return false;
  return props.record.status !== MaintenanceStatus.Completed;
});

// 状态标签主题
const statusTheme = computed(() => {
  if (!props.record) return 'default';
  const status = props.record.status;
  if (status === MaintenanceStatus.Completed) return 'success';
  if (status === MaintenanceStatus.InProgress) return 'primary';
  return 'warning';
});

// 优先级标签主题
const priorityTheme = computed(() => {
  if (!props.record) return 'default';
  const priority = props.record.priority;
  if (priority === MaintenancePriority.Urgent) return 'danger';
  if (priority === MaintenancePriority.Normal) return 'warning';
  return 'default';
});

// ==================== 事件处理 ====================

// 标记完成
async function handleComplete() {
  if (!props.record) return;
  completing.value = true;
  try {
    await completeMaintenance(props.record.id, {});
    MessagePlugin.success('维修已标记完成');
    emit('success');
    dialogVisible.value = false;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '操作失败');
  } finally {
    completing.value = false;
  }
}

// 前往维修管理
function goToMaintenance() {
  dialogVisible.value = false;
  router.push('/maintenance/list');
}

// 关闭弹窗
function handleClose() {
  dialogVisible.value = false;
}
</script>
<style lang="less" scoped>
.maintenance-detail-content {
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

  .description-text {
    font-size: 14px;
    color: var(--td-text-color-primary);
    line-height: 1.6;
    background: var(--td-bg-color-container-hover);
    padding: 12px;
    border-radius: var(--td-radius-default);
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
