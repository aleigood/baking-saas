/**
 * 文件路径: src/constants/modalKeys.ts
 * 文件描述: [新增] 定义并导出所有模态框的键名常量，消除魔术字符串。
 */

export const MODAL_KEYS = {
	STORE: 'store',
	USER_OPTIONS: 'userOptions',
	LOGOUT_CONFIRM: 'logoutConfirm',
	INVITE: 'invite',
	TASK_ACTIONS: 'taskActions',
	PROCUREMENT_ACTIONS: 'procurementActions',
	// [新增] 原料和配方操作相关的模态框
	INGREDIENT_ACTIONS: 'ingredientActions',
	DELETE_INGREDIENT_CONFIRM: 'deleteIngredientConfirm',
	RECIPE_ACTIONS: 'recipeActions',
	DISCONTINUE_RECIPE_CONFIRM: 'discontinueRecipeConfirm',
	RESTORE_RECIPE_CONFIRM: 'restoreRecipeConfirm',
	DELETE_RECIPE_CONFIRM: 'deleteRecipeConfirm',
} as const;

// 从常量对象中提取类型，用于类型安全检查
export type ModalKey = typeof MODAL_KEYS[keyof typeof MODAL_KEYS];