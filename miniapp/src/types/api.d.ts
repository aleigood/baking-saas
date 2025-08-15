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
	productionCount ?: number; // [ADDED] 新增字段，用于存储总制作次数
	productionTaskCount ?: number; // [核心修正] 恢复字段，用于存储制作任务次数
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
		id : string;
		name : string;
		ingredients : DoughIngredient[];
		_count : {
			ingredients : number;
		};
	}[];
}

// [新增] 面团中的原料类型
export interface DoughIngredient {
	id : string;
	name : string;
	ratio : number;
	isFlour : boolean;
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
}

// [新增] 服务端计算后的配方详情 DTO
export interface CalculatedIngredientInfo {
	name : string;
	ratio : number;
	weightInGrams : number;
	pricePerKg : string;
	cost : number;
}
export interface CalculatedDoughGroup {
	name : string;
	ingredients : CalculatedIngredientInfo[];
	procedure ?: string[];
	totalCost : number;
}
export interface CalculatedExtraIngredientInfo {
	id : string;
	name : string;
	type : string;
	cost : number;
	weightInGrams : number;
	ratio ?: number;
}
export interface RecipeDetails {
	totalCost : number;
	doughGroups : CalculatedDoughGroup[];
	extraIngredients : CalculatedExtraIngredientInfo[];
	groupedExtraIngredients : Record<string, CalculatedExtraIngredientInfo[]>;
}


// --- 原料与库存 ---
export interface Ingredient {
	id : string;
	name : string;
	type : 'STANDARD' | 'UNTRACKED';
	// [核心新增] 新增配方属性字段
	isFlour : boolean;
	waterContent : number;
	activeSku : IngredientSKU | null; // 当前激活的SKU
	skus : IngredientSKU[];
	currentStockInGrams : number;
	currentPricePerPackage : number;
	avgConsumptionPerTask : number;
	// [ADDED] 新增字段，用于存储可供应天数和日均消耗
	daysOfSupply : number;
	avgDailyConsumption : number;
	totalConsumptionInGrams : number; // [ADDED] 新增总消耗量字段
}

export interface IngredientSKU {
	id : string;
	brand : string | null;
	specName : string;
	specWeightInGrams : number;
	status : 'ACTIVE' | 'INACTIVE';
	procurementRecords ?: ProcurementRecord[]; // [新增] 用于详情页展示
	createdAt : string; // [新增]
}

// [新增] 采购记录类型
export interface ProcurementRecord {
	id : string;
	packagesPurchased : number;
	pricePerPackage : number;
	purchaseDate : string;
}


// --- 生产任务 ---
// [核心修改] 更新 ProductionTaskDto 以匹配新的、更完整的后端数据结构
export interface ProductionTaskDto {
	id : string;
	status : 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
	plannedDate : string; // ISO Date String
	notes : string | null;
	items : {
		id : string;
		quantity : number;
		product : {
			id : string;
			name : string;
			baseDoughWeight : number; // [新增] 基础面团重量
			recipeVersion : {
				family : {
					id : string; // [核心修正] 恢复 familyId
					name : string;
				};
				// [新增] 完整的面团和原料信息
				doughs : {
					id : string;
					name : string;
					ingredients : DoughIngredient[];
				}[];
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

// [核心新增] 生产统计接口的完整返回类型
export interface ProductionStatsResponse {
	totalTasks : number;
	productStats : RecipeStatDto[];
	ingredientConsumption : IngredientStatDto[];
}