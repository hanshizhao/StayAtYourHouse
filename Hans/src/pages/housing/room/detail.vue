<template>
  <div class="room-detail">
    <!-- 页面头部 -->
    <t-card class="header-card" :bordered="false">
      <t-row justify="space-between" align="center">
        <div class="header-left">
          <t-button variant="text" data-testid="back-button" @click="handleBack">
            <template #icon><chevron-left-icon /></template>
            返回
          </t-button>
          <span class="page-title" data-testid="page-title">房间详情</span>
        </div>
        <div class="header-right">
          <t-button theme="primary" data-testid="edit-button" @click="handleEdit">
            <template #icon><edit-icon /></template>
            编辑
          </t-button>
        </div>
      </t-row>
    </t-card>

    <!-- 加载状态 -->
    <t-loading v-if="loading" size="large" class="loading-container" />

    <!-- 错误状态 -->
    <t-card v-else-if="error" class="error-card" :bordered="false">
      <t-empty data-testid="error-state" :description="error" />
    </t-card>

    <!-- 详情内容 -->
    <template v-else-if="roomDetail">
      <!-- 基本信息卡片 -->
      <t-card class="info-card" title="基本信息" :bordered="false" data-testid="room-info-card">
        <template #subtitle>
          <t-tag :theme="getStatusTheme(roomDetail.status)" variant="light" data-testid="status-tag">
            {{ getStatusText(roomDetail.status) }}
          </t-tag>
        </template>
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="小区">
            <span class="community-name">{{ roomDetail.communityName }}</span>
          </t-descriptions-item>
          <t-descriptions-item label="楼栋"> {{ roomDetail.building }}栋 </t-descriptions-item>
          <t-descriptions-item label="房间号">
            {{ roomDetail.roomNumber }}
          </t-descriptions-item>
          <t-descriptions-item label="面积">
            {{ roomDetail.area ? `${roomDetail.area}㎡` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="房型">
            {{ roomDetail.roomType || '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="状态">
            <t-tag :theme="getStatusTheme(roomDetail.status)" variant="light">
              {{ getStatusText(roomDetail.status) }}
            </t-tag>
          </t-descriptions-item>
        </t-descriptions>
      </t-card>

      <!-- 价格信息卡片 -->
      <t-card class="info-card" title="价格信息" :bordered="false" data-testid="price-info-card">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="出租价">
            <span class="price">¥{{ roomDetail.rentPrice?.toFixed(2) ?? '-' }}</span>
          </t-descriptions-item>
          <t-descriptions-item label="押金">
            {{ roomDetail.deposit ? `¥${roomDetail.deposit.toFixed(2)}` : '-' }}
          </t-descriptions-item>
        </t-descriptions>
      </t-card>

      <!-- 房东租约卡片 -->
      <t-card v-if="roomDetail.landlordLease" class="info-card" title="房东租约" :bordered="false" data-testid="landlord-lease-card">
        <template #subtitle>
          <t-tag theme="success" variant="light">已签约</t-tag>
        </template>

        <!-- 房东信息 -->
        <t-descriptions title="房东信息" :column="3" bordered class="lease-section">
          <t-descriptions-item label="房东姓名" data-testid="lease-landlord-name">
            {{ roomDetail.landlordLease.landlordName }}
          </t-descriptions-item>
          <t-descriptions-item label="联系电话" data-testid="lease-landlord-phone">
            {{ roomDetail.landlordLease.landlordPhone || '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="付款方式" data-testid="lease-payment-method">
            {{ roomDetail.landlordLease.paymentMethodText || PaymentMethodText[roomDetail.landlordLease.paymentMethod] || '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="月租金" data-testid="lease-monthly-rent">
            <span class="price">¥{{ roomDetail.landlordLease.monthlyRent?.toFixed(2) }}</span>
          </t-descriptions-item>
          <t-descriptions-item label="押金月数" data-testid="lease-deposit-months">
            {{ roomDetail.landlordLease.depositMonths ? `${roomDetail.landlordLease.depositMonths}个月` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="租约期限" data-testid="lease-date-range">
            {{ roomDetail.landlordLease.startDate && roomDetail.landlordLease.endDate
              ? `${roomDetail.landlordLease.startDate} ~ ${roomDetail.landlordLease.endDate}`
              : '-' }}
          </t-descriptions-item>
        </t-descriptions>

        <!-- 费用信息 -->
        <t-descriptions title="费用信息" :column="3" bordered class="lease-section">
          <t-descriptions-item label="水费单价" data-testid="lease-water-price">
            {{ roomDetail.landlordLease.waterPrice ? `¥${roomDetail.landlordLease.waterPrice.toFixed(2)}/吨` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="电费单价" data-testid="lease-electric-price">
            {{ roomDetail.landlordLease.electricPrice ? `¥${roomDetail.landlordLease.electricPrice.toFixed(2)}/度` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="电梯费" data-testid="lease-elevator-fee">
            {{ roomDetail.landlordLease.elevatorFee ? `¥${roomDetail.landlordLease.elevatorFee.toFixed(2)}` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="物业费" data-testid="lease-property-fee">
            {{ roomDetail.landlordLease.propertyFee ? `¥${roomDetail.landlordLease.propertyFee.toFixed(2)}` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="网费" data-testid="lease-internet-fee">
            {{ roomDetail.landlordLease.internetFee ? `¥${roomDetail.landlordLease.internetFee.toFixed(2)}` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="其他费用" data-testid="lease-other-fees">
            {{ roomDetail.landlordLease.otherFees ? `¥${roomDetail.landlordLease.otherFees.toFixed(2)}` : '-' }}
          </t-descriptions-item>
        </t-descriptions>

        <!-- 利润信息 -->
        <t-descriptions title="利润" :column="3" bordered class="lease-section">
          <t-descriptions-item label="月利润" data-testid="lease-profit">
            <span class="price" :class="[monthlyProfit >= 0 ? 'profit-positive' : 'profit-negative']">
              ¥{{ monthlyProfit.toFixed(2) }}
            </span>
          </t-descriptions-item>
        </t-descriptions>

        <!-- 租约备注 -->
        <t-descriptions v-if="roomDetail.landlordLease.remark" title="备注" :column="1" bordered class="lease-section">
          <t-descriptions-item label="租约备注" data-testid="lease-remark">
            {{ roomDetail.landlordLease.remark }}
          </t-descriptions-item>
        </t-descriptions>
      </t-card>

      <!-- 无房东租约时的空状态 -->
      <t-card v-else class="info-card" title="房东租约" :bordered="false" data-testid="landlord-lease-card">
        <t-empty data-testid="lease-empty-state" description="暂无房东租约信息" />
      </t-card>

      <!-- 备注信息卡片 -->
      <t-card v-if="roomDetail.remark" class="info-card" title="备注信息" :bordered="false">
        <p class="remark-content">{{ roomDetail.remark }}</p>
      </t-card>

      <!-- 当前租客信息卡片（预留，待 FEAT-008~014 实现） -->
      <t-card
        v-if="roomDetail.status === RoomStatus.Rented"
        class="info-card"
        title="当前租客"
        :bordered="false"
        data-testid="tenant-info-card"
      >
        <t-empty description="租客管理模块开发中，敬请期待..." />
      </t-card>

      <!-- 出租记录卡片（预留，待 FEAT-009~011 实现） -->
      <t-card class="info-card" title="出租记录" :bordered="false" data-testid="rental-records-card">
        <t-empty description="出租记录模块开发中，敬请期待..." />
      </t-card>
    </template>
  </div>
</template>
<script setup lang="ts">
import { ChevronLeftIcon, EditIcon } from 'tdesign-icons-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { PaymentMethodText } from '@/api/model/landlordLeaseModel';
import type { RoomItem } from '@/api/model/roomModel';
import { RoomStatus, RoomStatusText } from '@/api/model/roomModel';
import { getRoomById } from '@/api/room';

defineOptions({
  name: 'RoomDetail',
});

// ==================== 状态 ====================

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const error = ref<string | null>(null);
const roomDetail = ref<RoomItem | null>(null);

/** 月利润 = 出租价 - 房东月租金 */
const monthlyProfit = computed(() => {
  const rent = roomDetail.value?.rentPrice ?? 0;
  const cost = roomDetail.value?.landlordLease?.monthlyRent ?? 0;
  return rent - cost;
});

// ==================== 方法 ====================

/** 获取状态主题 */
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' | 'default' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary' | 'default'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
    [RoomStatus.Reclaimed]: 'default',
  };
  return themes[status] ?? 'default';
}

/** 获取状态文本 */
function getStatusText(status: RoomStatus): string {
  return RoomStatusText[status] ?? '未知状态';
}

/** 获取房间详情 */
async function fetchRoomDetail() {
  const id = Number(route.params.id);
  if (!id || Number.isNaN(id)) {
    error.value = '无效的房间ID';
    loading.value = false;
    return;
  }

  loading.value = true;
  error.value = null;

  try {
    const res = await getRoomById(id);
    roomDetail.value = res;
  } catch (e: any) {
    error.value = e.message || '获取房间详情失败';
    MessagePlugin.error(error.value);
  } finally {
    loading.value = false;
  }
}

/** 返回列表 */
function handleBack() {
  router.push('/housing/room');
}

/** 编辑房间 */
function handleEdit() {
  // TODO: 跳转到编辑页面或打开编辑对话框
  MessagePlugin.info('编辑功能开发中...');
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchRoomDetail();
});
</script>
<style lang="less" scoped>
.room-detail {
  .header-card {
    margin-bottom: var(--td-comp-margin-l);

    :deep(.t-card__body) {
      padding: var(--td-comp-paddingTB-l) var(--td-comp-paddingLR-l);
    }
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--td-comp-margin-s);
  }

  .page-title {
    font-size: var(--td-font-size-headline-medium);
    font-weight: 600;
    color: var(--td-text-color-primary);
  }

  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 300px;
  }

  .error-card {
    margin-bottom: var(--td-comp-margin-l);
  }

  .info-card {
    margin-bottom: var(--td-comp-margin-l);

    :deep(.t-card__header) {
      border-bottom: 1px solid var(--td-component-border);
    }

    :deep(.t-card__title) {
      font-weight: 600;
    }
  }

  .community-name {
    font-weight: 500;
    color: var(--td-brand-color);
  }

  .price {
    font-weight: 500;
  }

  .profit-positive {
    color: var(--td-success-color);
  }

  .profit-negative {
    color: var(--td-error-color);
  }

  .remark-content {
    margin: 0;
    color: var(--td-text-color-secondary);
    line-height: 1.6;
    white-space: pre-wrap;
  }

  .lease-section {
    margin-bottom: var(--td-comp-margin-l);

    &:last-child {
      margin-bottom: 0;
    }

    :deep(.t-descriptions__header) {
      margin-bottom: var(--td-comp-margin-s);
    }
  }
}
</style>
