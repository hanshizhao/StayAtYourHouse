<template>
  <div class="room-management">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" data-testid="add-room-button" @click="handleCreate">
            <template #icon><add-icon /></template>
            新建房间
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
          <t-select
            v-model="filterStatus"
            :options="statusOptions"
            placeholder="全部状态"
            clearable
            class="filter-select"
            data-testid="status-filter"
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
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        data-testid="room-table"
        @page-change="handlePageChange"
      >
        <template #communityName="{ row }">
          <t-tooltip :content="row.communityName" placement="top">
            <span class="community-name">{{ row.communityName }}</span>
          </t-tooltip>
        </template>
        <template #roomInfo="{ row }">
          <span>{{ row.building }}栋 {{ row.roomNumber }}</span>
        </template>
        <template #area="{ row }">
          <span>{{ row.area ? `${row.area}㎡` : '-' }}</span>
        </template>
        <template #roomType="{ row }">
          <span>{{ row.roomType || '-' }}</span>
        </template>
        <template #costPrice="{ row }">
          <span>¥{{ row.costPrice.toFixed(2) }}</span>
        </template>
        <template #rentPrice="{ row }">
          <span>¥{{ row.rentPrice.toFixed(2) }}</span>
        </template>
        <template #profit="{ row }">
          <span :class="row.profit >= 0 ? 'profit-positive' : 'profit-negative'"> ¥{{ row.profit.toFixed(2) }} </span>
        </template>
        <template #deposit="{ row }">
          <span>{{ row.deposit ? `¥${row.deposit.toFixed(2)}` : '-' }}</span>
        </template>
        <template #status="{ row }">
          <t-tag :theme="getStatusTheme(row.status)" variant="light">
            {{ getStatusText(row.status) }}
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
            <t-link theme="primary" data-testid="edit-button" @click="handleEdit(row)">编辑</t-link>
            <t-link theme="danger" data-testid="delete-button" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 创建/编辑对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      :header="dialogType === 'create' ? '新建房间' : '编辑房间'"
      width="640px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="room-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="所属小区" name="communityId">
              <t-select
                v-model="formData.communityId"
                :options="communityOptions"
                placeholder="请选择小区"
                data-testid="room-community-select"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="房间状态" name="status">
              <t-select
                v-model="formData.status"
                :options="statusOptions"
                placeholder="请选择状态"
                data-testid="room-status-select"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="楼栋号" name="building">
              <t-input
                v-model="formData.building"
                placeholder="请输入楼栋号"
                :maxlength="50"
                data-testid="room-building-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="房间号" name="roomNumber">
              <t-input
                v-model="formData.roomNumber"
                placeholder="请输入房间号"
                :maxlength="50"
                data-testid="room-number-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="面积(㎡)" name="area">
              <t-input-number
                v-model="formData.area"
                placeholder="请输入面积"
                :min="0"
                :decimal-places="2"
                data-testid="room-area-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="房间类型" name="roomType">
              <t-input
                v-model="formData.roomType"
                placeholder="如：一室一厅"
                :maxlength="50"
                data-testid="room-type-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="成本价(元)" name="costPrice">
              <t-input-number
                v-model="formData.costPrice"
                placeholder="请输入成本价"
                :min="0"
                :decimal-places="2"
                data-testid="room-cost-price-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="出租价(元)" name="rentPrice">
              <t-input-number
                v-model="formData.rentPrice"
                placeholder="请输入出租价"
                :min="0"
                :decimal-places="2"
                data-testid="room-rent-price-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="押金(元)" name="deposit">
              <t-input-number
                v-model="formData.deposit"
                placeholder="请输入押金"
                :min="0"
                :decimal-places="2"
                data-testid="room-deposit-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label=" " name="placeholder">
              <!-- 占位，保持布局对齐 -->
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="12">
            <t-form-item label="水费(元/吨)" name="waterPrice">
              <t-input-number
                v-model="formData.waterPrice"
                placeholder="请输入水费单价"
                :min="0"
                :decimal-places="2"
                data-testid="room-water-price-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="12">
            <t-form-item label="电费(元/度)" name="electricPrice">
              <t-input-number
                v-model="formData.electricPrice"
                placeholder="请输入电费单价"
                :min="0"
                :decimal-places="2"
                data-testid="room-electric-price-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
            data-testid="room-remark-input"
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
import { computed, onMounted, ref, watchEffect } from 'vue';

import { getCommunityList } from '@/api/community';
import type { CommunityItem } from '@/api/model/communityModel';
import type { RoomItem } from '@/api/model/roomModel';
import { RoomStatus, RoomStatusText } from '@/api/model/roomModel';
import { createRoom, deleteRoom, getRoomList, updateRoom } from '@/api/room';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDateTime } from '@/utils/date';

defineOptions({
  name: 'HousingRoom',
});

// ==================== 类型定义 ====================

/** 表单数据类型 */
interface RoomFormData {
  id?: number;
  communityId?: number;
  building: string;
  roomNumber: string;
  area?: number;
  roomType?: string;
  costPrice?: number;
  rentPrice?: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
  status: RoomStatus;
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
  { colKey: 'communityName', title: '小区', width: 140 },
  { colKey: 'roomInfo', title: '房间', width: 140 },
  { colKey: 'area', title: '面积', width: 90 },
  { colKey: 'roomType', title: '类型', width: 100 },
  { colKey: 'costPrice', title: '成本价', width: 100 },
  { colKey: 'rentPrice', title: '出租价', width: 100 },
  { colKey: 'profit', title: '利润', width: 100 },
  { colKey: 'deposit', title: '押金', width: 100 },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'remark', title: '备注', width: 150, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 160 },
  { colKey: 'op', title: '操作', width: 120, fixed: 'right' },
];

// 状态
const loading = ref(false);
const data = ref<RoomItem[]>([]);
const pagination = ref({
  defaultPageSize: 20,
  total: 0,
  defaultCurrent: 1,
});

// 筛选
const filterCommunityId = ref<number | undefined>(undefined);
const filterStatus = ref<RoomStatus | undefined>(undefined);

// 小区选项（使用 clearable 特性，无需"全部"选项）
const communities = ref<CommunityItem[]>([]);
const communityOptions = computed<SelectOption[]>(() => communities.value.map((c) => ({ label: c.name, value: c.id })));

// 状态选项（使用 clearable 特性，无需"全部"选项）
const statusOptions: SelectOption[] = [
  { label: '空置', value: RoomStatus.Vacant },
  { label: '已出租', value: RoomStatus.Rented },
  { label: '装修中', value: RoomStatus.Renovating },
];

// 对话框状态
const dialogVisible = ref(false);
const dialogType = ref<'create' | 'edit'>('create');
const submitLoading = ref(false);
const formRef = ref<FormInstanceFunctions>();
const editingRoomId = ref<number | null>(null);

// 表单数据
const formData = ref<RoomFormData>({
  communityId: undefined,
  building: '',
  roomNumber: '',
  area: undefined,
  roomType: '',
  costPrice: undefined,
  rentPrice: undefined,
  deposit: undefined,
  waterPrice: undefined,
  electricPrice: undefined,
  status: RoomStatus.Vacant,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  communityId: [{ required: true, message: '请选择小区', trigger: 'change' }],
  building: [{ required: true, message: '请输入楼栋号', trigger: 'blur' }],
  roomNumber: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
  costPrice: [{ required: true, message: '请输入成本价', trigger: 'blur' }],
  rentPrice: [{ required: true, message: '请输入出租价', trigger: 'blur' }],
};

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingRoom = ref<RoomItem | null>(null);
const deleteConfirmBody = computed(() => {
  if (deletingRoom.value) {
    return `确定要删除房间「${deletingRoom.value.building}栋 ${deletingRoom.value.roomNumber}」吗？删除后无法恢复。`;
  }
  return '';
});

// 过滤后的表格数据
// 注意：当前使用前端分页和筛选，适用于房间数量较少（<1000）的场景
// 如需支持大数据量，建议改为后端分页，在 API 请求时传递分页参数和筛选条件
const tableData = computed(() => {
  let result = data.value;
  // 筛选小区
  if (filterCommunityId.value !== undefined) {
    result = result.filter((item) => item.communityId === filterCommunityId.value);
  }
  // 筛选状态
  if (filterStatus.value !== undefined) {
    result = result.filter((item) => item.status === filterStatus.value);
  }
  return result;
});

// 过滤后的数据总数
const filteredTotal = computed(() => tableData.value.length);

// 同步过滤后的总数到分页
watchEffect(() => {
  pagination.value.total = filteredTotal.value;
});

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 方法 ====================

/** 获取状态主题 */
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',
  };
  return themes[status];
}

/** 获取状态文本 */
function getStatusText(status: RoomStatus): string {
  return RoomStatusText[status];
}

/** 获取小区列表 */
async function fetchCommunities() {
  try {
    const res = await getCommunityList();
    communities.value = res || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取小区列表失败');
  }
}

/** 获取房间列表 */
async function fetchData() {
  loading.value = true;
  try {
    const res = await getRoomList();
    data.value = res || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取房间列表失败');
  } finally {
    loading.value = false;
  }
}

/** 筛选变化 */
function handleFilterChange() {
  pagination.value.defaultCurrent = 1;
}

/** 分页 */
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.defaultCurrent = pageInfo.current;
  pagination.value.defaultPageSize = pageInfo.pageSize;
}

/** 创建房间 */
function handleCreate() {
  dialogType.value = 'create';
  formData.value = {
    communityId: undefined,
    building: '',
    roomNumber: '',
    area: undefined,
    roomType: '',
    costPrice: undefined,
    rentPrice: undefined,
    deposit: undefined,
    waterPrice: undefined,
    electricPrice: undefined,
    status: RoomStatus.Vacant,
    remark: '',
  };
  dialogVisible.value = true;
}

/** 编辑房间 */
function handleEdit(row: RoomItem) {
  dialogType.value = 'edit';
  editingRoomId.value = row.id;
  formData.value = {
    id: row.id,
    communityId: row.communityId,
    building: row.building,
    roomNumber: row.roomNumber,
    area: row.area,
    roomType: row.roomType,
    costPrice: row.costPrice,
    rentPrice: row.rentPrice,
    deposit: row.deposit,
    waterPrice: row.waterPrice,
    electricPrice: row.electricPrice,
    status: row.status,
    remark: row.remark,
  };
  dialogVisible.value = true;
}

/** 提交表单 */
async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  submitLoading.value = true;
  try {
    if (dialogType.value === 'create') {
      await createRoom({
        communityId: formData.value.communityId!,
        building: formData.value.building,
        roomNumber: formData.value.roomNumber,
        area: formData.value.area,
        roomType: formData.value.roomType || undefined,
        costPrice: formData.value.costPrice!,
        rentPrice: formData.value.rentPrice!,
        deposit: formData.value.deposit,
        waterPrice: formData.value.waterPrice,
        electricPrice: formData.value.electricPrice,
        status: formData.value.status,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('创建房间成功');
    } else {
      await updateRoom({
        id: editingRoomId.value!,
        communityId: formData.value.communityId!,
        building: formData.value.building,
        roomNumber: formData.value.roomNumber,
        area: formData.value.area,
        roomType: formData.value.roomType || undefined,
        costPrice: formData.value.costPrice!,
        rentPrice: formData.value.rentPrice!,
        deposit: formData.value.deposit,
        waterPrice: formData.value.waterPrice,
        electricPrice: formData.value.electricPrice,
        status: formData.value.status,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('更新房间成功');
    }
    dialogVisible.value = false;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
}

/** 关闭对话框 */
function handleDialogClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}

/** 删除房间 */
function handleDelete(row: RoomItem) {
  deletingRoom.value = row;
  deleteConfirmVisible.value = true;
}

/** 确认删除 */
async function onConfirmDelete() {
  if (!deletingRoom.value) return;

  deleteLoading.value = true;
  try {
    await deleteRoom(deletingRoom.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
    deleteConfirmVisible.value = false;
  } finally {
    deleteLoading.value = false;
    deletingRoom.value = null;
  }
}

onMounted(() => {
  fetchCommunities();
  fetchData();
});
</script>
<style lang="less" scoped>
.room-management {
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
    width: 160px;
  }

  .community-name {
    display: inline-block;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .text-secondary {
    color: var(--td-text-color-secondary);
  }

  .remark-text {
    display: inline-block;
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .profit-positive {
    color: var(--td-success-color);
    font-weight: 500;
  }

  .profit-negative {
    color: var(--td-error-color);
    font-weight: 500;
  }
}
</style>
