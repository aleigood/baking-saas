/**
 * 文件路径: src/api/members.ts
 * 文件描述: (已更新) 封装所有与人员(Member)相关的API请求，包括更新和删除。
 */
import { request } from '@/utils/request';
import type { Member, Role } from '@/types/api';

/**
 * 获取当前店铺的人员列表
 */
export function getMembers() : Promise<Member[]> {
	return request<Member[]>({
		url: '/members',
	});
}

/**
 * [重构] 更新指定成员的角色或状态
 * @param memberId 成员的用户ID
 * @param data 包含新角色或新状态的对象
 */
export function updateMember(
	memberId : string,
	data : { role ?: Role; status ?: Member['status'] },
) : Promise<any> {
	return request({
		url: `/members/${memberId}`,
		method: 'PATCH',
		data,
	});
}

/**
 * [已更新] 从当前店铺中移除一个成员
 * @param memberId 成员的用户ID
 */
export function removeMember(memberId : string) : Promise<any> {
	return request({
		url: `/members/${memberId}`,
		method: 'DELETE',
	});
}