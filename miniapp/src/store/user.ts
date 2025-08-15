import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { UserInfo, LoginRes } from '@/types/api';
import { useDataStore } from './data';
import { request } from '@/utils/request';
import { login as loginApi, getProfile } from '@/api/auth'; // 引入新的API

export const useUserStore = defineStore('user', () => {
	const token = ref<string | null>(uni.getStorageSync('token') || null);
	const userInfo = ref<UserInfo | null>(null);

	function setToken(newToken : string) {
		token.value = newToken;
		uni.setStorageSync('token', newToken);
	}

	// [重构] 登录逻辑更新，使用 phone
	async function login(credentials : { phone : string; password : string }) {
		try {
			const res = await loginApi(credentials);
			setToken(res.accessToken);
			return true;
		} catch (error) {
			console.error('Login failed:', error);
			// 错误提示已在 request 工具函数中统一处理
			return false;
		}
	}

	// [重构] fetchUserInfo 使用新的 getProfile 接口
	async function fetchUserInfo() {
		if (!token.value) return;
		try {
			const data = await getProfile();
			userInfo.value = data;
		} catch (error) {
			console.error('Fetch user info failed:', error);
			logout(); // Token 可能无效，强制登出
		}
	}

	function logout() {
		const dataStore = useDataStore();
		token.value = null;
		userInfo.value = null;
		uni.removeStorageSync('token');
		uni.removeStorageSync('tenant_id');
		dataStore.reset();
		uni.reLaunch({ url: '/pages/login/login' });
	}

	return { token, userInfo, login, setToken, logout, fetchUserInfo };
});