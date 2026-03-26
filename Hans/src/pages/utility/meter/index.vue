<template>
  <div class="meter-management">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" data-testid="record-meter-button" @click="handleRecord">
            <template #icon><add-icon /></template>
            抄表录入
          </t-button>
        </div>
        <div class="filter-container">
          <t-select
            v-model="filterCommunityId"
            :options="communityOptions"
            placeholder="全部小区"
            clearable
            class="filter-select"
            data-testid="community-filter"
            @change="handleFilterChange"
          />
        </div>
      </t-row>

      <!-- 数据表格 -->
      <t-table
        :data="tableData"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="paginationConfig"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        data-testid="meter-table"
        @page-change="handlePageChange"
      >
        <template #roomInfo="{ row }">
          <span class="room-info">{{ row.roomInfo }}</span>
        </template>
        <template #meterDateText="{ row }">
          <span>{{ row.meterDateText }}</span>
        </template>
        <template #waterReading="{ row }">
          <span>{{ row.waterReading.toFixed(2) }}</span>
        </template>
        <template #electricReading="{ row }">
          <span>{{ row.electricReading.toFixed(2) }}</span>
        </template>
        <template #waterUsage="{ row }">
          <span :class="{ 'usage-warning': row.waterUsage > 50 }"> {{ row.waterUsage.toFixed(2) }} 吨 </span>
        </template>
        <template #electricUsage="{ row }">
          <span :class="{ 'usage-warning': row.electricUsage > 200 }"> {{ row.electricUsage.toFixed(2) }} 度 </span>
        </template>
        <template #waterFee="{ row }">
          <span>¥{{ formatMoney(row.waterFee) }}</span>
        </template>
        <template #electricFee="{ row }">
          <span>¥{{ formatMoney(row.electricFee) }}</span>
        </template>
        <template #totalFee="{ row }">
          <span class="total-fee">¥{{ formatMoney(row.totalFee) }}</span>
        </template>
        <template #hasBill="{ row }">
          <t-tag :theme="row.hasBill ? 'success' : 'warning'" variant="light">
            {{ row.hasBill ? '已生成' : '待生成' }}
          </t-tag>
        </template>
        <template #remark="{ row }">
          <t-tooltip v-if="row.remark" :content="row.remark" placement="top">
            <span class="remark-text">{{ row.remark }}</span>
          </t-tooltip>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #createdTime="{ row }">
          {{ formatDateTime(row.createdTime) }}
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link v-if="!row.hasBill" theme="primary" data-testid="delete-button" @click="handleDelete(row)">
              删除
            </t-link>
            <t-tooltip v-else content="已生成账单，无法删除" placement="top">
              <t-link theme="default" disabled>删除</t-link>
            </t-tooltip>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 抄表录入对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      header="抄表录入"
      width="600px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="meter-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="120px">
        <t-form-item label="选择房间" name="roomId">
          <t-select
            v-model="formData.roomId"
            :options="roomOptions"
            placeholder="请选择房间"
            filterable
            data-testid="room-select"
            @change="handleRoomChange"
          />
        </t-form-item>
        <t-form-item label="抄表日期" name="meterDate">
          <t-date-picker
            v-model="formData.meterDate"
            :clearable="false"
            data-testid="meter-date-input"
            style="width: 100%"
          />
        </t-form-item>
        <t-divider>上次读数</t-divider>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水表读数">
              <span class="prev-reading">{{ lastReadings.waterReading.toFixed(2) }}</span>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电表读数">
              <span class="prev-reading">{{ lastReadings.electricReading.toFixed(2) }}</span>
            </t-form-item>
          </t-col>
        </t-row>
        <t-divider>本次读数</t-divider>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水表读数" name="waterReading">
              <t-input-number
                v-model="formData.waterReading"
                placeholder="请输入水表读数"
                :min="0"
                :decimal-places="2"
                data-testid="water-reading-input"
                style="width: 100%"
                @change="calculateUsage"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电表读数" name="electricReading">
              <t-input-number
                v-model="formData.electricReading"
                placeholder="请输入电表读数"
                :min="0"
                :decimal-places="2"
                data-testid="electric-reading-input"
                style="width: 100%"
                @change="calculateUsage"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-divider>用量计算</t-divider>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="用水量">
              <span :class="{ 'usage-warning': calculatedUsage.water > 50 }">
                {{ calculatedUsage.water.toFixed(2) }} 吨
              </span>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="用电量">
              <span :class="{ 'usage-warning': calculatedUsage.electric > 200 }">
                {{ calculatedUsage.electric.toFixed(2) }} 度
              </span>
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水费单价">
              <span>{{ selectedRoom?.waterPrice ? `¥${selectedRoom.waterPrice.toFixed(2)}/吨` : '未设置' }}</span>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电费单价">
              <span>{{ selectedRoom?.electricPrice ? `¥${selectedRoom.electricPrice.toFixed(2)}/度` : '未设置' }}</span>
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水费">
              <span class="fee-text">¥{{ formatMoney(calculatedFees.water) }}</span>
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电费">
              <span class="fee-text">¥{{ formatMoney(calculatedFees.electric) }}</span>
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item label="合计费用">
          <span class="total-fee-large">¥{{ formatMoney(calculatedFees.total) }}</span>
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 2, maxRows: 4 }"
            data-testid="remark-input"
          />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 删除确认对话框 -->
    <t-dialog
      v-model:visible="deleteConfirmVisible"
      header="确认删除"
      :body="deleteConfirmBody"
      :confirm-btn="{ theme: 'danger', content: '删除', loading: deleteLoading }"
      data-testid="confirm-dialog"
      @confirm="onConfirmDelete"
    >
      <p data-testid="confirm-dialog-message">{{ deleteConfirmBody }}</p>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { AddIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { getCommunityList } from '@/api/community';
import { deleteMeter, getLastReadings, getMeterList, recordMeter } from '@/api/meter';
import type { CommunityItem } from '@/api/model/communityModel';
import type { LastReadingsResult, MeterRecordItem, RecordMeterInput } from '@/api/model/meterModel';
import type { RoomItem } from '@/api/model/roomModel';
import { RoomStatus } from '@/api/model/roomModel';
import { getRoomList } from '@/api/room';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDateTime, formatMoney } from '@/utils/date';

defineOptions({
  name: 'UtilityMeter',
});

// ==================== 类型定义 ====================

/** 表单数据类型 */
interface MeterFormData {
  roomId?: number;
  meterDate: string;
  waterReading?: number;
  electricReading?: number;
  remark?: string;
}

/** 表头固定配置类型 */
interface HeaderAffixedTopConfig {
  offsetTop: number;
  container: string;
}

// ==================== 状态 ====================

const settingStore = useSettingStore();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 70 },
  { colKey: 'roomInfo', title: '房间', width: 160, ellipsis: true },
  { colKey: 'meterDateText', title: '抄表日期', width: 110 },
  { colKey: 'waterReading', title: '水表读数', width: 100 },
  { colKey: 'electricReading', title: '电表读数', width: 100 },
  { colKey: 'waterUsage', title: '用水量', width: 100 },
  { colKey: 'electricUsage', title: '用电量', width: 100 },
  { colKey: 'waterFee', title: '水费', width: 90 },
  { colKey: 'electricFee', title: '电费', width: 90 },
  { colKey: 'totalFee', title: '合计', width: 100 },
  { colKey: 'hasBill', title: '账单状态', width: 90 },
  { colKey: 'remark', title: '备注', width: 120, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 160 },
  { colKey: 'op', title: '操作', width: 80, fixed: 'right' },
];

// 状态
const loading = ref(false);
const data = ref<MeterRecordItem[]>([]);
const pagination = ref({
  pageSize: 20,
  total: 0,
  current: 1,
});

// 筛选
const filterCommunityId = ref<number | undefined>(undefined);

// 小区选项
const communities = ref<CommunityItem[]>([]);
const communityOptions = computed<SelectOption[]>(() => communities.value.map((c) => ({ label: c.name, value: c.id })));

// 已出租房间选项（用于抄表录入）
const rentedRooms = ref<RoomItem[]>([]);
const roomOptions = computed<SelectOption[]>(() =>
  rentedRooms.value.map((r) => ({
    label: `${r.communityName} - ${r.building}栋 ${r.roomNumber}`,
    value: r.id,
  })),
);

// 对话框状态
const dialogVisible = ref(false);
const submitLoading = ref(false);
const formRef = ref<FormInstanceFunctions>();

// 上次读数
const lastReadings = ref<LastReadingsResult>({
  waterReading: 0,
  electricReading: 0,
});

// 选中的房间
const selectedRoom = ref<RoomItem | null>(null);

// 表单数据
const formData = ref<MeterFormData>({
  roomId: undefined,
  meterDate: new Date().toISOString().split('T')[0],
  waterReading: undefined,
  electricReading: undefined,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  roomId: [{ required: true, message: '请选择房间', trigger: 'change' }],
  meterDate: [{ required: true, message: '请选择抄表日期', trigger: 'change' }],
  waterReading: [{ required: true, message: '请输入水表读数', trigger: 'blur' }],
  electricReading: [{ required: true, message: '请输入电表读数', trigger: 'blur' }],
};

// 计算用量
const calculatedUsage = computed(() => {
  const water =
    formData.value.waterReading && formData.value.waterReading >= lastReadings.value.waterReading
      ? formData.value.waterReading - lastReadings.value.waterReading
      : 0;
  const electric =
    formData.value.electricReading && formData.value.electricReading >= lastReadings.value.electricReading
      ? formData.value.electricReading - lastReadings.value.electricReading
      : 0;
  return { water, electric };
});

// 计算费用
const calculatedFees = computed(() => {
  const waterPrice = selectedRoom.value?.waterPrice || 0;
  const electricPrice = selectedRoom.value?.electricPrice || 0;
  const water = calculatedUsage.value.water * waterPrice;
  const electric = calculatedUsage.value.electric * electricPrice;
  const total = water + electric;
  return { water, electric, total };
});

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingRecord = ref<MeterRecordItem | null>(null);
const deleteConfirmBody = computed(() => {
  if (deletingRecord.value) {
    return `确定要删除「${deletingRecord.value.roomInfo}」的抄表记录吗？删除后无法恢复。`;
  }
  return '';
});

// 过滤后的表格数据
const tableData = computed(() => {
  let result = data.value;
  if (filterCommunityId.value !== undefined) {
    // 根据 roomInfo 中的小区名称筛选
    const community = communities.value.find((c) => c.id === filterCommunityId.value);
    if (community) {
      result = result.filter((item) => item.roomInfo.includes(community.name));
    }
  }
  return result;
});

// 同步过滤后的总数到分页
const filteredTotal = computed(() => tableData.value.length);

// 分页配置（使用前端筛选后的 total）
const paginationConfig = computed(() => ({
  ...pagination.value,
  total: filteredTotal.value,
}));

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 方法 ====================

/** 获取小区列表 */
async function fetchCommunities() {
  try {
    const res = await getCommunityList();
    communities.value = res || [];
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取小区列表失败');
  }
}

/** 获取已出租房间列表 */
async function fetchRentedRooms() {
  try {
    const res = await getRoomList({ status: RoomStatus.Rented });
    rentedRooms.value = res || [];
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取房间列表失败');
  }
}

/** 获取抄表记录列表 */
async function fetchData() {
  loading.value = true;
  try {
    const res = await getMeterList({
      page: 1, // 获取全量数据，前端筛选和分页
      pageSize: 1000,
    });
    data.value = res?.items || [];
    // total 由 computed filteredTotal 动态计算
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取抄表记录失败');
  } finally {
    loading.value = false;
  }
}

/** 筛选变化 */
function handleFilterChange() {
  pagination.value.current = 1;
}

/** 分页 */
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.current = pageInfo.current;
  pagination.value.pageSize = pageInfo.pageSize;
}

/** 打开抄表录入对话框 */
function handleRecord() {
  formData.value = {
    roomId: undefined,
    meterDate: new Date().toISOString().split('T')[0],
    waterReading: undefined,
    electricReading: undefined,
    remark: '',
  };
  lastReadings.value = { waterReading: 0, electricReading: 0 };
  selectedRoom.value = null;
  dialogVisible.value = true;
}

/** 房间选择变化 */
async function handleRoomChange(value: unknown) {
  const roomId = value as number;
  if (!roomId) {
    lastReadings.value = { waterReading: 0, electricReading: 0 };
    selectedRoom.value = null;
    return;
  }

  // 获取选中的房间信息
  selectedRoom.value = rentedRooms.value.find((r) => r.id === roomId) || null;

  // 获取上次抄表读数
  try {
    const res = await getLastReadings(roomId);
    lastReadings.value = res || { waterReading: 0, electricReading: 0 };
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '获取上次读数失败');
    lastReadings.value = { waterReading: 0, electricReading: 0 };
  }
}

/** 计算用量 */
function calculateUsage() {
  // 触发 computed 重新计算
}

/** 提交表单 */
async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  // 验证读数是否大于上次读数
  if (formData.value.waterReading! < lastReadings.value.waterReading) {
    MessagePlugin.warning('水表读数不能小于上次读数');
    return;
  }
  if (formData.value.electricReading! < lastReadings.value.electricReading) {
    MessagePlugin.warning('电表读数不能小于上次读数');
    return;
  }

  submitLoading.value = true;
  try {
    const input: RecordMeterInput = {
      roomId: formData.value.roomId!,
      meterDate: formData.value.meterDate,
      waterReading: formData.value.waterReading!,
      electricReading: formData.value.electricReading!,
      remark: formData.value.remark || undefined,
    };
    await recordMeter(input);
    MessagePlugin.success('抄表录入成功');
    dialogVisible.value = false;
    await fetchData();
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '抄表录入失败');
  } finally {
    submitLoading.value = false;
  }
}

/** 关闭对话框 */
function handleDialogClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}

/** 删除抄表记录 */
function handleDelete(row: MeterRecordItem) {
  if (row.hasBill) {
    MessagePlugin.warning('已生成账单，无法删除');
    return;
  }
  deletingRecord.value = row;
  deleteConfirmVisible.value = true;
}

/** 确认删除 */
async function onConfirmDelete() {
  if (!deletingRecord.value) return;

  deleteLoading.value = true;
  try {
    await deleteMeter(deletingRecord.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData();
  } catch (e: unknown) {
    const error = e as { message?: string };
    MessagePlugin.error(error.message || '删除失败');
  } finally {
    deleteLoading.value = false;
    deletingRecord.value = null;
  }
}

onMounted(() => {
  fetchCommunities();
  fetchRentedRooms();
  fetchData();
});
</script>
<style lang="less" scoped>
.meter-management {
  .list-card-container {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);

    :deep(.t-card__body) {
      padding: 0;
    }
  }

  .left-operation-container {
    display: flex;
    align-items: center;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .filter-container {
    display: flex;
    gap: 16px;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .filter-select {
    width: 200px;
  }

  .room-info {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .text-secondary {
    color: var(--td-text-color-secondary);
  }

  .remark-text {
    display: inline-block;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .usage-warning {
    color: var(--td-warning-color);
    font-weight: 500;
  }

  .total-fee {
    color: var(--td-brand-color);
    font-weight: 500;
  }

  .prev-reading {
    color: var(--td-text-color-secondary);
    font-size: 14px;
  }

  .fee-text {
    color: var(--td-text-color-primary);
    font-weight: 500;
  }

  .total-fee-large {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-brand-color);
  }
}
</style>
