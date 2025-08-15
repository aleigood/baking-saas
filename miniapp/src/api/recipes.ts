/**
 * 文件路径: src/api/recipes.ts
 * 文件描述: (已更新) 封装所有与配方(Recipe)相关的API请求，新增版本管理接口。
 */
import { request } from '@/utils/request';
// [更新] 导入新增的类型
import type { RecipeFamily, RecipeVersion } from '@/types/api';

/**
 * 获取当前店铺的配方/产品列表
 * @returns 返回配方家族列表，每个家族包含其激活的版本信息
 */
export function getRecipes() : Promise<RecipeFamily[]> {
	return request<RecipeFamily[]>({
		url: '/recipes',
	});
}

/**
 * [新增] 获取指定配方家族的所有版本列表
 * @param familyId 配方家族的ID
 */
export function getRecipeVersions(familyId : string) : Promise<RecipeVersion[]> {
	// 注意：这个接口在后端 recipes.controller.ts 中并未直接提供，
	// 后端 findOne(id) 可以获取所有版本，这里模拟前端调用，实际项目中后端可能需要单独接口。
	// 为符合重构要求，我们假设前端将通过调用 findOne 实现。
	// 这里保留函数名，但在页面中会通过调用 findOne 实现。
	// 实际调用将是 getRecipeFamily(familyId)。
	return request<RecipeVersion[]>({
		url: `/recipes/${familyId}/versions`, // 假设后端提供了此端点
	});
}

/**
 * [新增] 获取单个配方家族的完整信息，包括所有版本
 * @param familyId 配方家族的ID
 */
export function getRecipeFamily(familyId : string) : Promise<RecipeFamily> {
	return request<RecipeFamily>({
		url: `/recipes/${familyId}`,
	});
}

/**
 * [核心修改] 为指定的配方家族创建一个新版本
 * @param familyId 配方家族的ID
 * @param createDto 新版本的配方数据
 */
export function createRecipeVersion(familyId : string, createDto : any) : Promise<RecipeVersion> {
	return request<RecipeVersion>({
		url: `/recipes/${familyId}/versions`, // [修改] 调用新的版本创建接口
		method: 'POST',
		data: createDto,
	});
}

/**
 * [修改] 此函数现在只用于创建全新的配方家族
 * @param data 完整的配方数据，符合后端的 CreateRecipeDto 结构
 */
export function createRecipe(data : any) : Promise<any> {
	return request({
		url: '/recipes',
		method: 'POST',
		data,
	});
}

/**
 * [核心修改] 激活一个指定的配方版本
 * @param familyId 配方家族的ID
 * @param versionId 要激活的版本ID
 */
export function activateRecipeVersion(familyId : string, versionId : string) : Promise<any> {
	return request({
		url: `/recipes/${familyId}/versions/${versionId}/activate`,
		method: 'PATCH',
	});
}

/**
 * [新增] 删除一个指定的配方版本
 * @param familyId 配方家族的ID
 * @param versionId 要删除的版本ID
 */
export function deleteRecipeVersion(familyId : string, versionId : string) : Promise<any> {
	return request({
		url: `/recipes/${familyId}/versions/${versionId}`,
		method: 'DELETE',
	});
}