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
        <template #rentPrice="{ row }">
          <span>¥{{ row.rentPrice.toFixed(2) }}</span>
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
            <t-link theme="primary" data-testid="lease-button" @click="handleOpenLease(row)">房东租约</t-link>
            <t-link theme="warning" data-testid="maintenance-button" @click="handleMaintenance(row)">维修</t-link>
            <t-link theme="danger" data-testid="delete-button" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 创建/编辑对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      :header="dialogType === 'create' ? '新建房间' : '编辑房间'"
      width="680px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="room-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="90px">
        <!-- 基本信息 -->
        <div class="form-section-title">基本信息</div>
        <t-row :gutter="[24, 12]">
          <t-col :span="6">
            <t-form-item label="所属小区" name="communityId">
              <t-select
                v-model="formData.communityId"
                :options="communityOptions"
                placeholder="请选择小区"
                data-testid="room-community-select"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="房间状态" name="status">
              <t-select
                v-model="formData.status"
                :options="statusOptions"
                placeholder="请选择状态"
                data-testid="room-status-select"
              />
            </t-form-item>
          </t-col>

          <t-col :span="6">
            <t-form-item label="楼栋号" name="building">
              <t-input
                v-model="formData.building"
                placeholder="请输入楼栋号"
                :maxlength="50"
                data-testid="room-building-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
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

        <!-- 价格信息 -->
        <t-divider />
        <div class="form-section-title">价格信息</div>
        <t-row :gutter="[24, 12]">
          <t-col :span="6">
            <t-form-item label="出租价" name="rentPrice">
              <t-input-number
                v-model="formData.rentPrice"
                theme="normal"
                placeholder="请输入出租价"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-rent-price-input"
              />
            </t-form-item>
          </t-col>

          <t-col :span="6">
            <t-form-item label="押金" name="deposit">
              <t-input-number
                v-model="formData.deposit"
                theme="normal"
                placeholder="请输入押金"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-deposit-input"
              />
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 费用设置 -->
        <t-divider />
        <div class="form-section-title">费用设置</div>
        <t-row :gutter="24">
          <t-col :span="6">
            <t-form-item label="水费" name="waterPrice">
              <t-input-number
                v-model="formData.waterPrice"
                theme="normal"
                placeholder="水费单价"
                :min="0"
                :decimal-places="2"
                suffix="元/吨"
                data-testid="room-water-price-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="电费" name="electricPrice">
              <t-input-number
                v-model="formData.electricPrice"
                theme="normal"
                placeholder="电费单价"
                :min="0"
                :decimal-places="2"
                suffix="元/度"
                data-testid="room-electric-price-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="6">
            <t-form-item label="电梯费" name="elevatorFee">
              <t-input-number
                v-model="formData.elevatorFee"
                theme="normal"
                placeholder="电梯费"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-elevator-fee-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="物业费" name="propertyFee">
              <t-input-number
                v-model="formData.propertyFee"
                theme="normal"
                placeholder="物业费"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-property-fee-input"
              />
            </t-form-item>
          </t-col>
        </t-row>
        <t-row :gutter="24">
          <t-col :span="6">
            <t-form-item label="网络费" name="internetFee">
              <t-input-number
                v-model="formData.internetFee"
                theme="normal"
                placeholder="网络费"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-internet-fee-input"
              />
            </t-form-item>
          </t-col>
          <t-col :span="6">
            <t-form-item label="其他费用" name="otherFees">
              <t-input-number
                v-model="formData.otherFees"
                theme="normal"
                placeholder="其他费用"
                :min="0"
                :decimal-places="2"
                suffix="元"
                data-testid="room-other-fees-input"
              />
            </t-form-item>
          </t-col>
        </t-row>

        <!-- 备注 -->
        <t-divider />
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

    <!-- 房东租约抽屉 -->
    <t-drawer
      v-model:visible="leaseDrawerVisible"
      :header="
        currentLeaseRoom ? `${currentLeaseRoom.building}栋 ${currentLeaseRoom.roomNumber} - 房东租约` : '房东租约'
      "
      size="500px"
      data-testid="lease-drawer"
      :footer="false"
      @close="handleLeaseDrawerClose"
    >
      <div class="lease-drawer-content">
        <!-- 加载中 -->
        <div v-if="leaseLoading" class="lease-loading">
          <t-loading />
        </div>

        <!-- 表单模式 -->
        <template v-else-if="leaseEditMode">
          <t-form ref="leaseFormRef" :data="leaseForm" :rules="leaseFormRules" label-align="top">
            <div class="form-section-title">房东信息</div>
            <t-row :gutter="[16, 0]">
              <t-col :span="6">
                <t-form-item label="房东姓名" name="landlordName">
                  <t-input
                    v-model="leaseForm.landlordName"
                    placeholder="请输入房东姓名"
                    data-testid="lease-landlord-name"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="联系电话" name="landlordPhone">
                  <t-input
                    v-model="leaseForm.landlordPhone"
                    placeholder="请输入联系电话"
                    data-testid="lease-landlord-phone"
                  />
                </t-form-item>
              </t-col>
            </t-row>

            <div class="form-section-title">租约信息</div>
            <t-row :gutter="[16, 0]">
              <t-col :span="6">
                <t-form-item label="开始日期" name="startDate">
                  <t-date-picker
                    v-model="leaseForm.startDate"
                    placeholder="选择开始日期"
                    clearable
                    style="width: 100%"
                    data-testid="lease-start-date"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="结束日期" name="endDate">
                  <t-date-picker
                    v-model="leaseForm.endDate"
                    placeholder="选择结束日期"
                    clearable
                    style="width: 100%"
                    data-testid="lease-end-date"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="月租金" name="monthlyRent">
                  <t-input-number
                    v-model="leaseForm.monthlyRent"
                    theme="normal"
                    placeholder="请输入月租金"
                    :min="0"
                    :decimal-places="2"
                    suffix="元"
                    data-testid="lease-monthly-rent"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="付款方式" name="paymentMethod">
                  <t-select
                    v-model="leaseForm.paymentMethod"
                    :options="paymentMethodOptions"
                    placeholder="请选择付款方式"
                    data-testid="lease-payment-method"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="押金月数" name="depositMonths">
                  <t-input-number
                    v-model="leaseForm.depositMonths"
                    theme="normal"
                    placeholder="押金月数"
                    :min="0"
                    :max="24"
                    suffix="个月"
                    data-testid="lease-deposit-months"
                  />
                </t-form-item>
              </t-col>
            </t-row>

            <div class="form-section-title">费用信息</div>
            <t-row :gutter="[16, 0]">
              <t-col :span="6">
                <t-form-item label="水费" name="waterPrice">
                  <t-input-number
                    v-model="leaseForm.waterPrice"
                    theme="normal"
                    placeholder="水费单价"
                    :min="0"
                    :decimal-places="2"
                    suffix="元/吨"
                    data-testid="lease-water-price"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="电费" name="electricPrice">
                  <t-input-number
                    v-model="leaseForm.electricPrice"
                    theme="normal"
                    placeholder="电费单价"
                    :min="0"
                    :decimal-places="2"
                    suffix="元/度"
                    data-testid="lease-electric-price"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="电梯费" name="elevatorFee">
                  <t-input-number
                    v-model="leaseForm.elevatorFee"
                    theme="normal"
                    placeholder="电梯费"
                    :min="0"
                    :decimal-places="2"
                    suffix="元"
                    data-testid="lease-elevator-fee"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="物业费" name="propertyFee">
                  <t-input-number
                    v-model="leaseForm.propertyFee"
                    theme="normal"
                    placeholder="物业费"
                    :min="0"
                    :decimal-places="2"
                    suffix="元"
                    data-testid="lease-property-fee"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="网络费" name="internetFee">
                  <t-input-number
                    v-model="leaseForm.internetFee"
                    theme="normal"
                    placeholder="网络费"
                    :min="0"
                    :decimal-places="2"
                    suffix="元"
                    data-testid="lease-internet-fee"
                  />
                </t-form-item>
              </t-col>
              <t-col :span="6">
                <t-form-item label="其他费用" name="otherFees">
                  <t-input-number
                    v-model="leaseForm.otherFees"
                    theme="normal"
                    placeholder="其他费用"
                    :min="0"
                    :decimal-places="2"
                    suffix="元"
                    data-testid="lease-other-fees"
                  />
                </t-form-item>
              </t-col>
            </t-row>

            <div class="form-section-title">备注</div>
            <t-form-item name="remark">
              <t-textarea
                v-model="leaseForm.remark"
                placeholder="请输入备注信息"
                :maxlength="500"
                :autosize="{ minRows: 3, maxRows: 5 }"
                data-testid="lease-remark"
              />
            </t-form-item>

            <div class="lease-drawer-footer">
              <t-button variant="outline" @click="leaseEditMode = false">取消</t-button>
              <t-button theme="primary" :loading="leaseSaving" data-testid="lease-save-button" @click="handleSaveLease">
                保存
              </t-button>
            </div>
          </t-form>
        </template>

        <!-- 展示模式 -->
        <template v-else-if="leaseData">
          <div class="lease-detail-header">
            <span class="lease-detail-title">租约详情</span>
            <t-space size="small">
              <t-button variant="outline" size="small" data-testid="lease-edit-button" @click="handleEditLease">
                编辑
              </t-button>
              <t-button
                variant="outline"
                theme="danger"
                size="small"
                data-testid="lease-delete-button"
                @click="handleDeleteLeaseConfirm"
              >
                删除
              </t-button>
            </t-space>
          </div>

          <t-descriptions :column="2" bordered>
            <t-descriptions-item label="房东姓名">{{ leaseData.landlordName }}</t-descriptions-item>
            <t-descriptions-item label="联系电话">{{ leaseData.landlordPhone || '-' }}</t-descriptions-item>
            <t-descriptions-item label="开始日期">{{
              leaseData.startDate ? leaseData.startDate.split('T')[0] : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="结束日期">{{
              leaseData.endDate ? leaseData.endDate.split('T')[0] : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="月租金">
              <span class="lease-price">¥{{ leaseData.monthlyRent.toFixed(2) }}</span>
            </t-descriptions-item>
            <t-descriptions-item label="付款方式">{{ leaseData.paymentMethodText }}</t-descriptions-item>
            <t-descriptions-item label="押金月数">{{
              leaseData.depositMonths ? `${leaseData.depositMonths}个月` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="水费">{{
              leaseData.waterPrice != null ? `¥${leaseData.waterPrice.toFixed(2)}/吨` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="电费">{{
              leaseData.electricPrice != null ? `¥${leaseData.electricPrice.toFixed(2)}/度` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="电梯费">{{
              leaseData.elevatorFee != null ? `¥${leaseData.elevatorFee.toFixed(2)}` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="物业费">{{
              leaseData.propertyFee != null ? `¥${leaseData.propertyFee.toFixed(2)}` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="网络费">{{
              leaseData.internetFee != null ? `¥${leaseData.internetFee.toFixed(2)}` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item label="其他费用">{{
              leaseData.otherFees != null ? `¥${leaseData.otherFees.toFixed(2)}` : '-'
            }}</t-descriptions-item>
            <t-descriptions-item v-if="leaseData.remark" label="备注" :span="2">{{
              leaseData.remark
            }}</t-descriptions-item>
          </t-descriptions>
        </template>

        <!-- 空状态 -->
        <template v-else>
          <t-empty description="暂无租约信息" data-testid="lease-empty-state">
            <template #action>
              <t-button theme="primary" data-testid="lease-add-button" @click="handleAddLease">添加租约</t-button>
            </template>
          </t-empty>
        </template>
      </div>
    </t-drawer>

    <!-- 租约删除确认 -->
    <t-dialog
      v-model:visible="leaseDeleteConfirmVisible"
      header="确认删除租约"
      body="确定要删除该房东租约吗？删除后无法恢复。"
      :confirm-btn="{ theme: 'danger', content: '删除', loading: leaseDeleting }"
      data-testid="lease-delete-dialog"
      @confirm="handleDeleteLease"
    />
  </div>
</template>
<script setup lang="ts">
import { AddIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref, watchEffect } from 'vue';
import { useRouter } from 'vue-router';

import { getCommunityList } from '@/api/community';
import {
  addLandlordLease,
  getLandlordLeaseByRoomId,
  removeLandlordLease,
  updateLandlordLease,
} from '@/api/landlordLease';
import type { CommunityItem } from '@/api/model/communityModel';
import type { LandlordLeaseDetail } from '@/api/model/landlordLeaseModel';
import { PaymentMethod, PaymentMethodText } from '@/api/model/landlordLeaseModel';
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
  rentPrice?: number;
  deposit?: number;
  waterPrice?: number;
  electricPrice?: number;
  elevatorFee?: number;
  propertyFee?: number;
  internetFee?: number;
  otherFees?: number;
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
const router = useRouter();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'communityName', title: '小区', width: 140 },
  { colKey: 'roomInfo', title: '房间', width: 140 },
  { colKey: 'rentPrice', title: '出租价', width: 100 },
  { colKey: 'deposit', title: '押金', width: 100 },
  { colKey: 'status', title: '状态', width: 90 },
  { colKey: 'remark', title: '备注', width: 150, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 160 },
  { colKey: 'op', title: '操作', width: 220, fixed: 'right' },
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
  { label: '已收回', value: RoomStatus.Reclaimed },
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
  rentPrice: undefined,
  deposit: undefined,
  waterPrice: undefined,
  electricPrice: undefined,
  elevatorFee: undefined,
  propertyFee: undefined,
  internetFee: undefined,
  otherFees: undefined,
  status: RoomStatus.Vacant,
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  communityId: [{ required: true, message: '请选择小区', trigger: 'change' }],
  building: [{ required: true, message: '请输入楼栋号', trigger: 'blur' }],
  roomNumber: [{ required: true, message: '请输入房间号', trigger: 'blur' }],
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

// 房东租约抽屉状态
const leaseDrawerVisible = ref(false);
const leaseLoading = ref(false);
const leaseData = ref<LandlordLeaseDetail | null>(null);
const leaseEditMode = ref(false);
const leaseSaving = ref(false);
const leaseDeleting = ref(false);
const leaseDeleteConfirmVisible = ref(false);
const currentLeaseRoom = ref<RoomItem | null>(null);
const leaseFormRef = ref<FormInstanceFunctions>();

const leaseForm = ref({
  landlordName: '',
  landlordPhone: '',
  startDate: '',
  endDate: '',
  monthlyRent: undefined as number | undefined,
  paymentMethod: PaymentMethod.Monthly as PaymentMethod,
  depositMonths: undefined as number | undefined,
  waterPrice: undefined as number | undefined,
  electricPrice: undefined as number | undefined,
  elevatorFee: undefined as number | undefined,
  propertyFee: undefined as number | undefined,
  internetFee: undefined as number | undefined,
  otherFees: undefined as number | undefined,
  remark: '',
});

const leaseFormRules: Record<string, FormRule[]> = {
  landlordName: [{ required: true, message: '请输入房东姓名', trigger: 'blur' }],
  monthlyRent: [{ required: true, message: '请输入月租金', trigger: 'blur' }],
  paymentMethod: [{ required: true, message: '请选择付款方式', trigger: 'change' }],
};

const paymentMethodOptions = computed(() =>
  Object.entries(PaymentMethodText).map(([value, label]) => ({
    value: Number(value),
    label,
  })),
);

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
    rentPrice: undefined,
    deposit: undefined,
    waterPrice: undefined,
    electricPrice: undefined,
    elevatorFee: undefined,
    propertyFee: undefined,
    internetFee: undefined,
    otherFees: undefined,
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
    rentPrice: row.rentPrice,
    deposit: row.deposit,
    waterPrice: row.waterPrice,
    electricPrice: row.electricPrice,
    elevatorFee: row.elevatorFee,
    propertyFee: row.propertyFee,
    internetFee: row.internetFee,
    otherFees: row.otherFees,
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
        rentPrice: formData.value.rentPrice!,
        deposit: formData.value.deposit,
        waterPrice: formData.value.waterPrice,
        electricPrice: formData.value.electricPrice,
        elevatorFee: formData.value.elevatorFee,
        propertyFee: formData.value.propertyFee,
        internetFee: formData.value.internetFee,
        otherFees: formData.value.otherFees,
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
        rentPrice: formData.value.rentPrice!,
        deposit: formData.value.deposit,
        waterPrice: formData.value.waterPrice,
        electricPrice: formData.value.electricPrice,
        elevatorFee: formData.value.elevatorFee,
        propertyFee: formData.value.propertyFee,
        internetFee: formData.value.internetFee,
        otherFees: formData.value.otherFees,
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

/** 报修 - 跳转维修表单页 */
function handleMaintenance(row: RoomItem) {
  router.push(`/maintenance/add?roomId=${row.id}`);
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

// ==================== 房东租约方法 ====================

/** 重置租约表单 */
function resetLeaseForm() {
  leaseForm.value = {
    landlordName: '',
    landlordPhone: '',
    startDate: '',
    endDate: '',
    monthlyRent: undefined,
    paymentMethod: PaymentMethod.Monthly,
    depositMonths: undefined,
    waterPrice: undefined,
    electricPrice: undefined,
    elevatorFee: undefined,
    propertyFee: undefined,
    internetFee: undefined,
    otherFees: undefined,
    remark: '',
  };
}

/** 抽屉关闭回调 */
function handleLeaseDrawerClose() {
  leaseEditMode.value = false;
  leaseFormRef.value?.reset();
}

/** 打开租约抽屉 */
async function handleOpenLease(row: RoomItem) {
  currentLeaseRoom.value = row;
  leaseDrawerVisible.value = true;
  leaseLoading.value = true;
  leaseEditMode.value = false;
  leaseData.value = null;
  resetLeaseForm();

  try {
    const res = await getLandlordLeaseByRoomId(row.id);
    leaseData.value = res ?? null;
  } catch {
    leaseData.value = null;
    MessagePlugin.error('获取租约信息失败');
  } finally {
    leaseLoading.value = false;
  }
}

/** 进入添加模式 */
function handleAddLease() {
  leaseEditMode.value = true;
  resetLeaseForm();
  if (currentLeaseRoom.value) {
    leaseForm.value.waterPrice = currentLeaseRoom.value.waterPrice;
    leaseForm.value.electricPrice = currentLeaseRoom.value.electricPrice;
    leaseForm.value.elevatorFee = currentLeaseRoom.value.elevatorFee;
    leaseForm.value.propertyFee = currentLeaseRoom.value.propertyFee;
    leaseForm.value.internetFee = currentLeaseRoom.value.internetFee;
    leaseForm.value.otherFees = currentLeaseRoom.value.otherFees;
  }
}

/** 进入编辑模式 */
function handleEditLease() {
  if (!leaseData.value) return;
  leaseEditMode.value = true;
  leaseForm.value = {
    landlordName: leaseData.value.landlordName,
    landlordPhone: leaseData.value.landlordPhone ?? '',
    startDate: leaseData.value.startDate?.split('T')[0] ?? '',
    endDate: leaseData.value.endDate?.split('T')[0] ?? '',
    monthlyRent: leaseData.value.monthlyRent,
    paymentMethod: leaseData.value.paymentMethod,
    depositMonths: leaseData.value.depositMonths,
    waterPrice: leaseData.value.waterPrice,
    electricPrice: leaseData.value.electricPrice,
    elevatorFee: leaseData.value.elevatorFee,
    propertyFee: leaseData.value.propertyFee,
    internetFee: leaseData.value.internetFee,
    otherFees: leaseData.value.otherFees,
    remark: leaseData.value.remark ?? '',
  };
}

/** 保存租约 */
async function handleSaveLease() {
  const valid = await leaseFormRef.value?.validate();
  if (valid !== true) return;

  leaseSaving.value = true;
  try {
    if (leaseData.value?.id) {
      await updateLandlordLease({
        id: leaseData.value.id,
        landlordName: leaseForm.value.landlordName,
        landlordPhone: leaseForm.value.landlordPhone || undefined,
        startDate: leaseForm.value.startDate || undefined,
        endDate: leaseForm.value.endDate || undefined,
        monthlyRent: leaseForm.value.monthlyRent!,
        paymentMethod: leaseForm.value.paymentMethod,
        depositMonths: leaseForm.value.depositMonths,
        waterPrice: leaseForm.value.waterPrice,
        electricPrice: leaseForm.value.electricPrice,
        elevatorFee: leaseForm.value.elevatorFee,
        propertyFee: leaseForm.value.propertyFee,
        internetFee: leaseForm.value.internetFee,
        otherFees: leaseForm.value.otherFees,
        remark: leaseForm.value.remark || undefined,
      });
      MessagePlugin.success('更新租约成功');
    } else {
      await addLandlordLease({
        roomId: currentLeaseRoom.value!.id,
        landlordName: leaseForm.value.landlordName,
        landlordPhone: leaseForm.value.landlordPhone || undefined,
        startDate: leaseForm.value.startDate || undefined,
        endDate: leaseForm.value.endDate || undefined,
        monthlyRent: leaseForm.value.monthlyRent!,
        paymentMethod: leaseForm.value.paymentMethod,
        depositMonths: leaseForm.value.depositMonths,
        waterPrice: leaseForm.value.waterPrice,
        electricPrice: leaseForm.value.electricPrice,
        elevatorFee: leaseForm.value.elevatorFee,
        propertyFee: leaseForm.value.propertyFee,
        internetFee: leaseForm.value.internetFee,
        otherFees: leaseForm.value.otherFees,
        remark: leaseForm.value.remark || undefined,
      });
      MessagePlugin.success('添加租约成功');
    }
    leaseEditMode.value = false;
    const res = await getLandlordLeaseByRoomId(currentLeaseRoom.value!.id);
    leaseData.value = res ?? null;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '操作失败');
  } finally {
    leaseSaving.value = false;
  }
}

/** 删除租约确认 */
function handleDeleteLeaseConfirm() {
  leaseDeleteConfirmVisible.value = true;
}

/** 确认删除租约 */
async function handleDeleteLease() {
  if (!leaseData.value) return;

  leaseDeleting.value = true;
  try {
    await removeLandlordLease(leaseData.value.id);
    MessagePlugin.success('删除租约成功');
    leaseDeleteConfirmVisible.value = false;
    leaseEditMode.value = false;
    leaseData.value = null;
    resetLeaseForm();
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
    leaseDeleteConfirmVisible.value = false;
  } finally {
    leaseDeleting.value = false;
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

  .form-section-title {
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  :deep(.t-divider) {
    margin: 8px 0 20px;
  }
}

.lease-drawer-content {
  padding: 0 8px;

  .lease-loading {
    display: flex;
    justify-content: center;
    padding: 80px 0;
  }

  .lease-detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .lease-detail-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .lease-price {
    color: var(--td-error-color);
    font-weight: 500;
  }

  .lease-drawer-footer {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid var(--td-component-border);
  }

  .form-section-title {
    margin-bottom: 16px;
    font-size: 14px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }
}
</style>
