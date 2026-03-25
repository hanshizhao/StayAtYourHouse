<template>
  <div class="check-in-page">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-left">
        <t-button variant="outline" @click="handleBack">
          <template #icon><chevron-left-icon /></template>
          返回
        </t-button>
        <div class="header-title">
          <h2>入住办理</h2>
          <span class="header-subtitle">填写租客入住信息</span>
        </div>
      </div>
    </div>

    <!-- 表单区域 -->
    <div class="form-container">
      <t-card class="form-card" :bordered="false">
        <t-form
          ref="formRef"
          :data="formData"
          :rules="formRules"
          label-align="right"
          label-width="120px"
          @submit="handleSubmit"
        >
          <!-- 租客信息 -->
          <div class="form-section">
            <div class="section-title">
              <user-icon class="section-icon" />
              <span>租客信息</span>
            </div>
            <t-row :gutter="24">
              <t-col :span="6">
                    <t-form-item label="选择租客" name="tenantId">
                  <t-select
                    v-model="formData.tenantId"
                    placeholder="请选择租客"
                    filterable
                    :loading="tenantLoading"
                    data-testid="tenant-select"
                    @change="handleTenantChange"
                  >
                    <t-option
                      v-for="tenant in tenantOptions"
                      :key="tenant.id"
                      :value="tenant.id"
                      :label="tenant.name"
                    >
                      <div class="tenant-option">
                        <span class="tenant-name">{{ tenant.name }}</span>
                        <span class="tenant-phone">{{ tenant.phone }}</span>
                      </div>
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
            </t-row>
          </div>

          <!-- 房间信息 -->
          <div class="form-section">
            <div class="section-title">
              <home-icon class="section-icon" />
              <span>房间信息</span>
            </div>
            <t-row :gutter="24">
              <t-col :span="6">
                <t-form-item label="选择房间" name="roomId">
                  <t-select
                    v-model="formData.roomId"
                    placeholder="请选择空置房间"
                    filterable
                    :loading="roomLoading"
                    data-testid="room-select"
                    @change="handleRoomChange"
                  >
                    <t-option
                      v-for="room in roomOptions"
                      :key="room.id"
                      :value="room.id"
                      :label="room.fullInfo"
                    >
                      <div class="room-option">
                        <span class="room-info">{{ room.fullInfo }}</span>
                        <span class="room-price">¥{{ room.rentPrice }}/月</span>
                      </div>
                    </t-option>
                  </t-select>
                </t-form-item>
              </t-col>
            </t-row>

            <!-- 房间信息卡片 -->
            <div v-if="selectedRoom" class="room-info-card">
              <div class="info-item">
                <span class="info-label">小区</span>
                <span class="info-value">{{ selectedRoom.communityName }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">楼栋</span>
                <span class="info-value">{{ selectedRoom.building }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">房间号</span>
                <span class="info-value">{{ selectedRoom.roomNumber }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">面积</span>
                <span class="info-value">{{ selectedRoom.area ? `${selectedRoom.area}㎡` : '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">房型</span>
                <span class="info-value">{{ selectedRoom.roomType || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">水电单价</span>
                <span class="info-value">
                  水 {{ selectedRoom.waterPrice || '-' }} 元/吨
                  / 电 {{ selectedRoom.electricPrice || '-' }} 元/度
                </span>
              </div>
            </div>
          </div>

          <!-- 合同信息 -->
          <div class="form-section">
            <div class="section-title">
              <file-icon class="section-icon" />
              <span>合同信息</span>
            </div>
            <t-row :gutter="24">
              <t-col :span="4">
                <t-form-item label="入住日期" name="checkInDate">
                  <t-date-picker
                    v-model="formData.checkInDate"
                    placeholder="请选择入住日期"
                    clearable
                    :enable-time-picker="false"
                    data-testid="check-in-date"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="4">
                <t-form-item label="租期类型" name="leaseType">
                  <t-radio-group v-model="formData.leaseType" data-testid="lease-type">
                    <t-radio v-for="(text, value) in LeaseTypeText" :key="value" :value="Number(value)">
                      {{ text }}
                    </t-radio>
                  </t-radio-group>
                </t-form-item>
              </t-col>
            </t-row>

            <!-- 费用信息 -->
            <t-row :gutter="24">
              <t-col :span="4">
                <t-form-item label="月租金" name="monthlyRent">
                  <t-input-number
                    v-model="formData.monthlyRent"
                    placeholder="请输入月租金"
                    :min="0"
                    :decimal-places="2"
                    theme="column"
                    data-testid="monthly-rent"
                  >
                    <template #suffix>
                      <span class="input-suffix">元</span>
                    </template>
                  </t-input-number>
                </t-form-item>
              </t-col>
              <t-col :span="4">
                <t-form-item label="押金" name="deposit">
                  <t-input-number
                    v-model="formData.deposit"
                    placeholder="请输入押金"
                    :min="0"
                    :decimal-places="2"
                    theme="column"
                    data-testid="deposit"
                  >
                    <template #suffix>
                      <span class="input-suffix">元</span>
                    </template>
                  </t-input-number>
                </t-form-item>
              </t-col>
            </t-row>

            <!-- 合同到期日期提示 -->
            <div v-if="contractEndDate" class="contract-end-tip">
              <info-circle-icon class="tip-icon" />
              <span>合同将于 <strong>{{ contractEndDate }}</strong> 到期</span>
            </div>
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
                    :autosize="{ minRows: 3, maxRows: 5 }"
                    data-testid="remark"
                  />
                </t-form-item>
              </t-col>
            </t-row>
          </div>

          <!-- 合同图片 -->
          <div class="form-section">
            <div class="section-title">
              <image-icon class="section-icon" />
              <span>合同图片</span>
            </div>
            <t-row :gutter="24">
              <t-col :span="8">
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
                    tips="支持 jpg、png 格式，单个文件不超过 10MB"
                    @success="handleUploadSuccess"
                    @fail="handleUploadFail"
                  >
                    <template #file-list-display>
                      <div v-if="formData.contractImage" class="contract-image-preview">
                        <img :src="formData.contractImage" alt="合同图片" />
                      </div>
                    </template>
                  </t-upload>
                </t-form-item>
              </t-col>
            </t-row>
          </div>

          <!-- 提交按钮 -->
          <div class="form-actions">
            <t-button variant="outline" @click="handleBack">取消</t-button>
            <t-button
              theme="primary"
              type="submit"
              :loading="submitLoading"
              data-testid="submit-button"
            >
              确认入住
            </t-button>
          </div>
        </t-form>
      </t-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  ChevronLeftIcon,
  EditIcon,
  FileIcon,
  HomeIcon,
  ImageIcon,
  InfoCircleIcon,
  UserIcon,
} from 'tdesign-icons-vue-next';
import { formatDate, calculateContractEndDate, getLocalDateString, LeaseType } from '@/utils/date';
import type { FormInstanceFunctions, FormRule, SelectOption, SelectValue, UploadFile, SuccessContext, UploadFailContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import type { TenantItem } from '@/api/model/tenantModel';
import { getTenantList } from '@/api/tenant';
import { checkIn } from '@/api/rental';
import type { RoomItem } from '@/api/model/roomModel';
import { getRoomList } from '@/api/room';
import { LeaseTypeText } from '@/api/model/rentalModel';
import { RoomStatus } from '@/api/model/roomModel';

defineOptions({
  name: 'CheckIn',
});

const router = useRouter();

// ==================== 类型定义 ====================

interface CheckInFormData {
  tenantId: number | undefined;
  roomId: number | undefined;
  checkInDate: string;
  leaseType: LeaseType;
  monthlyRent: number | undefined;
  deposit: number | undefined;
  remark: string;
  contractImage: string;
}

interface RoomOption {
  id: number;
  fullInfo: string;
  communityName: string;
  building: string;
  roomNumber: string;
  area?: number;
  roomType?: string;
  rentPrice: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
}

// ==================== 状态 ====================

const formRef = ref<FormInstanceFunctions>();
const submitLoading = ref(false);

// 表单数据
const formData = ref<CheckInFormData>({
  tenantId: undefined,
  roomId: undefined,
  checkInDate: getLocalDateString(),
  leaseType: LeaseType.Monthly,
  monthlyRent: undefined,
  deposit: undefined,
  remark: '',
  contractImage: '',
});

// 租客选项
const tenantLoading = ref(false);
const tenantOptions = ref<TenantItem[]>([]);

// 房间选项
const roomLoading = ref(false);
const roomOptions = ref<RoomOption[]>([]);
const selectedRoom = ref<RoomOption | null>(null);

// 合同图片上传
const contractFiles = ref<UploadFile[]>([]);

// 表单验证规则
const formRules: Record<string, FormRule[]> = {
  tenantId: [{ required: true, message: '请选择租客', trigger: 'change' }],
  roomId: [{ required: true, message: '请选择房间', trigger: 'change' }],
  checkInDate: [{ required: true, message: '请选择入住日期', trigger: 'change' }],
  monthlyRent: [
    { required: true, message: '请输入月租金', trigger: 'blur' },
    { validator: (val) => val >= 0, message: '月租金不能为负数', trigger: 'blur' },
  ],
  deposit: [
    { required: true, message: '请输入押金', trigger: 'blur' },
    { validator: (val) => val >= 0, message: '押金不能为负数', trigger: 'blur' },
  ],
};

// 计算合同到期日期（使用工具函数，与后端逻辑保持一致）
const contractEndDate = computed(() => {
  const endDate = calculateContractEndDate(formData.value.checkInDate, formData.value.leaseType);
  return endDate ? formatDate(endDate) : null;
});

// ==================== 数据加载 ====================

// 加载租客列表
// TODO: 当前使用大 pageSize 获取全部租客，租客数量增长后建议后端提供专用的「选择器列表」接口
async function loadTenants() {
  tenantLoading.value = true;
  try {
    const res = await getTenantList({ page: 1, pageSize: 9999 });
    tenantOptions.value = res?.list || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取租客列表失败');
  } finally {
    tenantLoading.value = false;
  }
}

// 加载空置房间列表
async function loadVacantRooms() {
  roomLoading.value = true;
  try {
    const res = await getRoomList({ status: RoomStatus.Vacant });
    // 转换为选项格式
    roomOptions.value = (res || []).map((room) => ({
      id: room.id,
      fullInfo: `${room.communityName} ${room.building} ${room.roomNumber}`,
      communityName: room.communityName,
      building: room.building,
      roomNumber: room.roomNumber,
      area: room.area,
      roomType: room.roomType,
      rentPrice: room.rentPrice,
      deposit: room.deposit,
      waterPrice: room.waterPrice,
      electricPrice: room.electricPrice,
    }));
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取房间列表失败');
  } finally {
    roomLoading.value = false;
  }
}

// ==================== 事件处理 ====================

// 租客选择变化
function handleTenantChange(value: SelectValue<SelectOption>) {
  // 选择租客后，更新相关状态（预留扩展点）
  void value; // 暂时未使用，避免 linter 警告
}

// 房间选择变化
function handleRoomChange(value: SelectValue<SelectOption>) {
  const roomId = Number(value);
  const room = roomOptions.value.find((r) => r.id === roomId);
  if (room) {
    selectedRoom.value = room;
    // 自动填充月租金和押金
    formData.value.monthlyRent = room.rentPrice;
    formData.value.deposit = room.deposit || 0;
  } else {
    selectedRoom.value = null;
  }
}

// 返回
function handleBack() {
  router.push('/tenant/list');
}

// 格式化上传响应
function formatUploadResponse(res: any) {
  if (res?.url) {
    return { url: res.url };
  }
  return { error: '上传失败，请重试' };
}

// 验证上传响应格式
function isValidUploadResponse(res: unknown): res is { url: string } {
  if (!res || typeof res !== 'object') return false;
  const obj = res as Record<string, unknown>;
  return typeof obj.url === 'string' && obj.url.length > 0;
}

// 上传成功
function handleUploadSuccess(context: SuccessContext) {
  try {
    const res = typeof context.response === 'string'
      ? JSON.parse(context.response)
      : context.response;

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
  MessagePlugin.error(`文件 ${context.file.name} 上传失败`);
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  // 显式检查必填字段（避免非空断言风险）
  const { tenantId, roomId, monthlyRent, deposit } = formData.value;
  if (tenantId === undefined || roomId === undefined
      || monthlyRent === undefined || deposit === undefined) {
    MessagePlugin.error('请完整填写必填信息');
    return;
  }

  submitLoading.value = true;
  try {
    await checkIn({
      tenantId,
      roomId,
      checkInDate: formData.value.checkInDate,
      leaseType: formData.value.leaseType,
      monthlyRent,
      deposit,
      remark: formData.value.remark || undefined,
      contractImage: formData.value.contractImage || undefined,
    });
    MessagePlugin.success('入住办理成功');
    router.push('/tenant/list');
  } catch (e: any) {
    MessagePlugin.error(e.message || '入住办理失败');
  } finally {
    submitLoading.value = false;
  }
}

// ==================== 生命周期 ====================

onMounted(() => {
  loadTenants();
  loadVacantRooms();
});
</script>

<style lang="less" scoped>
.check-in-page {
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

    .room-info-card {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 16px;
      padding: 16px 20px;
      margin-top: 16px;
      background: var(--td-bg-color-container-hover);
      border-radius: 6px;

      .info-item {
        display: flex;
        flex-direction: column;
        gap: 4px;

        .info-label {
          font-size: 12px;
          color: var(--td-text-color-secondary);
        }

        .info-value {
          font-size: 14px;
          color: var(--td-text-color-primary);
        }
      }
    }

    .contract-end-tip {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      margin-top: 16px;
      background: var(--td-brand-color-light);
      border-radius: 6px;
      color: var(--td-brand-color);

      .tip-icon {
        flex-shrink: 0;
      }

      strong {
        color: var(--td-brand-color-hover);
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

// 下拉选项样式
.tenant-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  .tenant-name {
    font-weight: 500;
  }

  .tenant-phone {
    color: var(--td-text-color-secondary);
    font-size: 12px;
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

  .room-price {
    color: var(--td-brand-color);
    font-size: 12px;
  }
}

// 合同图片预览
.contract-image-preview {
  margin-top: 8px;

  img {
    max-width: 200px;
    max-height: 150px;
    border-radius: 4px;
    object-fit: cover;
  }
}
</style>
