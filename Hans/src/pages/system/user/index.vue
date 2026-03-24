<template>
  <div class="user-management">
    <t-card class="list-card-container" :bordered="false">
      <t-row justify="space-between">
        <div class="left-operation-container">
          <t-button theme="primary" @click="handleCreate">
            <template #icon><add-icon /></template>
            新建用户
          </t-button>
        </div>
        <div class="search-input">
          <t-input
            v-model="searchValue"
            placeholder="搜索用户名/显示名称"
            clearable
            @enter="handleSearch"
            @clear="handleSearch"
          >
            <template #suffix-icon>
              <search-icon size="16px" @click="handleSearch" />
            </template>
          </t-input>
        </div>
      </t-row>

      <t-table
        :data="filteredData"
        :columns="columns"
        row-key="id"
        vertical-align="top"
        :hover="true"
        :pagination="pagination"
        :loading="loading"
        :header-affixed-top="headerAffixedTop"
        @page-change="handlePageChange"
      >
        <template #isEnabled="{ row }">
          <t-tag :theme="row.isEnabled ? 'success' : 'default'" variant="light">
            {{ row.isEnabled ? '启用' : '禁用' }}
          </t-tag>
        </template>
        <template #lastLoginTime="{ row }">
          {{ row.lastLoginTime ? formatDate(row.lastLoginTime) : '-' }}
        </template>
        <template #createdTime="{ row }">
          {{ formatDate(row.createdTime) }}
        </template>
        <template #op="{ row }">
          <t-space>
            <t-link theme="primary" @click="handleEdit(row)">编辑</t-link>
            <t-link theme="warning" @click="handleResetPassword(row)">重置密码</t-link>
            <t-link :theme="row.isEnabled ? 'danger' : 'success'" @click="handleToggle(row)">
              {{ row.isEnabled ? '禁用' : '启用' }}
            </t-link>
          </t-space>
        </template>
      </t-table>
    </t-card>

    <!-- 创建/编辑用户对话框 -->
    <t-dialog
      v-model:visible="dialogVisible"
      :header="dialogType === 'create' ? '新建用户' : '编辑用户'"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      :on-confirm="handleSubmit"
      :on-close="handleDialogClose"
    >
      <t-form ref="formRef" :data="formData" :rules="formRules" label-align="right" label-width="80px">
        <t-form-item label="用户名" name="username">
          <t-input v-model="formData.username" :disabled="dialogType === 'edit'" placeholder="请输入用户名" />
        </t-form-item>
        <t-form-item v-if="dialogType === 'create'" label="密码" name="password">
          <t-input v-model="formData.password" type="password" placeholder="请输入密码（至少6位）" />
        </t-form-item>
        <t-form-item label="显示名称" name="displayName">
          <t-input v-model="formData.displayName" placeholder="请输入显示名称" />
        </t-form-item>
      </t-form>
    </t-dialog>

    <!-- 重置密码对话框 -->
    <t-dialog
      v-model:visible="resetPasswordVisible"
      header="重置密码"
      :confirm-btn="{ content: '确定', loading: submitLoading }"
      :on-confirm="handleResetPasswordSubmit"
      :on-close="() => (resetPasswordVisible = false)"
    >
      <t-form
        ref="resetFormRef"
        :data="resetPasswordData"
        :rules="resetPasswordRules"
        label-align="right"
        label-width="80px"
      >
        <t-form-item label="新密码" name="newPassword">
          <t-input v-model="resetPasswordData.newPassword" type="password" placeholder="请输入新密码（至少6位）" />
        </t-form-item>
      </t-form>
    </t-dialog>
  </div>
</template>
<script setup lang="ts">
import { AddIcon, SearchIcon } from 'tdesign-icons-vue-next';
import type { FormInstanceFunctions, FormRule, PageInfo, PrimaryTableCol } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { computed, onMounted, ref } from 'vue';

import type { CreateUserParams, ResetPasswordParams, UpdateUserParams, UserItem } from '@/api/model/userModel';
import { createUser, getUserList, resetPassword as resetPasswordApi, toggleUser, updateUser } from '@/api/user';
import { prefix } from '@/config/global';
import { useSettingStore } from '@/store';

defineOptions({
  name: 'SystemUser',
});

const settingStore = useSettingStore();

// 表格列配置
const columns: PrimaryTableCol[] = [
  { colKey: 'id', title: 'ID', width: 80 },
  { colKey: 'username', title: '用户名', width: 150 },
  { colKey: 'displayName', title: '显示名称', width: 150 },
  { colKey: 'isEnabled', title: '状态', width: 100 },
  { colKey: 'lastLoginTime', title: '最后登录', width: 180 },
  { colKey: 'createdTime', title: '创建时间', width: 180 },
  { colKey: 'op', title: '操作', width: 200, fixed: 'right' },
];

// 状态
const loading = ref(false);
const data = ref<UserItem[]>([]);
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
const editingUserId = ref<number | null>(null);

// 表单数据
const formData = ref<CreateUserParams & UpdateUserParams>({
  username: '',
  password: '',
  displayName: '',
});

const formRules: Record<string, FormRule[]> = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入显示名称', trigger: 'blur' }],
};

// 重置密码
const resetPasswordVisible = ref(false);
const resetFormRef = ref<FormInstanceFunctions>();
const resetPasswordUserId = ref<number | null>(null);
const resetPasswordData = ref<ResetPasswordParams>({ newPassword: '' });

const resetPasswordRules: Record<string, FormRule[]> = {
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' },
  ],
};

// 过滤数据
const filteredData = computed(() => {
  if (!searchValue.value) return data.value;
  const keyword = searchValue.value.toLowerCase();
  return data.value.filter(
    (item) => item.username.toLowerCase().includes(keyword) || item.displayName.toLowerCase().includes(keyword),
  );
});

// 固定表头
const headerAffixedTop = computed(
  () =>
    ({
      offsetTop: settingStore.isUseTabsRouter ? 48 : 0,
      container: `.${prefix}-layout`,
    }) as any,
);

// 格式化日期
function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 获取用户列表
async function fetchData() {
  loading.value = true;
  try {
    const res = await getUserList();
    data.value = res || [];
    pagination.value.total = data.value.length;
  } catch (e: any) {
    MessagePlugin.error(e.message || '获取用户列表失败');
  } finally {
    loading.value = false;
  }
}

// 搜索
function handleSearch() {
  pagination.value.defaultCurrent = 1;
}

// 分页
function handlePageChange(pageInfo: PageInfo) {
  pagination.value.defaultCurrent = pageInfo.current;
  pagination.value.defaultPageSize = pageInfo.pageSize;
}

// 创建用户
function handleCreate() {
  dialogType.value = 'create';
  formData.value = { username: '', password: '', displayName: '' };
  dialogVisible.value = true;
}

// 编辑用户
function handleEdit(row: UserItem) {
  dialogType.value = 'edit';
  editingUserId.value = row.id;
  formData.value = {
    username: row.username,
    password: '',
    displayName: row.displayName,
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
      await createUser(formData.value as CreateUserParams);
      MessagePlugin.success('创建用户成功');
    } else {
      await updateUser(editingUserId.value!, { displayName: formData.value.displayName });
      MessagePlugin.success('更新用户成功');
    }
    dialogVisible.value = false;
    fetchData();
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

// 重置密码
function handleResetPassword(row: UserItem) {
  resetPasswordUserId.value = row.id;
  resetPasswordData.value = { newPassword: '' };
  resetPasswordVisible.value = true;
}

// 提交重置密码
async function handleResetPasswordSubmit() {
  const valid = await resetFormRef.value?.validate();
  if (valid !== true) return;

  submitLoading.value = true;
  try {
    await resetPasswordApi(resetPasswordUserId.value!, resetPasswordData.value);
    MessagePlugin.success('重置密码成功');
    resetPasswordVisible.value = false;
  } catch (e: any) {
    MessagePlugin.error(e.message || '重置密码失败');
  } finally {
    submitLoading.value = false;
  }
}

// 启用/禁用用户
async function handleToggle(row: UserItem) {
  try {
    await toggleUser(row.id);
    MessagePlugin.success(row.isEnabled ? '已禁用用户' : '已启用用户');
    fetchData();
  } catch (e: any) {
    MessagePlugin.error(e.message || '操作失败');
  }
}

onMounted(() => {
  fetchData();
});
</script>
<style lang="less" scoped>
.user-management {
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
}
</style>
