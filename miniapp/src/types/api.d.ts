/**
 * 文件路径: src/types/api.d.ts
 * 文件描述: (已更新) 使用 deletedAt 字段判断配方状态，并恢复 productionCount 字段。
 */

// --- 认证与用户 ---
export interface LoginRes {
	accessToken : string;
}

export interface UserInfo {
	id : string;
	phone : string;
	name : string | null;
	role : Role;
	status : string;
	createdAt : string;
	tenants : {
		tenant : Tenant;
		role : Role;
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
export interface RecipeFamily {
	id : string;
	name : string;
	type : 'MAIN' | 'PRE_DOUGH' | 'EXTRA';
	deletedAt : string | null; // [修复] 使用 deletedAt 判断状态
	versions : RecipeVersion[];
	productionCount ?: number; // [修复] 恢复误删除的字段
	productionTaskCount ?: number;
}

export interface RecipeVersion {
	id : string;
	familyId : string;
	version : number;
	notes : string | null;
	isActive : boolean;
	createdAt : string;
	products : Product[];
	doughs : {
		id : string;
		name : string;
		ingredients : DoughIngredient[];
		_count : {
			ingredients : number;
		};
	}[];
}

export interface DoughIngredient {
	id : string;
	name : string;
	ratio : number;
	isFlour : boolean;
}


export interface Product {
	id : string;
	recipeVersionId : string;
	name : string;
	baseDoughWeight : number;
}

export interface ProductListItem {
	id : string;
	name : string;
	type : string;
	familyId : string;
}

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
	isFlour : boolean;
	waterContent : number;
	activeSku : IngredientSKU | null;
	skus : IngredientSKU[];
	currentStockInGrams : number;
	currentPricePerPackage : number;
	avgConsumptionPerTask : number;
	daysOfSupply : number;
	avgDailyConsumption : number;
	totalConsumptionInGrams : number;
}

export interface IngredientSKU {
	id : string;
	brand : string | null;
	specName : string;
	specWeightInGrams : number;
	status : 'ACTIVE' | 'INACTIVE';
	procurementRecords ?: ProcurementRecord[];
	createdAt : string;
}

export interface ProcurementRecord {
	id : string;
	packagesPurchased : number;
	pricePerPackage : number;
	purchaseDate : string;
}


// --- 生产任务 ---
export interface ProductionTaskDto {
	id : string;
	status : 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
	plannedDate : string;
	// [新增] 任务的实际完成时间
	completedAt : string | null;
	notes : string | null;
	items : {
		id : string;
		quantity : number;
		product : {
			id : string;
			name : string;
			baseDoughWeight : number;
			recipeVersion : {
				family : {
					id : string;
					name : string;
				};
				doughs : {
					id : string;
					name : string;
					ingredients : DoughIngredient[];
				}[];
			};
		};
	}[];
	// [新增] 库存警告信息
	stockWarning ?: string;
}

// [新增] 创建生产任务的响应类型
export interface CreateTaskResponse {
	task : ProductionTaskDto;
	warning ?: string;
}


// --- 团队成员 ---
export interface Member {
	id : string;
	name : string;
	phone : string;
	role : Role;
	status : 'ACTIVE' | 'INACTIVE' | 'PENDING';
	joinDate : string;
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

export interface ProductionStatsResponse {
	totalTasks : number;
	productStats : RecipeStatDto[];
	ingredientConsumption : IngredientStatDto[];
}