<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="退租办理"
    top="50"
    width="520px"
    :confirm-btn="{ content: '确认退租', loading }"
    data-testid="checkout-dialog"
    :on-confirm="handleSubmit"
    :on-close="handleClose"
  >
    <div v-if="effectiveTenant" class="check-out-content">
      <!-- 租客信息 -->
      <div class="info-section" data-testid="tenant-info">
        <div class="info-title">租客信息</div>
        <div class="info-row">
          <span class="label">租客姓名：</span>
          <span class="value">{{ effectiveTenant.name }}</span>
        </div>
        <div class="info-row">
          <span class="label">联系电话：</span>
          <span class="value">{{ effectiveTenant.phone }}</span>
        </div>
      </div>

      <!-- 房间信息 -->
      <div v-if="effectiveTenant.currentRoom" class="info-section" data-testid="room-info">
        <div class="info-title">房间信息</div>
        <div class="info-row">
          <span class="label">当前房间：</span>
          <span class="value room-info">{{ effectiveTenant.currentRoom.fullInfo }}</span>
        </div>
      </div>

      <!-- 租住信息 -->
      <div class="info-section">
        <div class="info-title">租住信息</div>
        <div class="info-row">
          <span class="label">月租金：</span>
          <span class="value">{{ formatMoney(rentalRecord?.monthlyRent) }} 元</span>
        </div>
        <div class="info-row">
          <span class="label">押金：</span>
          <span class="value">{{ deposit }} 元</span>
        </div>
        <div class="info-row">
          <span class="label">入住日期：</span>
          <span class="value">{{ formatDate(rentalRecord?.checkInDate) }}</span>
        </div>
        <div class="info-row">
          <span class="label">合同到期：</span>
          <span class="value">{{ formatDate(rentalRecord?.contractEndDate) }}</span>
        </div>
        <div class="info-row">
          <span class="label">剩余天数：</span>
          <span class="value" data-testid="remaining-days">{{ remainingDays }} 天</span>
        </div>
      </div>

      <!-- 结算信息 -->
      <div class="info-section settlement-section">
        <div class="info-title">结算信息</div>
        <div class="info-row highlight" data-testid="settlement-amount">
          <span class="label">结算金额：</span>
          <span class="value amount"
            >{{ settlementAmount >= 0 ? '退还租客' : '租客补交' }} {{ Math.abs(settlementAmount) }} 元</span
          >
        </div>
      </div>

      <!-- 退租表单 -->
      <t-form
        ref="formRef"
        :data="formData"
        :rules="formRules"
        label-align="right"
        label-width="100px"
        class="check-out-form"
      >
        <t-form-item label="退租日期" name="checkOutDate">
          <t-date-picker
            v-model="formData.checkOutDate"
            :enable-time-picker="false"
            :clearable="false"
            placeholder="请选择退租日期"
            data-testid="checkout-date-input"
          />
        </t-form-item>

        <t-form-item label="押金处理" name="depositStatus">
          <t-radio-group v-model="formData.depositStatus" data-testid="deposit-status-input">
            <t-radio :value="DepositStatus.Refunded" data-testid="deposit-refunded">全额退还</t-radio>
            <t-radio :value="DepositStatus.Deducted" data-testid="deposit-deducted">部分扣除</t-radio>
          </t-radio-group>
        </t-form-item>

        <t-form-item v-if="formData.depositStatus === DepositStatus.Deducted" label="扣除金额" name="depositDeduction">
          <t-input-number
            v-model="formData.depositDeduction"
            :min="0"
            :max="maxDeduction"
            :decimal-places="2"
            placeholder="请输入扣除金额"
            data-testid="deposit-deduction-input"
          />
          <span class="input-suffix">元（最高 {{ maxDeduction }} 元）</span>
        </t-form-item>

        <t-form-item v-if="formData.depositStatus === DepositStatus.Deducted" label="扣除说明" name="checkOutRemark">
          <t-textarea
            v-model="formData.checkOutRemark"
            placeholder="请输入扣除原因"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            data-testid="deduction-note-input"
          />
        </t-form-item>
      </t-form>
    </div>
    <div v-else class="loading-placeholder">
      <t-loading text="加载中..." />
    </div>
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { RentalRecordDto } from '@/api/model/rentalModel';
import { DepositStatus } from '@/api/model/rentalModel';
import type { TenantItem } from '@/api/model/tenantModel';
import { checkOut, getRentalById } from '@/api/rental';
import { getTenantById } from '@/api/tenant';
import { formatDate, getLocalDateString } from '@/utils/date';

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

// ==================== 常量 ====================
const MS_PER_DAY = 1000 * 60 * 60 * 24;

// ==================== 工具函数 ====================
/**
 * 格式化金额显示，正确处理 0 值
 */
function formatMoney(value: number | undefined | null): string {
  return value !== undefined && value !== null ? String(value) : '-';
}

// ==================== Props & Emits ====================
interface Props {
  /** 弹窗可见性 */
  visible: boolean;
  /** 租客信息 */
  tenant: TenantItem | null;
  /** 租住记录ID（从待办面板入口传入） */
  rentalRecordId?: number;
}

// 使用 computed 处理 v-model
const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

// ==================== 类型定义 ====================
interface CheckOutFormData {
  checkOutDate: string;
  depositStatus: DepositStatus;
  depositDeduction?: number;
  checkOutRemark?: string;
}

// ==================== 状态 ====================
const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);
const deposit = ref(0);
const rentalRecord = ref<RentalRecordDto | null>(null);
const resolvedTenant = ref<TenantItem | null>(null);

const effectiveTenant = computed(() => props.tenant ?? resolvedTenant.value);

const formData = ref<CheckOutFormData>({
  checkOutDate: getLocalDateString(),
  depositStatus: DepositStatus.Refunded,
  depositDeduction: undefined,
  checkOutRemark: '',
});

// 最大抵扣金额（不能超过押金）
const maxDeduction = computed(() => deposit.value);

// 剩余天数计算
const remainingDays = computed(() => {
  if (!rentalRecord.value?.contractEndDate) return 0;
  const today = new Date();
  const endDate = new Date(rentalRecord.value.contractEndDate);
  const diffTime = endDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / MS_PER_DAY);
  return Math.max(0, diffDays);
});

// 结算金额计算（简化版：押金 - 扣除金额）
const settlementAmount = computed(() => {
  if (formData.value.depositStatus === DepositStatus.Deducted && formData.value.depositDeduction) {
    return deposit.value - formData.value.depositDeduction;
  }
  return deposit.value;
});

// 表单验证规则
const formRules: Record<string, FormRule[]> = {
  checkOutDate: [{ required: true, message: '请选择退租日期', trigger: 'change' }],
  depositStatus: [{ required: true, message: '请选择押金处理方式', trigger: 'change' }],
  depositDeduction: [
    { required: true, message: '请输入扣除金额', trigger: 'blur' },
    {
      validator: (val: number) => val >= 0 && val <= deposit.value,
      message: `扣除金额不能超过押金 ${deposit.value} 元`,
      trigger: 'blur',
    },
  ],
};

// ==================== 监听器 ====================
watch(
  () => props.visible,
  async (newVisible) => {
    const rentalId = props.tenant?.rentalRecordId ?? props.rentalRecordId;
    if (newVisible && rentalId) {
      // 重置表单
      formData.value = {
        checkOutDate: getLocalDateString(),
        depositStatus: DepositStatus.Refunded,
        depositDeduction: undefined,
        checkOutRemark: '',
      };

      // 获取租住记录详情以获取押金金额
      try {
        const record = await getRentalById(rentalId);
        rentalRecord.value = record;
        deposit.value = record.deposit;

        // 通过 rentalRecordId 入口时，需要额外获取租客信息
        if (!props.tenant && record.tenantId) {
          resolvedTenant.value = await getTenantById(record.tenantId);
        }
      } catch (e: unknown) {
        const errorMessage = e instanceof Error ? e.message : '获取租住记录失败';
        MessagePlugin.error(errorMessage);
        emit('update:visible', false);
      }
    }
  },
);

// 当押金状态改变为已退还时，清空扣除金额
watch(
  () => formData.value.depositStatus,
  (newStatus) => {
    if (newStatus === DepositStatus.Refunded) {
      formData.value.depositDeduction = undefined;
      formData.value.checkOutRemark = '';
    }
  },
);

// ==================== 方法 ====================

async function handleSubmit() {
  // 验证表单
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  // 验证租住记录ID
  const rentalRecordId = effectiveTenant.value?.rentalRecordId ?? props.rentalRecordId;
  if (!rentalRecordId) {
    MessagePlugin.error('租住记录不存在');
    return;
  }

  // 押金状态为已扣除时，验证扣除金额
  if (formData.value.depositStatus === DepositStatus.Deducted) {
    if (formData.value.depositDeduction === undefined || formData.value.depositDeduction === null) {
      MessagePlugin.error('请输入扣除金额');
      return;
    }
    if (formData.value.depositDeduction > deposit.value) {
      MessagePlugin.error(`扣除金额不能超过押金 ${deposit.value} 元`);
      return;
    }
  }

  loading.value = true;
  try {
    await checkOut({
      rentalRecordId,
      checkOutDate: formData.value.checkOutDate,
      depositStatus: formData.value.depositStatus,
      depositDeduction:
        formData.value.depositStatus === DepositStatus.Deducted ? formData.value.depositDeduction : undefined,
      checkOutRemark: formData.value.checkOutRemark || undefined,
    });

    MessagePlugin.success('退租成功');
    emit('update:visible', false);
    emit('success');
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '退租失败';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formRef.value?.reset();
  resolvedTenant.value = null;
  rentalRecord.value = null;
  deposit.value = 0;
  emit('update:visible', false);
}
</script>
<style lang="less" scoped>
.check-out-content {
  .info-section {
    padding: 16px;
    margin-bottom: 16px;
    background-color: var(--td-bg-color-container);
    border-radius: var(--td-radius-default);

    .info-title {
      margin-bottom: 12px;
      font-weight: 500;
      color: var(--td-text-color-primary);
    }

    .info-row {
      display: flex;
      margin-bottom: 8px;
      font-size: 14px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        flex-shrink: 0;
        width: 80px;
        color: var(--td-text-color-secondary);
      }

      .value {
        color: var(--td-text-color-primary);

        &.room-info {
          font-weight: 500;
        }

        &.amount {
          font-weight: 600;
          color: var(--td-brand-color);
        }
      }

      &.highlight {
        padding: 8px 12px;
        background-color: var(--td-brand-color-light);
        border-radius: var(--td-radius-default);
      }
    }
  }

  .settlement-section {
    border: 1px solid var(--td-component-border);
  }

  .check-out-form {
    margin-top: 16px;

    .input-suffix {
      margin-left: 8px;
      font-size: 12px;
      color: var(--td-text-color-secondary);
    }
  }
}

.loading-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}
</style>
