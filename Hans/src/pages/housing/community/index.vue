<template>
  <div class="community-management">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" data-testid="add-community-button" @click="handleCreate">
            <template #icon><add-icon /></template>
            新建小区
          </t-button>
        </div>
        <div class="search-input">
          <t-input
            v-model="searchValue"
            placeholder="搜索小区名称/地址"
            clearable
            data-testid="search-input"
            @enter="handleSearch"
            @clear="handleSearch"
          >
            <template #suffix-icon>
              <search-icon size="16px" @click="handleSearch" />
            </template>
          </t-input>
        </div>
      </t-row>

      <!-- 数据表格 -->
      <t-table
        :data="filteredData"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        data-testid="community-table"
        @page-change="handlePageChange"
      >
        <template #name="{ row }">
          <span class="community-name">{{ row.name }}</span>
        </template>
        <template #address="{ row }">
          <span class="text-secondary">{{ row.address || '-' }}</span>
        </template>
        <template #propertyPhone="{ row }">
          <span>{{ row.propertyPhone || '-' }}</span>
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
      :header="dialogType === 'create' ? '新建小区' : '编辑小区'"
      width="520px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="community-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="80px">
        <t-form-item label="小区名称" name="name">
          <t-input
            v-model="formData.name"
            placeholder="请输入小区名称"
            :maxlength="100"
            data-testid="community-name-input"
          />
        </t-form-item>
        <t-form-item label="小区地址" name="address">
          <t-input
            v-model="formData.address"
            placeholder="请输入小区地址"
            :maxlength="200"
            data-testid="community-address-input"
          />
        </t-form-item>
        <t-form-item label="物业电话" name="propertyPhone">
          <t-input
            v-model="formData.propertyPhone"
            placeholder="请输入物业电话"
            :maxlength="20"
            data-testid="community-phone-input"
          />
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
            data-testid="community-remark-input"
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
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import { createCommunity, deleteCommunity, getCommunityList, updateCommunity } from '@/api/community';
import type { CommunityItem } from '@/api/model/communityModel';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';
import { formatDateTime } from '@/utils/date';

defineOptions({
  name: 'HousingCommunity',
});

// ==================== 类型定义 ====================

/** 表单数据类型 */
interface CommunityFormData {
  id?: number;
  name: string;
  address?: string;
  propertyPhone?: string;
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
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'name', title: '小区名称', width: 200, ellipsis: true },
  { colKey: 'address', title: '地址', width: 250, ellipsis: true },
  { colKey: 'propertyPhone', title: '物业电话', width: 140 },
  { colKey: 'remark', title: '备注', width: 200, ellipsis: true },
  { colKey: 'createdTime', title: '创建时间', width: 180 },
  { colKey: 'op', title: '操作', width: 120, fixed: 'right' },
];

// 状态
const loading = ref(false);
const data = ref<CommunityItem[]>([]);
const searchValue = ref('');
const pagination = ref({
  defaultPageSize: 20,
  total: 0,
  defaultCurrent: 1,
});

// 对话框状态
const dialogVisible = ref(false);
const dialogType = ref<'create' | 'edit'>('create');
const submitLoading = ref(false);
const formRef = ref<FormInstanceFunctions>();
const editingCommunityId = ref<number | null>(null);

// 表单数据
const formData = ref<CommunityFormData>({
  name: '',
  address: '',
  propertyPhone: '',
  remark: '',
});

const formRules: Record<string, FormRule[]> = {
  name: [{ required: true, message: '请输入小区名称', trigger: 'blur' }],
};

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingCommunity = ref<CommunityItem | null>(null);
const deleteConfirmBody = computed(() => {
  if (deletingCommunity.value) {
    return `确定要删除小区「${deletingCommunity.value.name}」吗？删除后无法恢复。`;
  }
  return '';
});

// 过滤数据
// 注意：当前使用前端分页和搜索过滤，适用于小区数量较少（<1000）的场景
// 如需支持大数据量，建议改为后端分页，在 API 请求时传递分页参数和搜索关键词
const filteredData = computed(() => {
  if (!searchValue.value) return data.value;
  const keyword = searchValue.value.toLowerCase();
  return data.value.filter(
    (item) => item.name.toLowerCase().includes(keyword) || item.address?.toLowerCase().includes(keyword),
  );
});

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// 获取小区列表
async function fetchData() {
  loading.value = true;
  try {
    const res = await getCommunityList();
    data.value = res || [];
    pagination.value.total = data.value.length;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取小区列表失败');
  } finally {
    loading.value = false;
  }
}

// 搜索：重置到第一页
function handleSearch() {
  pagination.value.defaultCurrent = 1;
  // 注意：TDesign Table 的 pagination 使用 defaultCurrent 进行受控分页
  // 如需完全控制，需改用 current 属性并在此处同步更新
}

// 分页
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.defaultCurrent = pageInfo.current;
  pagination.value.defaultPageSize = pageInfo.pageSize;
}

// 创建小区
function handleCreate() {
  dialogType.value = 'create';
  formData.value = {
    name: '',
    address: '',
    propertyPhone: '',
    remark: '',
  };
  dialogVisible.value = true;
}

// 编辑小区
function handleEdit(row: CommunityItem) {
  dialogType.value = 'edit';
  editingCommunityId.value = row.id;
  formData.value = {
    id: row.id,
    name: row.name,
    address: row.address || '',
    propertyPhone: row.propertyPhone || '',
    remark: row.remark || '',
  };
  dialogVisible.value = true;
}

// 提交表单
async function handleSubmit() {
  const valid = await formRef.value?.validate();
  if (valid !== true) return;

  submitLoading.value = true;
  try {
    if (dialogType.value === 'create') {
      await createCommunity({
        name: formData.value.name,
        address: formData.value.address || undefined,
        propertyPhone: formData.value.propertyPhone || undefined,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('创建小区成功');
    } else {
      await updateCommunity({
        id: editingCommunityId.value!,
        name: formData.value.name,
        address: formData.value.address || undefined,
        propertyPhone: formData.value.propertyPhone || undefined,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('更新小区成功');
    }
    dialogVisible.value = false;
    await fetchData(); // 等待数据刷新完成
  } catch (e: any) {
    MessagePlugin.error(e.message || '操作失败');
  } finally {
    submitLoading.value = false;
  }
}

// 关闭对话框
function handleDialogClose() {
  formRef.value?.reset();
  dialogVisible.value = false;
}

// 删除小区
function handleDelete(row: CommunityItem) {
  deletingCommunity.value = row;
  deleteConfirmVisible.value = true;
}

// 确认删除
async function onConfirmDelete() {
  if (!deletingCommunity.value) return;

  deleteLoading.value = true;
  try {
    await deleteCommunity(deletingCommunity.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData(); // 等待数据刷新完成
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
  } finally {
    deleteLoading.value = false;
    deletingCommunity.value = null;
  }
}

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.community-management {
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

  .search-input {
    width: 360px;
    margin-bottom: var(--td-comp-margin-xxl);
  }

  .community-name {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .text-secondary {
    color: var(--td-text-color-secondary);
  }

  .remark-text {
    display: inline-block;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
