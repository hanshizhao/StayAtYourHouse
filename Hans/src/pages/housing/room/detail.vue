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
      <t-card class="info-card" title="价格信息" :bordered="false">
        <t-descriptions :column="3" bordered>
          <t-descriptions-item label="成本价">
            <span class="price">¥{{ roomDetail.costPrice?.toFixed(2) ?? '-' }}</span>
          </t-descriptions-item>
          <t-descriptions-item label="出租价">
            <span class="price">¥{{ roomDetail.rentPrice?.toFixed(2) ?? '-' }}</span>
          </t-descriptions-item>
          <t-descriptions-item label="利润">
            <span class="price" :class="[(roomDetail.profit ?? 0) >= 0 ? 'profit-positive' : 'profit-negative']">
              ¥{{ roomDetail.profit?.toFixed(2) ?? '-' }}
            </span>
          </t-descriptions-item>
          <t-descriptions-item label="押金">
            {{ roomDetail.deposit ? `¥${roomDetail.deposit.toFixed(2)}` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="水费单价">
            {{ roomDetail.waterPrice ? `¥${roomDetail.waterPrice.toFixed(2)}/吨` : '-' }}
          </t-descriptions-item>
          <t-descriptions-item label="电费单价">
            {{ roomDetail.electricPrice ? `¥${roomDetail.electricPrice.toFixed(2)}/度` : '-' }}
          </t-descriptions-item>
        </t-descriptions>
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
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

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

// ==================== 方法 ====================

/** 获取状态主题 */
function getStatusTheme(status: RoomStatus): 'success' | 'warning' | 'primary' {
  const themes: Record<RoomStatus, 'success' | 'warning' | 'primary'> = {
    [RoomStatus.Vacant]: 'success',
    [RoomStatus.Rented]: 'warning',
    [RoomStatus.Renovating]: 'primary',
  };
  return themes[status];
}

/** 获取状态文本 */
function getStatusText(status: RoomStatus): string {
  return RoomStatusText[status];
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
}
</style>
