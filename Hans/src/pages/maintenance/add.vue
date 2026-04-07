<template>
  <div class="maintenance-form-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <t-button variant="outline" @click="handleBack">
          <template #icon><chevron-left-icon /></template>
          返回
        </t-button>
        <div class="header-title">
          <h2>{{ isEdit ? '编辑报修' : '新增报修' }}</h2>
          <span class="header-subtitle">{{ isEdit ? '修改维修记录信息' : '填写维修记录信息' }}</span>
        </div>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="form-container">
      <t-card class="form-card" :bordered="false">
        <t-loading :loading="detailLoading">
          <t-form
            ref="formRef"
            :data="formData"
            :rules="formRules"
            label-align="right"
            label-width="120px"
            @submit="handleSubmit"
          >
            <!-- 房间信息 -->
            <div class="form-section">
              <div class="section-title">
                <home-icon class="section-icon" />
                <span>房间信息</span>
              </div>
              <t-row :gutter="[24, 12]">
                <t-col :span="6">
                  <t-form-item label="选择房间" name="roomId">
                    <t-select
                      v-model="formData.roomId"
                      placeholder="请选择房间"
                      filterable
                      :loading="roomLoading"
                      :disabled="isEdit"
                      data-testid="room-select"
                    >
                      <t-option v-for="room in roomOptions" :key="room.id" :value="room.id" :label="room.fullInfo">
                        <div class="room-option">
                          <span class="room-info">{{ room.fullInfo }}</span>
                        </div>
                      </t-option>
                    </t-select>
                  </t-form-item>
                </t-col>
              </t-row>
            </div>

            <!-- 维修信息 -->
            <div class="form-section">
              <div class="section-title">
                <tools-icon class="section-icon" />
                <span>维修信息</span>
              </div>
              <t-row :gutter="[24, 12]">
                <t-col :span="12">
                  <t-form-item label="维修描述" name="description">
                    <t-textarea
                      v-model="formData.description"
                      placeholder="请详细描述维修问题"
                      :maxlength="500"
                      :autosize="{ minRows: 3, maxRows: 5 }"
                      data-testid="description-input"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item label="优先级" name="priority">
                    <t-select
                      v-model="formData.priority"
                      :options="priorityOptions"
                      placeholder="请选择优先级"
                      data-testid="priority-select"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item label="报修日期" name="reportDate">
                    <t-date-picker
                      v-model="formData.reportDate"
                      placeholder="请选择报修日期"
                      clearable
                      :enable-time-picker="false"
                      data-testid="report-date-picker"
                    />
                  </t-form-item>
                </t-col>
                <t-col v-if="isEdit" :span="6">
                  <t-form-item label="维修状态" name="status">
                    <t-select
                      v-model="formData.status"
                      :options="statusOptions"
                      placeholder="请选择状态"
                      data-testid="status-select"
                    />
                  </t-form-item>
                </t-col>
              </t-row>
            </div>

            <!-- 维修人员与费用 -->
            <div class="form-section">
              <div class="section-title">
                <money-icon class="section-icon" />
                <span>维修人员与费用</span>
              </div>
              <t-row :gutter="[24, 12]">
                <t-col :span="6">
                  <t-form-item label="预算费用" name="cost">
                    <t-input-number
                      v-model="formData.cost"
                      theme="normal"
                      placeholder="请输入预算费用"
                      :min="0"
                      :decimal-places="2"
                      data-testid="cost-input"
                    >
                      <template #suffix>
                        <span class="input-suffix">元</span>
                      </template>
                    </t-input-number>
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item label="维修人员" name="repairPerson">
                    <t-input
                      v-model="formData.repairPerson"
                      placeholder="请输入维修人员姓名"
                      clearable
                      :maxlength="50"
                      data-testid="repair-person-input"
                    />
                  </t-form-item>
                </t-col>
                <t-col :span="6">
                  <t-form-item label="联系电话" name="repairPhone">
                    <t-input
                      v-model="formData.repairPhone"
                      placeholder="请输入联系电话"
                      clearable
                      :maxlength="20"
                      data-testid="repair-phone-input"
                    />
                  </t-form-item>
                </t-col>
              </t-row>
            </div>

            <!-- 备注 -->
            <div class="form-section">
              <div class="section-title">
                <edit-icon class="section-icon" />
                <span>备注信息</span>
              </div>
              <t-row :gutter="24">
                <t-col :span="8">
                  <t-form-item label="备注" name="remark">
                    <t-textarea
                      v-model="formData.remark"
                      placeholder="请输入备注信息（选填）"
                      :maxlength="500"
                      :autosize="{ minRows: 2, maxRows: 4 }"
                      data-testid="remark-input"
                    />
                  </t-form-item>
                </t-col>
              </t-row>
            </div>

            <!-- 提交按钮 -->
            <div class="form-actions">
              <t-button variant="outline" @click="handleBack">取消</t-button>
              <t-button theme="primary" type="submit" :loading="submitLoading" data-testid="submit-button">
                {{ isEdit ? '保存修改' : '提交报修' }}
              </t-button>
            </div>
          </t-form>
        </t-loading>
      </t-card>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ChevronLeftIcon, EditIcon, HomeIcon, MoneyIcon, ToolsIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { addMaintenance, getMaintenanceById, updateMaintenance } from '@/api/maintenance';
import {
  MaintenancePriority,
  MaintenancePriorityText,
  MaintenanceStatus,
  MaintenanceStatusText,
} from '@/api/model/maintenanceModel';
import { getRoomList } from '@/api/room';
import { getLocalDateString } from '@/utils/date';

defineOptions({
  name: 'MaintenanceForm',
});

// ==================== 类型定义 ====================

interface MaintenanceFormData {
  roomId: number | undefined;
  description: string;
  priority: MaintenancePriority;
  reportDate: string;
  cost: number | undefined;
  repairPerson: string;
  repairPhone: string;
  remark: string;
  status: MaintenanceStatus;
}

interface RoomOption {
  id: number;
  fullInfo: string;
}

interface OptionItem {
  label: string;
  value: number;
}

// ==================== 状态 ====================

const route = useRoute();
const router = useRouter();

const formRef = ref<FormInstanceFunctions>();
const submitLoading = ref(false);
const roomLoading = ref(false);
const detailLoading = ref(false);
const roomOptions = ref<RoomOption[]>([]);

// 编辑模式检测
const editingId = computed(() => {
  const id = route.params.id;
  if (!id) return null;
  const num = Number(id);
  return Number.isNaN(num) ? null : num;
});
const isEdit = computed(() => editingId.value !== null);
const preselectedRoomId = computed(() => {
  const roomId = route.query.roomId;
  return roomId ? Number(roomId) : null;
});

// 表单数据
const formData = ref<MaintenanceFormData>({
  roomId: undefined,
  description: '',
  priority: MaintenancePriority.Normal,
  reportDate: getLocalDateString(),
  cost: undefined,
  repairPerson: '',
  repairPhone: '',
  remark: '',
  status: MaintenanceStatus.Pending,
});

// 选项
const priorityOptions = computed<OptionItem[]>(() =>
  Object.values(MaintenancePriority)
    .filter((v): v is MaintenancePriority => typeof v === 'number')
    .map((v) => ({ label: MaintenancePriorityText[v], value: v })),
);

const statusOptions = computed<OptionItem[]>(() =>
  Object.values(MaintenanceStatus)
    .filter((v): v is MaintenanceStatus => typeof v === 'number')
    .map((v) => ({ label: MaintenanceStatusText[v], value: v })),
);

// 验证规则
const formRules: Record<string, FormRule[]> = {
  roomId: [{ required: true, message: '请选择房间', trigger: 'change' }],
  description: [
    { required: true, message: '请输入维修描述', trigger: 'blur' },
    { max: 500, message: '描述不能超过500个字符', trigger: 'blur' },
  ],
  priority: [{ required: true, message: '请选择优先级', trigger: 'change' }],
  reportDate: [{ required: true, message: '请选择报修日期', trigger: 'change' }],
  status: [{ required: true, message: '请选择维修状态', trigger: 'change' }],
};

// ==================== 数据加载 ====================

async function loadRooms() {
  roomLoading.value = true;
  try {
    const res = await getRoomList();
    roomOptions.value = (res || []).map((room) => ({
      id: room.id,
      fullInfo: `${room.communityName} ${room.building} ${room.roomNumber}`,
    }));
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '获取房间列表失败';
    MessagePlugin.error(message);
  } finally {
    roomLoading.value = false;
  }
}

async function loadMaintenanceDetail(id: number) {
  detailLoading.value = true;
  try {
    const detail = await getMaintenanceById(id);
    if (detail) {
      formData.value = {
        roomId: detail.roomId,
        description: detail.description,
        priority: detail.priority,
        reportDate: detail.reportDate ? detail.reportDate.split('T')[0] : getLocalDateString(),
        cost: detail.cost,
        repairPerson: detail.repairPerson || '',
        repairPhone: detail.repairPhone || '',
        remark: detail.remark || '',
        status: detail.status,
      };
    } else {
      MessagePlugin.error('未找到维修记录');
      router.push('/maintenance/list');
    }
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '获取维修详情失败';
    MessagePlugin.error(message);
  } finally {
    detailLoading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleBack() {
  router.push('/maintenance/list');
}

async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  const { roomId } = formData.value;
  if (roomId === undefined) {
    MessagePlugin.error('请选择房间');
    return;
  }

  submitLoading.value = true;
  try {
    if (isEdit.value) {
      const editId = editingId.value;
      if (editId === null) return;
      await updateMaintenance({
        id: editId,
        description: formData.value.description,
        priority: formData.value.priority,
        reportDate: formData.value.reportDate,
        cost: formData.value.cost,
        repairPerson: formData.value.repairPerson || undefined,
        repairPhone: formData.value.repairPhone || undefined,
        remark: formData.value.remark || undefined,
        status: formData.value.status,
      });
      MessagePlugin.success('修改成功');
    } else {
      await addMaintenance({
        roomId,
        description: formData.value.description,
        priority: formData.value.priority,
        reportDate: formData.value.reportDate,
        cost: formData.value.cost,
        repairPerson: formData.value.repairPerson || undefined,
        repairPhone: formData.value.repairPhone || undefined,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('报修提交成功');
    }
    router.push('/maintenance/list');
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '操作失败';
    MessagePlugin.error(message);
  } finally {
    submitLoading.value = false;
  }
}

// ==================== 生命周期 ====================

onMounted(async () => {
  await loadRooms();

  if (isEdit.value && editingId.value) {
    await loadMaintenanceDetail(editingId.value);
  } else if (preselectedRoomId.value) {
    formData.value.roomId = preselectedRoomId.value;
  }
});
</script>
<style lang="less" scoped>
.maintenance-form-page {
  padding: 24px;
  background: var(--td-bg-color-container);
  min-height: 100%;

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;

    .header-left {
      display: flex;
      align-items: center;
      gap: 16px;

      .header-title {
        h2 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: var(--td-text-color-primary);
        }

        .header-subtitle {
          font-size: 13px;
          color: var(--td-text-color-secondary);
        }
      }
    }
  }

  .form-container {
    max-width: 1200px;

    .form-card {
      border-radius: 8px;
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.05);

      :deep(.t-card__body) {
        padding: 32px 40px;
      }
    }

    .form-section {
      margin-bottom: 32px;
      padding-bottom: 24px;
      border-bottom: 1px solid var(--td-component-border);

      &:last-of-type {
        margin-bottom: 0;
        padding-bottom: 0;
        border-bottom: none;
      }

      .section-title {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 20px;
        font-size: 15px;
        font-weight: 500;
        color: var(--td-text-color-primary);

        .section-icon {
          color: var(--td-brand-color);
        }
      }
    }

    .input-suffix {
      color: var(--td-text-color-secondary);
      font-size: 13px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      margin-top: 32px;
      padding-top: 24px;
      border-top: 1px solid var(--td-component-border);
    }
  }
}

.room-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .room-info {
    font-weight: 500;
  }
}
</style>
