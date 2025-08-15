/**
 * 文件路径: src/api/auth.ts
 * 文件描述: [新增] 封装所有与认证(Auth)相关的API请求。
 */
import { request } from '@/utils/request';
import type { LoginRes, UserInfo, Tenant } from '@/types/api';

/**
 * 使用手机号和密码登录
 * @param credentials 包含手机号和密码的对象
 */
export function login(credentials : { phone : string; password : string }) : Promise<LoginRes> {
	return request<LoginRes>({
		url: '/auth/login',
		method: 'POST',
		data: credentials,
	});
}

/**
 * 获取当前登录用户的个人资料
 */
export function getProfile() : Promise<UserInfo> {
	return request<UserInfo>({
		url: '/auth/profile',
	});
}

/**
 * 切换当前操作的店铺（租户）
 * @param tenantId 要切换到的店铺ID
 */
export function switchTenant(tenantId : string) : Promise<LoginRes> {
	return request<LoginRes>({
		url: `/auth/switch-tenant/${tenantId}`,
		method: 'POST',
	});
}