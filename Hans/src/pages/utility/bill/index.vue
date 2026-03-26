<template>
  <div class="utility-bill">
    <t-card class="list-card-container" :bordered="false">
      <div class="placeholder-content">
        <t-empty description="水电账单页面 - FEAT-024 待实现" />
      </div>
    </t-card>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'UtilityBill',
});
</script>

<style lang="less" scoped>
.utility-bill {
  .list-card-container {
    padding: var(--td-comp-paddingTB-xxl) var(--td-comp-paddingLR-xxl);
  }

  .placeholder-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
  }
}
</style>
