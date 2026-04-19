<template>
  <t-dialog
    v-model:visible="dialogVisible"
    :header="dialogTitle"
    width="480px"
    :confirm-btn="{ content: isEdit ? '保存修改' : '确认新增', loading }"
    cancel-btn="取消"
    data-testid="debt-form-dialog"
    :on-confirm="handleSubmit"
    :on-close="handleClose"
  >
    <t-form
      ref="formRef"
      :data="formData"
      :rules="formRules"
      label-align="top"
      class="debt-form"
    >
      <t-form-item label="选择租客" name="tenantId">
        <t-select
          v-model="formData.tenantId"
          placeholder="请选择租客"
          :disabled="isEdit"
          :loading="tenantLoading"
          filterable
          :on-search="handleTenantSearch"
          data-testid="debt-form-tenant-select"
        >
          <t-option
            v-for="tenant in tenantOptions"
            :key="tenant.id"
            :value="tenant.id"
            :label="tenant.name"
          />
        </t-select>
      </t-form-item>

      <t-form-item label="欠款金额" name="totalAmount">
        <t-input-number
          v-model="formData.totalAmount"
          placeholder="请输入欠款金额"
          :min="0.01"
          :max="9999999.99"
          :decimal-places="2"
          :step="100"
          theme="column"
          data-testid="debt-form-amount-input"
        >
          <template #prefixIcon>
            <span class="amount-prefix">¥</span>
          </template>
        </t-input-number>
      </t-form-item>

      <t-form-item label="欠款说明" name="description">
        <t-textarea
          v-model="formData.description"
          placeholder="如：2025年3-5月租金未交"
          :maxlength="200"
          :autosize="{ minRows: 3, maxRows: 4 }"
          data-testid="debt-form-desc-input"
        />
      </t-form-item>

      <t-form-item label="备注" name="remark">
        <t-textarea
          v-model="formData.remark"
          placeholder="选填"
          :maxlength="500"
          :autosize="{ minRows: 2, maxRows: 3 }"
          data-testid="debt-form-remark-input"
        />
      </t-form-item>
    </t-form>
  </t-dialog>
</template>

<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import type { CreateDebtParams, DebtDetail, UpdateDebtParams } from '@/api/model/debtModel';
import { createDebt, updateDebt } from '@/api/debt';
import { getTenantList } from '@/api/tenant';

interface Props {
  visible: boolean;
  editData?: DebtDetail | null;
}

const props = withDefaults(defineProps<Props>(), {
  editData: null,
});

const emit = defineEmits<{
  (e: 'update:visible', visible: boolean): void;
  (e: 'success'): void;
}>();

const dialogVisible = computed({
  get: () => props.visible,
  set: (val: boolean) => emit('update:visible', val),
});

const isEdit = computed(() => !!props.editData);
const dialogTitle = computed(() => (isEdit.value ? '编辑欠款' : '新增欠款'));

interface FormData {
  tenantId: number | undefined;
  totalAmount: number | undefined;
  description: string;
  remark: string;
}

const formRef = ref<FormInstanceFunctions>();
const loading = ref(false);
const tenantLoading = ref(false);
const tenantOptions = ref<{ id: number; name: string }[]>([]);

const formData = ref<FormData>({
  tenantId: undefined,
  totalAmount: undefined,
  description: '',
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  tenantId: [{ required: true, message: '请选择租客', trigger: 'change' }],
  totalAmount: [
    { required: true, message: '请输入欠款金额', trigger: 'blur' },
    {
      validator: (val: number) => val > 0,
      message: '欠款金额必须大于 0',
      trigger: 'blur',
    },
  ],
};

async function loadTenants(keyword?: string) {
  tenantLoading.value = true;
  try {
    const result = await getTenantList({ keyword, page: 1, pageSize: 50 });
    tenantOptions.value = result.list.map(t => ({ id: t.id, name: t.name }));
  } catch {
    tenantOptions.value = [];
    MessagePlugin.warning('加载租客列表失败');
  } finally {
    tenantLoading.value = false;
  }
}

let searchTimer: ReturnType<typeof setTimeout> | null = null;
function handleTenantSearch(keyword: string) {
  if (searchTimer) clearTimeout(searchTimer);
  searchTimer = setTimeout(() => loadTenants(keyword), 300);
}

onBeforeUnmount(() => {
  if (searchTimer) clearTimeout(searchTimer);
});

watch(
  () => props.visible,
  async (newVisible) => {
    if (!newVisible) return;

    if (props.editData) {
      formData.value = {
        tenantId: props.editData.tenantId,
        totalAmount: props.editData.totalAmount,
        description: props.editData.description ?? '',
        remark: props.editData.remark ?? '',
      };
    } else {
      formData.value = {
        tenantId: undefined,
        totalAmount: undefined,
        description: '',
        remark: '',
      };
    }

    await loadTenants();
  },
);

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  loading.value = true;
  try {
    if (isEdit.value && props.editData) {
      const params: UpdateDebtParams = {
        id: props.editData.id,
        totalAmount: formData.value.totalAmount!,
        description: formData.value.description || undefined,
        remark: formData.value.remark || undefined,
      };
      await updateDebt(params);
      MessagePlugin.success('修改成功');
    } else {
      const params: CreateDebtParams = {
        tenantId: formData.value.tenantId!,
        totalAmount: formData.value.totalAmount!,
        description: formData.value.description || undefined,
        remark: formData.value.remark || undefined,
      };
      await createDebt(params);
      MessagePlugin.success('新增成功');
    }

    emit('update:visible', false);
    emit('success');
    formRef.value?.reset();
  } catch (e: unknown) {
    const errorMessage = e instanceof Error ? e.message : '操作失败';
    MessagePlugin.error(errorMessage);
  } finally {
    loading.value = false;
  }
}

function handleClose() {
  formRef.value?.reset();
  emit('update:visible', false);
}
</script>

<style lang="less" scoped>
.debt-form {
  :deep(.t-form__item) {
    margin-bottom: 20px;
  }

  .amount-prefix {
    color: var(--td-text-color-placeholder);
  }
}
</style>
