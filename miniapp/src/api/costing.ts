/**
 * 文件路径: src/api/costing.ts
 * 文件描述: [新增] 封装所有与成本计算(Costing)相关的API请求。
 */
import { request } from '@/utils/request';
// [新增] 导入新的配方详情类型
import type { RecipeDetails } from '@/types/api';


/**
 * [新增] 获取计算后的产品配方详情，用于客户端展示
 * @param productId 产品的ID
 * @returns 返回结构化的配方详情，包含用量和成本
 */
export function getRecipeDetails(productId : string) : Promise<RecipeDetails> {
	return request<RecipeDetails>({
		url: `/costing/products/${productId}/details`,
	});
}


/**
 * [新增] 获取单个产品成本的历史变化记录
 * @param productId 产品的ID
 * @returns 返回一个包含成本变化点的数组，每个点是一个 { cost: number } 对象
 */
export function getProductCostHistory(productId : string) : Promise<{ cost : number }[]> {
	return request<{ cost : number }[]>({
		url: `/costing/products/${productId}/cost-history`,
	});
}

/**
 * [新增] 获取产品中各原料的成本构成
 * @param productId 产品的ID
 * @returns 返回一个包含 { name: string, value: number } 的数组，用于饼图
 */
export function getProductCostBreakdown(productId : string) : Promise<{ name : string, value : number }[]> {
	return request<{ name : string, value : number }[]>({
		url: `/costing/products/${productId}/cost-breakdown`,
	});
}


/**
 * [新增] 获取单个原料成本的历史变化记录
 * @param ingredientId 原料的ID
 * @returns 返回一个包含成本变化点的数组，每个点是一个 { cost: number } 对象
 */
export function getIngredientCostHistory(ingredientId : string) : Promise<{ cost : number }[]> {
	return request<{ cost : number }[]>({
		url: `/costing/ingredients/${ingredientId}/cost-history`,
	});
}

/**
 * [新增] 获取单个原料用量的历史变化记录
 * @param ingredientId 原料的ID
 * @returns 返回一个包含用量变化点的数组
 */
export function getIngredientUsageHistory(ingredientId : string) : Promise<{ cost : number }[]> {
	return request<{ cost : number }[]>({
		url: `/costing/ingredients/${ingredientId}/usage-history`,
	});
}