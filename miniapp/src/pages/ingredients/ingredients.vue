<template>
	<view>
		<view class="page-content page-content-with-tabbar-fab no-horizontal-padding">
			<view class="content-padding">
				<FilterTabs>
					<FilterTab :active="ingredientFilter === 'all'" @click="ingredientFilter = 'all'">全部</FilterTab>
					<FilterTab :active="ingredientFilter === 'low'" @click="ingredientFilter = 'low'">库存紧张</FilterTab>
				</FilterTabs>
			</view>

			<view class="list-wrapper" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
				<template v-if="ingredientFilter === 'all'">
					<template v-if="allIngredients.length > 0">
						<ListItem v-for="(ing, index) in allIngredients" :key="ing.id" @click="navigateToDetail(ing.id)"
							@longpress="openIngredientActions(ing)" :vibrate-on-long-press="canEdit" :bleed="true"
							:divider="index < allIngredients.length - 1">
							<view class="main-info">
								<view class="name">{{ ing.name }}</view>
								<view class="desc">品牌: {{ ing.activeSku?.brand || '未设置' }}</view>
							</view>
							<view class="side-info">
								<view class="value">
									{{ (ing.currentStockInGrams / 1000).toFixed(2) }} kg
								</view>
								<view v-if="ing.totalConsumptionInGrams > 0" class="desc consumption">
									已消耗: {{ (ing.totalConsumptionInGrams / 1000).toFixed(2) }} kg
								</view>
							</view>
						</ListItem>
					</template>
					<view v-else class="empty-state">
						<text>暂无原料信息</text>
					</view>
				</template>

				<template v-if="ingredientFilter === 'low'">
					<template v-if="lowStockIngredients.length > 0">
						<ListItem v-for="(ing, index) in lowStockIngredients" :key="ing.id"
							@click="navigateToDetail(ing.id)" @longpress="openIngredientActions(ing)"
							:vibrate-on-long-press="canEdit" :bleed="true"
							:divider="index < lowStockIngredients.length - 1">
							<view class="main-info">
								<view class="name">{{ ing.name }}</view>
								<view class="desc">品牌: {{ ing.activeSku?.brand || '未设置' }}</view>
							</view>
							<view class="side-info">
								<view class="value-tag" :class="getStockStatusClass(ing.daysOfSupply)">
									{{ getDaysOfSupplyText(ing.daysOfSupply) }}
								</view>
								<view class="desc">库存: {{ (ing.currentStockInGrams / 1000).toFixed(2) }} kg</view>
							</view>
						</ListItem>
					</template>
					<view v-else class="empty-state">
						<text>暂无库存紧张的原料</text>
					</view>
				</template>
			</view>
		</view>
		<AppFab @click="navigateToEditPage" />

		<AppModal :visible="uiStore.showIngredientActionsModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.INGREDIENT_ACTIONS)" title="原料操作" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleDeleteIngredient" :bleed="true">
					<view class="main-info">
						<view class="name">删除原料</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showDeleteIngredientConfirmModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.DELETE_INGREDIENT_CONFIRM)" title="确认删除">
			<view class="modal-prompt-text">
				确定要删除 “{{ selectedIngredient?.name }}” 吗？
			</view>
			<view class="modal-warning-text">
				已被配方使用的原料将无法被删除。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.DELETE_INGREDIENT_CONFIRM)">取消
				</AppButton>
				<AppButton type="danger" @click="confirmDeleteIngredient" :loading="isSubmitting">
					{{ isSubmitting ? '' : '确认删除' }}
				</AppButton>
			</view>
		</AppModal>

	</view>
</template>
<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import { useToastStore } from '@/store/toast';
	import { deleteIngredient } from '@/api/ingredients';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import type { Ingredient } from '@/types/api';
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue';
	import FilterTabs from '@/components/FilterTabs.vue';
	import FilterTab from '@/components/FilterTab.vue';
	import AppModal from '@/components/AppModal.vue';
	import AppButton from '@/components/AppButton.vue';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore();
	const toastStore = useToastStore();
	const ingredientFilter = ref('all');
	const isSubmitting = ref(false);
	const selectedIngredient = ref<Ingredient | null>(null);

	const touchStartX = ref(0);
	const touchStartY = ref(0);

	onShow(async () => {
		if (!dataStore.dataLoaded.ingredients) {
			await dataStore.fetchIngredientsData();
		}
	});

	const handleTouchStart = (e : TouchEvent) => {
		touchStartX.value = e.touches[0].clientX;
		touchStartY.value = e.touches[0].clientY;
	};

	const handleTouchEnd = (e : TouchEvent) => {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const deltaX = touchEndX - touchStartX.value;
		const deltaY = touchEndY - touchStartY.value;

		if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
			if (deltaX < 0) {
				ingredientFilter.value = 'low';
			} else {
				ingredientFilter.value = 'all';
			}
		}
	};

	const allIngredients = computed(() => {
		if (!dataStore.ingredients) return [];
		return [...dataStore.ingredients].sort((a, b) => b.totalConsumptionInGrams - a.totalConsumptionInGrams);
	});

	const lowStockIngredients = computed(() => {
		if (!dataStore.ingredients) return [];
		return [...dataStore.ingredients]
			.filter((ing) => ing.daysOfSupply < 7)
			.sort((a, b) => a.daysOfSupply - b.daysOfSupply);
	});

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canEdit = computed(() => {
		return currentUserRoleInTenant.value === 'OWNER' || currentUserRoleInTenant.value === 'ADMIN';
	});

	const getDaysOfSupplyText = (days : number) => {
		if (!isFinite(days) || days > 365) {
			return '充足';
		}
		if (days < 1 && days > 0) {
			return '不足1天';
		}
		if (days <= 0) {
			return '已用尽';
		}
		return `约剩 ${Math.floor(days)} 天`;
	};

	const getStockStatusClass = (days : number) => {
		if (days <= 0) {
			return 'stock-danger';
		}
		if (days < 7) {
			return 'stock-warning';
		}
		return '';
	};

	const navigateToEditPage = () => {
		uni.navigateTo({
			url: '/pages/ingredients/edit',
		});
	};

	const navigateToDetail = (ingredientId : string) => {
		uni.navigateTo({
			url: `/pages/ingredients/detail?ingredientId=${ingredientId}`,
		});
	};

	const openIngredientActions = (ingredient : Ingredient) => {
		if (!canEdit.value) return;
		selectedIngredient.value = ingredient;
		uiStore.openModal(MODAL_KEYS.INGREDIENT_ACTIONS);
	};

	const handleDeleteIngredient = () => {
		uiStore.closeModal(MODAL_KEYS.INGREDIENT_ACTIONS);
		uiStore.openModal(MODAL_KEYS.DELETE_INGREDIENT_CONFIRM);
	};

	const confirmDeleteIngredient = async () => {
		if (!selectedIngredient.value) return;
		isSubmitting.value = true;
		try {
			await deleteIngredient(selectedIngredient.value.id);
			toastStore.show({ message: '删除成功', type: 'success' });
			await dataStore.fetchIngredientsData();
		} catch (error) { // [新增] 捕获API请求可能抛出的错误
			// 错误信息已在 request 工具函数中通过 toast 显示
			console.error("Failed to delete ingredient:", error);
		} finally {
			isSubmitting.value = false;
			uiStore.closeModal(MODAL_KEYS.DELETE_INGREDIENT_CONFIRM);
			selectedIngredient.value = null;
		}
	};
</script>
<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [兼容性修复] 引入 Mixin，将列表项内容的样式应用到当前页面作用域 */
	@include list-item-content-style;
	/* [核心修复] 修正 Mixin 的名称 */
	@include list-item-option-style;

	.content-padding {
		padding: 0 15px;
	}

	.side-info .consumption {
		margin-top: 2px;
	}

	.value-tag {
		font-size: 12px;
		font-weight: 500;
		padding: 3px 8px;
		border-radius: 6px;
		color: var(--text-secondary);
		background-color: #f3f4f6;
		display: inline-block;
	}

	.value-tag.stock-warning {
		background-color: #fef3c7;
		color: #92400e;
	}

	.value-tag.stock-danger {
		background-color: #fee2e2;
		color: #991b1b;
	}
</style>