/**
 * 文件路径: src/api/invitations.ts
 * 文件描述: [已更新] 封装所有与邀请(Invitation)相关的API请求。
 */
import { request } from '@/utils/request';
import type { InvitationResponse } from '@/types/api';

/**
 * 创建一个新的邀请
 * @param phone 被邀请人的手机号
 * @returns 返回邀请创建成功的信息
 */
export function createInvitation(phone : string) : Promise<InvitationResponse> {
	return request<InvitationResponse>({
		url: '/invitations',
		method: 'POST',
		data: { phone },
	});
}