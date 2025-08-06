/**
 * 文件路径: src/types/api.d.ts
 * 文件描述: (已更新) 增加了配方版本、SKU、租户等与新后端匹配的数据类型。
 */

// --- 认证与用户 ---
export interface LoginRes {
	accessToken : string; // 字段名从 access_token 改为 accessToken
}

export interface UserInfo {
	id : string;
	phone : string;
	name : string | null; // [新增] 用户姓名
	role : Role; // 全局角色
	status : string;
	createdAt : string;
	tenants : {
		tenant : Tenant;
		role : Role; // 在租户中的角色
	}[];
}

// --- 租户/店铺 ---
export interface Tenant {
	id : string;
	name : string;
}

// --- 邀请 ---
export interface InvitationResponse {
	message : string;
	invitationId : string;
}

// --- 配方、产品与版本 ---
// 配方家族，代表一个配方，如“法棍”
export interface RecipeFamily {
	id : string;
	name : string;
	type : 'MAIN' | 'PRE_DOUGH' | 'EXTRA';
	versions : RecipeVersion[]; // 包含了该家族下的版本信息
}

// 配方的具体版本
export interface RecipeVersion {
	id : string;
	familyId : string;
	version : number;
	notes : string | null;
	isActive : boolean;
	createdAt : string;
	products : Product[]; // 一个版本可以产出多种最终产品
	// [新增] 包含面团信息，用于获取原料数量
	doughs : {
		_count : {
			ingredients : number;
		};
	}[];
}

// 最终产品，如“原味法棍”
export interface Product {
	id : string;
	recipeVersionId : string;
	name : string;
	baseDoughWeight : number; // 基础面团重量
}

// 用于产品列表展示的简化项
export interface ProductListItem {
	id : string; // 这是 Product 的 ID
	name : string; // 这是 Product 的 name
	type : string; // 这是 RecipeFamily 的 name
	familyId : string; // 这是 RecipeFamily 的 ID
	// weight 等信息将在详情页获取
}

// --- 原料与库存 ---
export interface Ingredient {
	id : string;
	name : string;
	type : 'STANDARD' | 'UNTRACKED';
	activeSku : IngredientSKU | null; // 当前激活的SKU
	skus : IngredientSKU[];
}

export interface IngredientSKU {
	id : string;
	brand : string | null;
	specName : string;
	specWeightInGrams : number;
	status : 'ACTIVE' | 'INACTIVE';
	currentStockInGrams : number;
	currentPricePerPackage : number;
}

// --- 生产任务 ---
// [修改] 更新 ProductionTaskDto 以匹配新的多产品任务结构
// (Modified: Update ProductionTaskDto to match the new multi-product task structure)
export interface ProductionTaskDto {
	id : string;
	status : 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
	plannedDate : string; // ISO Date String
	notes : string | null;
	// [修改] 从单个 product 变为 items 数组
	// (Changed from a single product to an items array)
	items : {
		id : string;
		quantity : number;
		product : {
			id : string;
			name : string;
			recipeVersion : {
				family : {
					name : string;
				};
			};
		};
	}[];
}


// --- 团队成员 ---
export interface Member {
	id : string;
	name : string; // [修改] 使用 name
	phone : string; // 保留 phone 用于详情页显示
	role : Role;
	status : 'ACTIVE' | 'INACTIVE' | 'PENDING';
	joinDate : string; // YYYY-MM-DD
}

// --- 角色枚举 (与后端保持一致) ---
export type Role = 'OWNER' | 'ADMIN' | 'MEMBER' | 'SUPER_ADMIN';

// --- 统计数据 ---
export interface RecipeStatDto {
	name : string;
	count : number;
}

export interface IngredientStatDto {
	name : string;
	consumedGrams : number;
}