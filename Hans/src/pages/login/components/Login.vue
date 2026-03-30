<template>
  <t-form ref="form" class="item-container" :data="formData" :rules="FORM_RULES" label-width="0" @submit="onSubmit">
    <t-form-item name="account">
      <t-input v-model="formData.account" size="large" placeholder="请输入账号">
        <template #prefix-icon>
          <t-icon name="user" />
        </template>
      </t-input>
    </t-form-item>

    <t-form-item name="password">
      <t-input
        v-model="formData.password"
        size="large"
        :type="showPsw ? 'text' : 'password'"
        clearable
        placeholder="请输入密码"
      >
        <template #prefix-icon>
          <t-icon name="lock-on" />
        </template>
        <template #suffix-icon>
          <t-icon :name="showPsw ? 'browse' : 'browse-off'" @click="showPsw = !showPsw" />
        </template>
      </t-input>
    </t-form-item>

    <div class="check-container remember-pwd">
      <t-checkbox v-model="formData.remember">{{ t('pages.login.remember') }}</t-checkbox>
    </div>

    <t-form-item class="btn-container">
      <t-button block size="large" type="submit" :loading="loginLoading"> {{ t('pages.login.signIn') }} </t-button>
    </t-form-item>
  </t-form>
</template>
<script setup lang="ts">
import type { FormInstanceFunctions, FormRule, SubmitContext } from 'tdesign-vue-next';
import { MessagePlugin } from 'tdesign-vue-next';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { t } from '@/locales';
import { useUserStore } from '@/store';

const userStore = useUserStore();

const INITIAL_DATA = {
  account: '',
  password: '',
  remember: false,
};

const FORM_RULES: Record<string, FormRule[]> = {
  account: [{ required: true, message: t('pages.login.required.account'), type: 'error' }],
  password: [{ required: true, message: t('pages.login.required.password'), type: 'error' }],
};

const REMEMBER_KEY = 'login_remember';

const form = ref<FormInstanceFunctions>();
const formData = ref({ ...INITIAL_DATA });
const showPsw = ref(false);
const loginLoading = ref(false);

const router = useRouter();
const route = useRoute();

// 恢复记住的账号和密码
const saved = localStorage.getItem(REMEMBER_KEY);
if (saved) {
  try {
    const { account, password } = JSON.parse(saved);
    formData.value.account = account;
    formData.value.password = password;
    formData.value.remember = true;
  } catch {
    localStorage.removeItem(REMEMBER_KEY);
  }
}

const onSubmit = async (ctx: SubmitContext) => {
  if (ctx.validateResult === true) {
    loginLoading.value = true;
    try {
      await userStore.login(formData.value);

      // 记住/清除账号和密码
      if (formData.value.remember) {
        localStorage.setItem(REMEMBER_KEY, JSON.stringify({
          account: formData.value.account,
          password: formData.value.password,
        }));
      } else {
        localStorage.removeItem(REMEMBER_KEY);
      }

      MessagePlugin.success('登录成功');
      const redirect = route.query.redirect as string;
      const redirectUrl = redirect ? decodeURIComponent(redirect) : '/dashboard';
      router.push(redirectUrl);
    } catch (e: any) {
      MessagePlugin.error(e.message || '登录失败');
    } finally {
      loginLoading.value = false;
    }
  }
};
</script>
<style lang="less" scoped>
@import '../index.less';
</style>
