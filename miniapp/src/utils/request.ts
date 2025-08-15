/**
 * 文件路径: /src/utils/request.ts
 * 文件描述: [修改] 增强了错误处理，特别是针对401状态码进行自动登出。
 */
import { useUserStore } from '@/store/user';
import { useToastStore } from '@/store/toast';

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

// [新增] 增加一个标志位，防止因多个并发请求失败而重复触发登出
let isLoggingOut = false;

interface RequestOptions {
	url : string;
	method ?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	data ?: any;
	header ?: any;
}

export const request = <T = any>(options : RequestOptions) : Promise<T> => {
	return new Promise((resolve, reject) => {
		const userStore = useUserStore();
		const toastStore = useToastStore();

		let url = BASE_URL + options.url;
		let data = options.data || {};
		const method = options.method || 'GET';

		if (method === 'GET' && Object.keys(data).length > 0) {
			const params = Object.keys(data)
				.map(key => {
					const value = data[key];
					if (Array.isArray(value)) {
						return value.map(item => `${key}=${encodeURIComponent(item)}`).join('&');
					} else if (value !== undefined && value !== null) {
						return `${key}=${encodeURIComponent(value)}`;
					}
					return '';
				})
				.filter(Boolean)
				.join('&');

			if (params) {
				url += (url.includes('?') ? '&' : '?') + params;
				data = {};
			}
		}

		uni.request({
			url: url,
			method: method,
			data: data,
			header: {
				...options.header,
				Authorization: userStore.token ? `Bearer ${userStore.token}` : '',
			},
			success: (res : UniApp.RequestSuccessCallbackResult) => {
				// [核心修改] 增强错误处理逻辑
				if (res.statusCode === 401) {
					if (!isLoggingOut) {
						isLoggingOut = true;
						toastStore.show({
							message: '登录已过期，请重新登录',
							type: 'error',
						});
						// 延迟执行登出，让用户能看到提示
						setTimeout(() => {
							userStore.logout();
							isLoggingOut = false; // 重置标志位
						}, 1500);
					}
					return reject(res);
				}

				if (res.statusCode >= 200 && res.statusCode < 300) {
					resolve(res.data as T);
				} else {
					const errorMessage = (res.data as any)?.message || '请求失败，请稍后重试';
					toastStore.show({
						message: Array.isArray(errorMessage) ? errorMessage.join(',') : errorMessage,
						type: 'error'
					});
					reject(res);
				}
			},
			fail: (err) => {
				toastStore.show({ message: '网络错误，请检查您的连接', type: 'error' });
				reject(err);
			},
		});
	});
};