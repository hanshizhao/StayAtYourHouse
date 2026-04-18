<template>
  <div class="room-management">
    <t-card class="list-card-container" :bordered="false">
      <!-- 页面标题 -->
      <div class="page-header">
        <h2 class="page-title">
          房间管理
        </h2>
        <t-button theme="primary" data-testid="add-room-button" @click="handleCreate">
          <template #icon>
            <add-icon />
          </template>
          新增房间
        </t-button>
      </div>

      <!-- 筛选栏 -->
      <div class="filter-bar">
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
        <t-select
          v-model="filterHasLeaseAlert"
          :options="leaseAlertOptions"
          placeholder="异常租约"
          clearable
          class="filter-select"
          data-testid="lease-alert-filter"
          @change="handleFilterChange"
        />
      </div>

      <!-- 统计摘要 -->
      <div class="summary-bar">
        <span class="summary-text" data-testid="room-summary">共 {{ pagination.total }} 间</span>
      </div>

      <!-- 卡片网格 -->
      <t-loading :loading="loading">
        <div v-if="roomList.length > 0" class="room-card-grid" data-testid="room-card-grid">
          <div v-for="room in roomList" :key="room.id" class="room-card" data-testid="room-card">
            <!-- 卡片头部：房间名 + 状态 -->
            <div class="room-card-header">
              <span class="room-card-title">{{ room.communityName }} {{ room.building }}栋 {{ room.roomNumber }}</span>
              <t-tag :theme="getStatusTheme(room.status)" variant="light" size="small">
                {{ getStatusText(room.status) }}
              </t-tag>
            </div>

            <div class="room-card-divider" />

            <!-- 卡片中部：房东租约 | 租客租约 -->
            <div class="room-card-middle">
              <!-- 房东租约 -->
              <div class="room-card-lease landlord-side">
                <span class="lease-label">房东租约</span>
                <template v-if="room.landlordLease">
                  <span class="lease-name">{{ room.landlordLease.landlordName }}</span>
                  <div class="lease-rent-row">
                    <span class="lease-rent-value">¥{{ formatRent(room.landlordLease.monthlyRent) }}</span>
                    <span class="lease-rent-unit">/月</span>
                  </div>
                  <span class="lease-expiry">到期 {{ formatDate(room.landlordLease.endDate) }}</span>
                  <span :class="['lease-status-tag', `lease-status-${getLeaseStatusKey(room.landlordLeaseStatus)}`]">
                    {{ getLeaseStatusText(room.landlordLeaseStatus, room.landlordLeaseExpiredDays) }}
                  </span>
                </template>
                <span v-else class="lease-empty">无房东租约</span>
              </div>

              <!-- 租客租约 -->
              <div class="room-card-lease tenant-side">
                <span class="lease-label">租客租约</span>
                <template v-if="room.tenantName">
                  <span class="lease-name">{{ room.tenantName }}</span>
                  <div class="lease-rent-row">
                    <span class="lease-rent-value">¥{{ formatRent(room.tenantMonthlyRent) }}</span>
                    <span class="lease-rent-unit">/月</span>
                  </div>
                  <span class="lease-expiry">到期 {{ formatDate(room.rentalEndDate) }}</span>
                  <span :class="['lease-status-tag', `lease-status-${getLeaseStatusKey(room.tenantLeaseStatus)}`]">
                    {{ getLeaseStatusText(room.tenantLeaseStatus, room.tenantLeaseExpiredDays) }}
                  </span>
                </template>
                <span v-else class="lease-empty">暂无租客</span>
              </div>
            </div>

            <div class="room-card-divider" />

            <!-- 卡片底部：利润 + 操作 -->
            <div class="room-card-bottom">
              <div class="room-card-profit">
                <span class="profit-label">{{ room.tenantName ? '实际利润' : '预期利润' }}</span>
                <span :class="['profit-value', room.profit >= 0 ? 'positive' : 'negative']">
                  {{ formatProfit(room.profit) }}/月
                </span>
              </div>
              <div class="room-card-actions">
                <t-button variant="text" shape="square" data-testid="edit-button" @click="handleEdit(room)">
                  <template #icon>
                    <edit-icon />
                  </template>
                </t-button>
                <t-button variant="text" shape="square" data-testid="lease-button" @click="handleOpenLease(room)">
                  <template #icon>
                    <file-icon />
                  </template>
                </t-button>
                <t-button variant="text" shape="square" data-testid="maintenance-button" @click="handleMaintenance(room)">
                  <template #icon>
                    <tools-icon />
                  </template>
                </t-button>
                <t-button variant="text" shape="square" theme="danger" data-testid="delete-button" @click="handleDelete(room)">
                  <template #icon>
                    <delete-icon />
                  </template>
                </t-button>
              </div>
            </div>
          </div>
        </div>
        <t-empty v-else description="暂无房间数据" />
      </t-loading>

      <!-- 分页 -->
      <div class="pagination-container">
        <t-pagination
          :current="pagination.current"
          :page-size="pagination.pageSize"
          :total="pagination.total"
          show-page-size
          :page-size-options="PAGE_SIZE_OPTIONS"
          data-testid="room-pagination"
          @current-change="handlePageChange"
          @page-size-change="handlePageSizeChange"
        />
      </div>
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
        <div class="form-section-title">
          基本信息
        </div>
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
        <div class="form-section-title">
          价格信息
        </div>
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
        <div class="form-section-title">
          费用设置
        </div>
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
      <p data-testid="confirm-dialog-message">
        {{ deleteConfirmBody }}
      </p>
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
            <div class="form-section-title">
              房东信息
            </div>
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

            <div class="form-section-title">
              租约信息
            </div>
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
                <t-form-item label="押金金额" name="deposit">
                  <t-input-number
                    v-model="leaseForm.deposit"
                    theme="normal"
                    placeholder="押金金额"
                    :min="0"
                    :decimal-places="2"
                    prefix="¥"
                    data-testid="lease-deposit"
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

            <div class="form-section-title">
              费用信息
            </div>
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

            <div class="form-section-title">
              备注
            </div>
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
              <t-button variant="outline" @click="leaseEditMode = false">
                取消
              </t-button>
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
            <t-descriptions-item label="房东姓名">
              {{ leaseData.landlordName }}
            </t-descriptions-item>
            <t-descriptions-item label="联系电话">
              {{ leaseData.landlordPhone || '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="开始日期">
              {{ leaseData.startDate ? leaseData.startDate.split('T')[0] : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="结束日期">
              {{ leaseData.endDate ? leaseData.endDate.split('T')[0] : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="月租金">
              <span class="lease-price">¥{{ leaseData.monthlyRent.toFixed(2) }}</span>
            </t-descriptions-item>
            <t-descriptions-item label="付款方式">
              {{ leaseData.paymentMethodText }}
            </t-descriptions-item>
            <t-descriptions-item label="押金金额">
              {{ leaseData.deposit != null ? `¥${leaseData.deposit.toFixed(2)}` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="押金月数">
              {{ leaseData.depositMonths ? `${leaseData.depositMonths}个月` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="水费">
              {{ leaseData.waterPrice != null ? `¥${leaseData.waterPrice.toFixed(2)}/吨` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="电费">
              {{ leaseData.electricPrice != null ? `¥${leaseData.electricPrice.toFixed(2)}/度` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="电梯费">
              {{ leaseData.elevatorFee != null ? `¥${leaseData.elevatorFee.toFixed(2)}` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="物业费">
              {{ leaseData.propertyFee != null ? `¥${leaseData.propertyFee.toFixed(2)}` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="网络费">
              {{ leaseData.internetFee != null ? `¥${leaseData.internetFee.toFixed(2)}` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item label="其他费用">
              {{ leaseData.otherFees != null ? `¥${leaseData.otherFees.toFixed(2)}` : '-' }}
            </t-descriptions-item>
            <t-descriptions-item v-if="leaseData.remark" label="备注" :span="2">
              {{ leaseData.remark }}
            </t-descriptions-item>
          </t-descriptions>
        </template>

        <!-- 空状态 -->
        <template v-else>
          <t-empty description="暂无租约信息" data-testid="lease-empty-state">
            <template #action>
              <t-button theme="primary" data-testid="lease-add-button" @click="handleAddLease">
                添加租约
              </t-button>
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
import { AddIcon, DeleteIcon, EditIcon, FileIcon, ToolsIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, SelectOption } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, reactive, ref } from 'vue';
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
import type { GetRoomListParams, RoomItem } from '@/api/model/roomModel';
import { LeaseStatus, RoomStatus, RoomStatusText } from '@/api/model/roomModel';
import { createRoom, deleteRoom, getRoomList, updateRoom } from '@/api/room';

defineOptions({
  name: 'HousingRoom',
});

// ==================== 类型定义 ====================

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

// ==================== 状态 ====================

const router = useRouter();

// 数据
const loading = ref(false);
const roomList = ref<RoomItem[]>([]);
const pagination = reactive({
  current: 1,
  pageSize: 9,
  total: 0,
});

// 筛选
const filterCommunityId = ref<number | undefined>(undefined);
const filterStatus = ref<RoomStatus | undefined>(undefined);
const filterHasLeaseAlert = ref<boolean | undefined>(undefined);

// 小区选项
const communities = ref<CommunityItem[]>([]);
const communityOptions = computed<SelectOption[]>(() => communities.value.map((c) => ({ label: c.name, value: c.id })));

// 状态选项
const statusOptions: SelectOption[] = [
  { label: '空置', value: RoomStatus.Vacant },
  { label: '已出租', value: RoomStatus.Rented },
  { label: '装修中', value: RoomStatus.Renovating },
  { label: '已收回', value: RoomStatus.Reclaimed },
];

// 异常租约选项
const leaseAlertOptions: SelectOption[] = [
  { label: '仅显示异常', value: true },
];

const PAGE_SIZE_OPTIONS = [9, 18, 27];

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
  deposit: undefined as number | undefined,
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

// ==================== 辅助方法 ====================

function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',
  };
  return themes[status];
}

function getStatusText(status: RoomStatus): string {
  return RoomStatusText[status];
}

function getLeaseStatusKey(status: LeaseStatus): string {
  switch (status) {
    case LeaseStatus.Normal: return 'normal';
    case LeaseStatus.ExpiringSoon: return 'expiring';
    case LeaseStatus.Expired: return 'expired';
    default: return 'none';
  }
}

function getLeaseStatusText(status: LeaseStatus, expiredDays?: number | null): string {
  switch (status) {
    case LeaseStatus.Normal: return '正常';
    case LeaseStatus.ExpiringSoon: return '即将到期';
    case LeaseStatus.Expired: return expiredDays ? `已逾期 ${expiredDays}天` : '已逾期';
    case LeaseStatus.None: return '无租约';
    default: return '';
  }
}

function formatRent(rent?: number | null): string {
  if (rent == null) return '-';
  return rent.toLocaleString('zh-CN');
}

function formatDate(date?: string | null): string {
  if (!date) return '-';
  return date.split('T')[0];
}

function formatProfit(profit: number): string {
  const sign = profit >= 0 ? '+' : '-';
  return `${sign}¥${Math.abs(profit).toLocaleString('zh-CN')}`;
}

// ==================== 数据获取 ====================

async function fetchCommunities() {
  try {
    const res = await getCommunityList();
    communities.value = res || [];
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取小区列表失败');
  }
}

async function fetchData() {
  loading.value = true;
  try {
    const params: GetRoomListParams = {
      page: pagination.current,
      pageSize: pagination.pageSize,
    };
    if (filterCommunityId.value !== undefined) params.communityId = filterCommunityId.value;
    if (filterStatus.value !== undefined) params.status = filterStatus.value;
    if (filterHasLeaseAlert.value !== undefined) params.hasLeaseAlert = filterHasLeaseAlert.value;

    const res = await getRoomList(params);
    roomList.value = res?.list || [];
    pagination.total = res?.total || 0;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取房间列表失败');
  } finally {
    loading.value = false;
  }
}

// ==================== 事件处理 ====================

function handleFilterChange() {
  pagination.current = 1;
  fetchData();
}

function handlePageChange(current: number) {
  pagination.current = current;
  fetchData();
}

function handlePageSizeChange(pageSize: number) {
  pagination.pageSize = pageSize;
  pagination.current = 1;
  fetchData();
}

// ==================== 房间 CRUD ====================

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

function handleEdit(room: RoomItem) {
  dialogType.value = 'edit';
  editingRoomId.value = room.id;
  formData.value = {
    id: room.id,
    communityId: room.communityId,
    building: room.building,
    roomNumber: room.roomNumber,
    rentPrice: room.rentPrice,
    deposit: room.deposit,
    waterPrice: room.waterPrice,
    electricPrice: room.electricPrice,
    elevatorFee: room.elevatorFee,
    propertyFee: room.propertyFee,
    internetFee: room.internetFee,
    otherFees: room.otherFees,
    status: room.status,
    remark: room.remark,
  };
  dialogVisible.value = true;
}

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

function handleDialogClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}

function handleDelete(room: RoomItem) {
  deletingRoom.value = room;
  deleteConfirmVisible.value = true;
}

function handleMaintenance(room: RoomItem) {
  router.push(`/maintenance/add?roomId=${room.id}`);
}

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

function resetLeaseForm() {
  leaseForm.value = {
    landlordName: '',
    landlordPhone: '',
    startDate: '',
    endDate: '',
    monthlyRent: undefined,
    paymentMethod: PaymentMethod.Monthly,
    deposit: undefined,
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

function handleLeaseDrawerClose() {
  leaseEditMode.value = false;
  leaseFormRef.value?.reset();
}

async function handleOpenLease(room: RoomItem) {
  currentLeaseRoom.value = room;
  leaseDrawerVisible.value = true;
  leaseLoading.value = true;
  leaseEditMode.value = false;
  leaseData.value = null;
  resetLeaseForm();

  try {
    const res = await getLandlordLeaseByRoomId(room.id);
    leaseData.value = res ?? null;
  } catch {
    leaseData.value = null;
    MessagePlugin.error('获取租约信息失败');
  } finally {
    leaseLoading.value = false;
  }
}

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
    deposit: leaseData.value.deposit,
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
        deposit: leaseForm.value.deposit,
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
        deposit: leaseForm.value.deposit,
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

function handleDeleteLeaseConfirm() {
  leaseDeleteConfirmVisible.value = true;
}

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

  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .page-title {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .filter-bar {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .filter-select {
    width: 160px;
  }

  .summary-bar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 16px;
  }

  .summary-text {
    font-size: 13px;
    color: var(--td-text-color-placeholder);
  }

  // 卡片网格
  .room-card-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 25px;
  }

  // 单个卡片
  .room-card {
    display: flex;
    flex-direction: column;
    background: var(--td-bg-color-container);
    border: 1px solid var(--td-component-border);
    border-radius: 8px;
    overflow: hidden;
  }

  .room-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
  }

  .room-card-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .room-card-divider {
    height: 1px;
    background: var(--td-component-border);
  }

  // 中部：房东/租客两栏
  .room-card-middle {
    display: flex;
    padding: 16px 20px;
  }

  .room-card-lease {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 155px;
  }

  .landlord-side {
    padding-right: 12px;
    border-right: 1px solid var(--td-component-border);
  }

  .tenant-side {
    padding-left: 12px;
  }

  .lease-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--td-text-color-placeholder);
  }

  .lease-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .lease-rent-row {
    display: flex;
    align-items: baseline;
    gap: 4px;
  }

  .lease-rent-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .lease-rent-unit {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
  }

  .lease-expiry {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }

  .lease-status-tag {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 500;
    width: fit-content;
  }

  .lease-status-normal {
    color: var(--td-success-color);
    background: var(--td-success-color-1);
  }

  .lease-status-expiring {
    color: var(--td-warning-color);
    background: var(--td-warning-color-1);
  }

  .lease-status-expired {
    color: var(--td-error-color);
    background: var(--td-error-color-1);
  }

  .lease-status-none {
    color: var(--td-text-color-disabled);
    background: var(--td-gray-color-1);
  }

  .lease-empty {
    font-size: 14px;
    color: var(--td-text-color-placeholder);
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 1;
  }

  // 底部：利润 + 操作
  .room-card-bottom {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 20px;
  }

  .room-card-profit {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .profit-label {
    font-size: 11px;
    color: var(--td-text-color-placeholder);
  }

  .profit-value {
    font-size: 16px;
    font-weight: 600;

    &.positive {
      color: var(--td-success-color);
    }

    &.negative {
      color: var(--td-error-color);
    }
  }

  .room-card-actions {
    display: flex;
    gap: 4px;
  }

  // 分页
  .pagination-container {
    display: flex;
    justify-content: center;
    padding-top: 16px;
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

  // 响应式
  @media (max-width: 1200px) {
    .room-card-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .room-card-grid {
      grid-template-columns: 1fr;
    }

    .filter-bar {
      flex-wrap: wrap;
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
  }
}
</style>
