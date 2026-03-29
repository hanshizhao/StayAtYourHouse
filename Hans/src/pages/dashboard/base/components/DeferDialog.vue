<template>
  <t-dialog
    v-model:visible="dialogVisible"
    header="宽限提醒"
    width="400px"
    :confirm-btn="{ content: '确认宽限', loading }"
    :on-confirm="handleConfirm"
    :on-close="handleClose"
    data-testid="defer-dialog"
  >
    <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
      <t-form-item label="宽限至" name="deferredToDate">
        <t-date-picker
          v-model="formData.deferredToDate"
          placeholder="请选择宽限日期"
          :default-value="defaultDate"
          :min-date="tomorrowDate"
          style="width: 100%"
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
  </t-dialog>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, ref, watch } from 'vue';

import type { DeferReminderInput } from '@/api/model/todoModel';
import { deferReminder } from '@/api/todo';

defineOptions({
  name: 'DeferDialog',
});

const props = defineProps<{
  visible: boolean;
  reminderId: number;
}>();

const emit = defineEmits<{
  'update:visible': [value: boolean];
  success: [];
}>();

// ==================== 状态 ====================

const loading = ref(false);
const formRef = ref<FormInstanceFunctions>();

const formData = ref<DeferReminderInput>({
  deferredToDate: '',
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  deferredToDate: [{ required: true, message: '请选择宽限日期', trigger: 'change' }],
};

// 计算属性：双向绑定 visible
const dialogVisible = computed({
  get: () => props.visible,
  set: (val) => emit('update:visible', val),
});

// 计算属性：明天日期
const tomorrowDate = computed(() => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow;
});

// 计算属性：默认宽限日期（明天 + 3 天)
const defaultDate = computed(() => {
  const date = new Date();
  date.setDate(date.getDate() + 4);
  return date.toISOString().split('T')[0];
});

// ==================== 监听 ====================

// 弹窗打开时初始化默认值
watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      formData.value = {
        deferredToDate: defaultDate.value,
        remark: '',
      };
    }
  },
);

// ==================== 事件处理 ====================

// 确认宽限
async function handleConfirm() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  // 防御性检查：reminderId 必须有效
  if (!props.reminderId || props.reminderId <= 0) {
    MessagePlugin.error('提醒ID无效');
    return;
  }

  loading.value = true;
  try {
    await deferReminder(props.reminderId, formData.value);
    MessagePlugin.success('宽限成功');
    emit('success');
    dialogVisible.value = false;
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '宽限失败');
  } finally {
    loading.value = false;
  }
}

// 关闭弹窗
function handleClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}
</script>
<style lang="less" scoped>
// 表单样式由 TDesign 组件处理
</style>
