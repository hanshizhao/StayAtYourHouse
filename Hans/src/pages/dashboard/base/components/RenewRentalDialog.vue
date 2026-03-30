<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="续租处理"
    width="600px"
    :confirm-btn="{ content: '确认续租', loading }"
    :on-confirm="handleConfirm"
    :on-close="handleClose"
    data-testid="renew-rental-dialog"
  >
    <div v-if="reminder" class="renew-dialog-content">
      <div class="info-section">
        <div class="section-title">租客信息</div>
        <div class="info-row">
          <span class="info-label">房间</span>
          <span class="info-value">{{ reminder.roomInfo }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">租客</span>
          <span class="info-value">{{ reminder.tenantName }}</span>
        </div>
        <div class="info-row">
          <span class="info-label">月租金</span>
          <span class="info-value amount">¥{{ formatMoney(reminder.monthlyRent ?? 0) }}</span>
        </div>
        <div v-if="reminder.rentalReminder?.contractEndDate" class="info-row">
          <span class="info-label">合同到期</span>
          <span class="info-value warning">{{ reminder.rentalReminder.contractEndDate }}</span>
        </div>
      </div>

      <div class="info-section">
        <div class="section-title">新租期信息</div>
        <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
          <t-form-item label="租期月数" name="leaseMonths">
            <t-input-number
              v-model="formData.leaseMonths"
              :min="1"
              :max="36"
              :step="1"
              theme="normal"
              suffix="个月"
              placeholder="请输入租期月数"
              data-testid="lease-months"
            />
          </t-form-item>
          <t-form-item label="新月租金" name="monthlyRent">
            <t-input-number
              v-model="formData.monthlyRent"
              placeholder="请输入新月租金"
              :min="0.01"
              :decimal-places="2"
              style="width: 100%"
            />
          </t-form-item>
          <t-form-item label="合同到期日" name="contractEndDate">
            <t-date-picker
              v-model="formData.contractEndDate"
              placeholder="请选择合同到期日"
              :min-date="tomorrow"
              style="width: 100%"
            />
          </t-form-item>
          <t-form-item label="上传合同" name="contractImage">
            <t-upload
              v-model="contractFiles"
              action="/api/file/upload"
              :auto-upload="true"
              :size-limit="{ size: 10, unit: 'MB' }"
              :format-response="formatUploadResponse"
              accept="image/*"
              :multiple="false"
              theme="image"
              tips="支持 jpg、png 格式，单个文件不超过 10MB（可选）"
              @success="handleUploadSuccess"
              @fail="handleUploadFail"
            />
          </t-form-item>
          <t-form-item label="备注" name="remark">
            <t-textarea
              v-model="formData.remark"
              placeholder="请输入备注信息(可选)"
              :maxlength="500"
              :autosize="{ minRows: 2, maxRows: 4 }"
            />
          </t-form-item>
        </t-form>
      </div>

      <div class="deposit-info">
        <t-icon name="info-circle" />
        <span>押金将自动继承到新租期</span>
      </div>
    </div>

    <div v-else class="empty-state">
      <t-icon name="error-circle" size="48px" style="color: var(--td-text-color-placeholder)" />
      <p>暂无续租信息</p>
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SuccessContext, UploadFailContext, UploadFile } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { RenewRentalInput, TodoItem } from '@/api/model/todoModel';
import { renewRental } from '@/api/todo';
import { formatMoney } from '@/utils/format';

defineOptions({
  name: 'RenewRentalDialog',
});

const props = defineProps<{
  visible: boolean;
  reminder: TodoItem | null;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// ==================== 状态 ====================

const loading = ref(false);
const formRef = ref<FormInstanceFunctions>();
const contractFiles = ref<UploadFile[]>([]);

const formData = ref<RenewRentalInput>({
  leaseMonths: 1,
  monthlyRent: undefined as number | undefined,
  contractEndDate: '',
  contractImage: '',
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  leaseMonths: [
    { required: true, message: '请输入租期月数' },
    {
      validator: (val: number) => {
        if (val === undefined || val === null) {
          return { result: false, message: '请输入租期月数' };
        }
        if (val < 1 || val > 36) {
          return { result: false, message: '租期月数必须在 1-36 之间' };
        }
        return true;
      },
    },
  ],
  monthlyRent: [
    { required: true, message: '请输入新月租金' },
    {
      validator: (val: number) => {
        if (val === undefined) {
          return { result: false, message: '请输入月租金' };
        }
        if (val <= 0) {
          return { result: false, message: '月租金必须大于0' };
        }
        return true;
      },
    },
  ],
  contractEndDate: [{ required: true, message: '请选择合同到期日' }],
};

// 计算属性：双向绑定 visible
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 计算属性：明天日期
const tomorrow = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  return date;
});

// ==================== 监听 ====================
// 弹窗打开时初始化默认值
watch(
  () => props.visible,
  (visible) => {
    if (visible && props.reminder) {
      formData.value = {
        leaseMonths: 1,
        monthlyRent: props.reminder.monthlyRent,
        contractEndDate: '',
        contractImage: '',
        remark: '',
      };
      contractFiles.value = [];
    }
  },
);

// ==================== 上传处理 ====================

// 格式化上传响应
function formatUploadResponse(res: any) {
  if (res?.url) {
    return { url: res.url };
  }
  return { error: '上传失败，请重试' };
}

// 验证上传响应格式
function isValidUploadResponse(res: unknown): res is { url: string } {
  return typeof res === 'object' && res !== null && 'url' in res && typeof (res as { url: string }).url === 'string';
}

// 上传成功
function handleUploadSuccess(context: SuccessContext) {
  try {
    const res = typeof context.response === 'string' ? JSON.parse(context.response) : context.response;

    if (isValidUploadResponse(res)) {
      formData.value.contractImage = res.url;
      MessagePlugin.success('合同图片上传成功');
    } else {
      MessagePlugin.error('上传响应格式错误，请重试');
    }
  } catch {
    MessagePlugin.error('解析上传响应失败');
  }
}

// 上传失败
function handleUploadFail(context: UploadFailContext) {
  const fileName = context.file?.name || '未知文件';
  MessagePlugin.error(`文件 ${fileName} 上传失败`);
}

// ==================== 事件处理 ====================

// 确认续租
async function handleConfirm() {
  const valid = await formRef.value?.validate();
  // 防御性检查：reminderId 必须有效
  if (valid !== true || !props.reminder?.rentalReminder?.id) {
    if (!props.reminder?.rentalReminder?.id) {
      MessagePlugin.error('提醒ID无效');
    }
    return;
  }

  loading.value = true;
  try {
    await renewRental(props.reminder.rentalReminder.id, formData.value);
    MessagePlugin.success('续租成功');
    emit('success');
    dialogVisible.value = false;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '续租失败');
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleClose() {
  formRef.value?.reset();
  contractFiles.value = [];
  dialogVisible.value = false;
}
</script>
<style lang="less" scoped>
.renew-dialog-content {
  .info-section {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--td-component-border);
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
    margin-bottom: 12px;
  }

  .info-row {
    display: flex;
    align-items: center;
    padding: 8px 0;

    .info-label {
      width: 80px;
      color: var(--td-text-color-secondary);
      flex-shrink: 0;
    }

    .info-value {
      color: var(--td-text-color-primary);

      &.amount {
        font-weight: 600;
        color: var(--td-warning-color);
      }

      &.warning {
        color: var(--td-error-color);
        font-weight: 500;
      }
    }
  }

  :deep(.t-form) {
    margin-top: 16px;
  }
}

.deposit-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--td-bg-color-container-hover);
  border-radius: var(--td-radius-default);
  color: var(--td-text-color-secondary);
  font-size: 13px;

  :deep(.t-icon) {
    color: var(--td-brand-color);
    margin-right: 4px;
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
