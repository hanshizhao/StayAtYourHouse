<template>
  <div class="tenant-management">
    <t-card class="list-card-container" :bordered="false">
      <!-- 顶部操作栏 -->
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" data-testid="add-tenant-button" @click="handleCreate">
            <template #icon><add-icon /></template>
            新建租客
          </t-button>
          <t-button theme="success" data-testid="check-in-button" @click="handleGoCheckIn">
            <template #icon><home-icon /></template>
            入住办理
          </t-button>
        </div>
        <div class="search-input">
          <t-input
            v-model="searchValue"
            placeholder="搜索租客姓名/电话/身份证号"
            clearable
            data-testid="search-input"
            @clear="handleSearchClear"
          >
            <template #suffix-icon>
              <search-icon size="16px" />
            </template>
          </t-input>
        </div>
      </t-row>

      <!-- 数据表格 -->
      <t-table
        :data="data"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        data-testid="tenant-table"
        @page-change="handlePageChange"
      >
        <template #name="{ row }">
          <span class="tenant-name">{{ row.name }}</span>
        </template>
        <template #phone="{ row }">
          <span>{{ row.phone }}</span>
        </template>
        <template #idCard="{ row }">
          <span>{{ maskIdCard(row.idCard) }}</span>
        </template>
        <template #gender="{ row }">
          <t-tag :theme="row.gender === Gender.Male ? 'primary' : 'warning'" variant="light">
            {{ row.genderText }}
          </t-tag>
        </template>
        <template #currentRoom="{ row }">
          <span v-if="row.currentRoom" class="room-info">
            {{ row.currentRoom.fullInfo }}
          </span>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #status="{ row }">
          <t-tag v-if="row.status !== undefined" :theme="getStatusTheme(row.status)" variant="light">
            {{ row.statusText }}
          </t-tag>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #leasePeriod="{ row }">
          <span v-if="row.checkInDate && row.contractEndDate">
            {{ row.checkInDate.split('T')[0] }} ~ {{ row.contractEndDate.split('T')[0] }}
          </span>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #remark="{ row }">
          <t-tooltip v-if="row.remark" :content="row.remark" placement="top">
            <span class="remark-text">{{ row.remark }}</span>
          </t-tooltip>
          <span v-else class="text-secondary">-</span>
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link
              v-if="row.status === RentalStatus.Active && row.rentalRecordId"
              theme="warning"
              data-testid="checkout-button"
              @click="handleCheckOut(row)"
            >
              退租
            </t-link>
            <t-link theme="primary" data-testid="edit-button" @click="handleEdit(row)">编辑</t-link>
            <t-link theme="danger" data-testid="delete-button" @click="handleDelete(row)">删除</t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>
    <!-- 创建/编辑对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      :header="dialogType === 'create' ? '新建租客' : '编辑租客'"
      width="520px"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      data-testid="tenant-form-dialog"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="100px">
        <t-form-item label="租客姓名" name="name">
          <t-input
            v-model="formData.name"
            placeholder="请输入租客姓名"
            :maxlength="50"
            data-testid="tenant-name-input"
          />
        </t-form-item>
        <t-form-item label="联系电话" name="phone">
          <t-input
            v-model="formData.phone"
            placeholder="请输入联系电话"
            :maxlength="20"
            data-testid="tenant-phone-input"
          />
        </t-form-item>
        <t-form-item label="身份证号" name="idCard">
          <t-input
            v-model="formData.idCard"
            placeholder="请输入身份证号"
            :maxlength="18"
            data-testid="tenant-idcard-input"
          />
        </t-form-item>
        <t-form-item label="性别" name="gender">
          <t-radio-group v-model="formData.gender" data-testid="tenant-gender-input">
            <t-radio :value="Gender.Male">男</t-radio>
            <t-radio :value="Gender.Female">女</t-radio>
          </t-radio-group>
        </t-form-item>
        <t-form-item label="备注" name="remark">
          <t-textarea
            v-model="formData.remark"
            placeholder="请输入备注信息"
            :maxlength="500"
            :autosize="{ minRows: 3, maxRows: 5 }"
            data-testid="tenant-remark-input"
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
    <!-- 退租弹窗 -->
    <check-out-dialog
      v-model:visible="checkOutDialogVisible"
      :tenant="checkingOutTenant"
      @success="handleCheckOutSuccess"
    />
  </div>
</template>
<script setup lang="ts">
import { AddIcon, HomeIcon, SearchIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';

import type { TenantItem } from '@/api/model/tenantModel';
import { Gender, RentalStatus } from '@/api/model/tenantModel';
import { createTenant, deleteTenant, getTenantList, updateTenant } from '@/api/tenant';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';

import CheckOutDialog from './components/CheckOutDialog.vue';

defineOptions({
  name: 'TenantList',
});

// ==================== 类型定义 ====================

/** 表单数据类型 */
interface TenantFormData {
  id?: number;
  name: string;
  phone: string;
  idCard?: string;
  gender: Gender;
  emergencyContact?: string;
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
  { colKey: 'name', title: '租客姓名', width: 120 },
  { colKey: 'phone', title: '联系电话', width: 140 },
  { colKey: 'idCard', title: '身份证号', width: 180 },
  { colKey: 'gender', title: '性别', width: 80 },
  { colKey: 'currentRoom', title: '当前房间', width: 200, ellipsis: true },
  { colKey: 'status', title: '状态', width: 100 },
  { colKey: 'leasePeriod', title: '租期', width: 200 },
  { colKey: 'remark', title: '备注', width: 200, ellipsis: true },
  { colKey: 'op', title: '操作', width: 120, fixed: 'right' },
];

// 状态
const loading = ref(false);
const data = ref<TenantItem[]>([]);
const searchValue = ref('');
const pagination = ref({
  pageSize: 20,
  total: 0,
  current: 1,
});

// 对话框状态
const dialogVisible = ref(false);
const dialogType = ref<'create' | 'edit'>('create');
const submitLoading = ref(false);
const formRef = ref<FormInstanceFunctions>();
const editingTenantId = ref<number | null>(null);

// 表单数据
const formData = ref<TenantFormData>({
  name: '',
  phone: '',
  idCard: '',
  gender: Gender.Male,
  emergencyContact: '',
  remark: '',
});

// 手机号验证正则
const phoneRegex = /^1[3-9]\d{9}$/;
// 身份证号验证正则（15位纯数字 或 18位纯数字 或 17位数字+X/x）
const idCardRegex = /^(\d{15}|\d{17}[\dX])$/i;

const formRules: Record<string, FormRule[]> = {
  name: [{ required: true, message: '请输入租客姓名', trigger: 'blur' }],
  phone: [
    {
      validator: (val: string) => {
        if (!val) return true;
        return phoneRegex.test(val);
      },
      message: '手机号格式不正确',
      trigger: 'blur',
    },
  ],
  idCard: [{ pattern: idCardRegex, message: '身份证号格式不正确', trigger: 'blur' }],
};

// 删除确认
const deleteConfirmVisible = ref(false);
const deleteLoading = ref(false);
const deletingTenant = ref<TenantItem | null>(null);

const deleteConfirmBody = computed(() => {
  if (deletingTenant.value) {
    return `确定要删除租客「${deletingTenant.value.name}」吗？删除后无法恢复。`;
  }
  return '';
});

// 退租弹窗状态
const checkOutDialogVisible = ref(false);
const checkingOutTenant = ref<TenantItem | null>(null);

// 固定表头
const headerAffixedTop = computed<HeaderAffixedTopConfig>(() => ({
  offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
  container: `.${prefix}-layout`,
}));

// ==================== 搜索防抖（300ms）==================
let searchTimer: ReturnType<typeof setTimeout> | null = null;
watch(searchValue, (value) => {
  if (searchTimer) {
    clearTimeout(searchTimer);
  }
  searchTimer = setTimeout(() => {
    // 搜索时重置到第一页并重新获取数据
    pagination.value.current = 1;
    fetchData(value);
  }, 300);
});

// 清空搜索
function handleSearchClear() {
  pagination.value.current = 1;
  fetchData('');
}

// ==================== 数据获取 ====================

// 获取租客列表（后端分页）
async function fetchData(keyword?: string) {
  loading.value = true;
  try {
    const res = await getTenantList({
      keyword: keyword || searchValue.value || undefined,
      page: pagination.value.current,
      pageSize: pagination.value.pageSize,
    });
    data.value = res?.list || [];
    pagination.value.total = res?.total || 0;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取租客列表失败');
  } finally {
    loading.value = false;
  }
}

// 分页变化
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.current = pageInfo.current;
  pagination.value.pageSize = pageInfo.pageSize;
  fetchData();
}

// ==================== CRUD 操作 ====================

// 创建租客
function handleCreate() {
  dialogType.value = 'create';
  formData.value = {
    name: '',
    phone: '',
    idCard: '',
    gender: Gender.Male,
    remark: '',
  };
  dialogVisible.value = true;
}

// 跳转入住办理
function handleGoCheckIn() {
  router.push('/tenant/check-in');
}

// 编辑租客
function handleEdit(row: TenantItem) {
  dialogType.value = 'edit';
  editingTenantId.value = row.id;
  formData.value = {
    id: row.id,
    name: row.name,
    phone: row.phone,
    idCard: row.idCard || '',
    gender: row.gender,
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
      await createTenant({
        name: formData.value.name,
        phone: formData.value.phone || undefined,
        idCard: formData.value.idCard || undefined,
        gender: formData.value.gender,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('创建租客成功');
    } else {
      const tenantId = editingTenantId.value;
      if (tenantId === null) {
        MessagePlugin.error('编辑失败：租客ID不存在');
        return;
      }
      await updateTenant({
        id: tenantId,
        name: formData.value.name,
        phone: formData.value.phone || undefined,
        idCard: formData.value.idCard || undefined,
        gender: formData.value.gender,
        remark: formData.value.remark || undefined,
      });
      MessagePlugin.success('更新租客成功');
    }
    dialogVisible.value = false;
    await fetchData();
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

// 删除租客
function handleDelete(row: TenantItem) {
  deletingTenant.value = row;
  deleteConfirmVisible.value = true;
}

// 确认删除
async function onConfirmDelete() {
  if (!deletingTenant.value) return;

  deleteLoading.value = true;
  try {
    await deleteTenant(deletingTenant.value.id);
    MessagePlugin.success('删除成功');
    deleteConfirmVisible.value = false;
    await fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '删除失败');
  } finally {
    deleteLoading.value = false;
    deletingTenant.value = null;
  }
}

// ==================== 退租操作 ====================

// 打开退租弹窗
function handleCheckOut(row: TenantItem) {
  checkingOutTenant.value = row;
  checkOutDialogVisible.value = true;
}

// 退租成功回调
function handleCheckOutSuccess() {
  fetchData();
}

// ==================== 辅助函数 ====================

// 获取状态标签主题
function getStatusTheme(status: RentalStatus) {
  return status === RentalStatus.Active ? 'success' : 'default';
}

// 身份证号脱敏显示（保留前4位和后4位）
function maskIdCard(idCard?: string): string {
  if (!idCard || idCard.length < 8) return idCard || '-';
  const front = idCard.slice(0, 4);
  const back = idCard.slice(-4);
  const masked = '*'.repeat(idCard.length - 8);
  return `${front}${masked}${back}`;
}

// ==================== 生命周期 ====================

onMounted(() => {
  fetchData();
});

// 组件卸载时清理定时器，防止内存泄漏
onUnmounted(() => {
  if (searchTimer) {
    clearTimeout(searchTimer);
    searchTimer = null;
  }
});
</script>
<style lang="less" scoped>
.tenant-management {
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

  .tenant-name {
    font-weight: 500;
    color: var(--td-text-color-primary);
  }

  .room-info {
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
