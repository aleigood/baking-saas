/**
 * 文件路径: src/api/tenants.ts
 * 文件描述: 封装所有与店铺(Tenant)相关的API请求。
 */
import { request } from '@/utils/request';
import type { Tenant } from '@/types/api';

/**
 * 获取当前用户有权访问的所有店铺列表
 */
export function getTenants() : Promise<Tenant[]> {
	return request<Tenant[]>({
		url: '/tenants',
	});
}