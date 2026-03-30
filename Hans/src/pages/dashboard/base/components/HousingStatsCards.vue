<template>
  <div class="housing-stats-cards" data-testid="housing-stats-cards">
    <div class="stat-card total">
      <div class="card-icon">
        <t-icon name="home" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">总房源</span>
        <span class="card-number">
          <span class="card-value" data-testid="total-rooms">{{ totalRooms }}</span>
          <span class="card-unit">间</span>
        </span>
      </div>
    </div>
    <div class="stat-card rented">
      <div class="card-icon">
        <t-icon name="user-checked" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">已出租</span>
        <span class="card-number">
          <span class="card-value" data-testid="rented-rooms">{{ rentedCount }}</span>
          <span class="card-unit">间</span>
        </span>
      </div>
    </div>
    <div class="stat-card vacant">
      <div class="card-icon">
        <t-icon name="user-clear" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">空置</span>
        <span class="card-number">
          <span class="card-value" data-testid="vacant-rooms">{{ vacantCount }}</span>
          <span class="card-unit">间</span>
        </span>
      </div>
    </div>
    <div class="stat-card renovating">
      <div class="card-icon">
        <t-icon name="tools" size="24px" />
      </div>
      <div class="card-content">
        <span class="card-label">装修中</span>
        <span class="card-number">
          <span class="card-value" data-testid="renovating-rooms">{{ renovatingCount }}</span>
          <span class="card-unit">间</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'HousingStatsCards',
});

defineProps<{
  totalRooms: number;
  rentedCount: number;
  vacantCount: number;
  renovatingCount: number;
}>();
</script>

<style lang="less" scoped>
.housing-stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px;
  background: var(--td-bg-color-container);
  border-radius: var(--td-radius-large);

  .card-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    border-radius: var(--td-radius-default);
  }

  .card-content {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .card-label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }

  .card-value {
    font-size: 24px;
    font-weight: 600;
  }

  .card-unit {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    margin-left: 2px;
  }

  &.total {
    .card-icon {
      background: rgba(0, 82, 217, 0.1);
      color: var(--td-brand-color);
    }

    .card-value {
      color: var(--td-brand-color);
    }
  }

  &.rented {
    .card-icon {
      background: rgba(0, 168, 112, 0.1);
      color: var(--td-success-color);
    }

    .card-value {
      color: var(--td-success-color);
    }
  }

  &.vacant {
    .card-icon {
      background: rgba(237, 123, 47, 0.1);
      color: var(--td-warning-color);
    }

    .card-value {
      color: var(--td-warning-color);
    }
  }

  &.renovating {
    .card-icon {
      background: rgba(227, 77, 77, 0.1);
      color: var(--td-error-color);
    }

    .card-value {
      color: var(--td-error-color);
    }
  }
}

@media (max-width: 992px) {
  .housing-stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .housing-stats-cards {
    grid-template-columns: 1fr;
  }
}
</style>
