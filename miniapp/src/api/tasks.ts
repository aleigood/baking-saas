/**
 * 文件路径: src/api/tasks.ts
 * 文件描述: (已更新) 封装所有与生产任务相关的API请求。
 */
import { request } from '@/utils/request';
import type { ProductionTaskDto } from '@/types/api';

/**
 * [REFACTORED] 根据状态获取历史任务列表，并支持分页
 * @param page 页码
 * @param limit 每页数量
 */
export function getHistoricalTasks(page : number, limit : number) : Promise<any> {
	return request<any>({
		url: '/production-tasks',
		data: {
			// 后端现在支持接收状态数组
			status: ['COMPLETED', 'CANCELLED'],
			page: String(page),
			limit: String(limit)
		},
	});
}


/**
 * 获取当前店铺的生产任务列表
 */
export function getTasks() : Promise<ProductionTaskDto[]> {
	return request<ProductionTaskDto[]>({
		url: '/production-tasks', // 路由已更新
	});
}

/**
 * [新增] 获取单个生产任务的详情
 * (New: Get details of a single production task)
 * @param taskId 任务ID
 */
export function getTask(taskId : string) : Promise<ProductionTaskDto> {
	return request<ProductionTaskDto>({
		url: `/production-tasks/${taskId}`,
	});
}


/**
 * [修改] 创建一个新的生产任务，该任务可以包含多个产品
 * (Modified: Create a new production task which can contain multiple products)
 * @param data 包含 plannedDate 和 products 数组等信息
 */
export function createTask(data : {
	plannedDate : string;
	notes ?: string;
	products : { productId : string; quantity : number }[];
}) : Promise<any> {
	return request({
		url: '/production-tasks', // 路由已更新
		method: 'POST',
		data,
	});
}

/**
 * 更新一个生产任务的状态
 * @param taskId 任务ID
 * @param status 新的状态
 */
export function updateTaskStatus(
	taskId : string,
	status : 'COMPLETED' | 'CANCELLED' | 'IN_PROGRESS',
) : Promise<any> {
	return request({
		url: `/production-tasks/${taskId}`, // 路由已更新
		method: 'PATCH',
		data: { status },
	});
}

/**
 * [核心新增] 完成一个生产任务的专用接口
 * (New: Dedicated API to complete a production task)
 * @param taskId 任务ID
 * @param data 包含备注等信息
 */
export function completeTask(taskId : string, data : { notes ?: string }) : Promise<any> {
	return request({
		url: `/production-tasks/${taskId}/complete`,
		method: 'POST',
		data,
	});
}