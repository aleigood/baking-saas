<template>
	<view>
		<MainHeader />
		<view class="page-content page-content-with-tabbar-fab">
			<view class="card">
				<view class="card-title"><span>本周制作排行</span></view>
				<view v-if="recipeStatsForChart.length > 0" class="ranking-list">
					<view v-for="(item, index) in recipeStatsForChart.slice(0, 10)" :key="item.name"
						class="ranking-item">
						<text class="rank">{{ index + 1 }}</text>
						<text class="name">{{ item.name }}</text>
						<text class="count">{{ item.value }} 个</text>
					</view>
				</view>
				<view v-else class="empty-state">
					<text>暂无排行信息</text>
				</view>
			</view>

			<!-- [修改] 增加 class 以调整间距 -->
			<FilterTabs class="recipe-filter-tabs">
				<FilterTab :active="recipeFilter === 'MAIN'" @click="recipeFilter = 'MAIN'">面团</FilterTab>
				<FilterTab :active="recipeFilter === 'OTHER'" @click="recipeFilter = 'OTHER'">其他</FilterTab>
			</FilterTabs>

			<view class="list-wrapper" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
				<template v-if="recipeFilter === 'MAIN'">
					<template v-if="mainRecipes.length > 0">
						<ListItem v-for="family in mainRecipes" :key="family.id" @click="navigateToDetail(family.id)"
							@longpress="openRecipeActions(family)" :vibrate-on-long-press="canEditRecipe">
							<view class="main-info">
								<view class="name">
									{{ family.name }}
									<!-- [新增] 已停用状态标签 -->
									<text v-if="family.deletedAt" class="status-tag discontinued">已停用</text>
								</view>
								<view class="desc">
									{{ getProductCount(family) }} 种面包
								</view>
							</view>
							<view class="side-info">
								<view class="rating">★ {{ getRating(family.productionTaskCount || 0) }}</view>
								<view class="desc">{{ family.productionTaskCount || 0 }} 次制作</view>
							</view>
						</ListItem>
					</template>
					<view v-else class="empty-state">
						<text>暂无面团配方信息</text>
					</view>
				</template>

				<template v-if="recipeFilter === 'OTHER'">
					<template v-if="otherRecipes.length > 0">
						<ListItem v-for="family in otherRecipes" :key="family.id" @click="navigateToDetail(family.id)"
							@longpress="openRecipeActions(family)" :vibrate-on-long-press="canEditRecipe">
							<view class="main-info">
								<view class="name">
									{{ family.name }}
									<text v-if="family.deletedAt" class="status-tag discontinued">已停用</text>
								</view>
								<view class="desc">
									类型: {{ getRecipeTypeDisplay(family.type) }}
								</view>
							</view>
							<view class="side-info">
								<view class="desc">{{ getIngredientCount(family) }} 种原料</view>
							</view>
						</ListItem>
					</template>
					<view v-else class="empty-state">
						<text>暂无其他配方信息</text>
					</view>
				</template>
			</view>
		</view>
		<AppFab v-if="canEditRecipe" @click="navigateToEditPage(null)" />

		<AppModal :visible="uiStore.showRecipeActionsModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.RECIPE_ACTIONS)" title="配方操作" :no-header-line="true">
			<view class="options-list">
				<template v-if="selectedRecipe?.deletedAt === null">
					<ListItem class="option-item" @click="handleDiscontinueRecipe">
						<view class="main-info">
							<view class="name">停用配方</view>
						</view>
					</ListItem>
				</template>
				<template v-else>
					<ListItem class="option-item" @click="handleRestoreRecipe">
						<view class="main-info">
							<view class="name">恢复配方</view>
						</view>
					</ListItem>
				</template>
				<ListItem class="option-item" @click="handleDeleteRecipe">
					<view class="main-info">
						<view class="name">删除配方</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showDeleteRecipeConfirmModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.DELETE_RECIPE_CONFIRM)" title="确认删除">
			<view class="modal-prompt-text">
				确定要删除 “{{ selectedRecipe?.name }}” 吗？
			</view>
			<view class="modal-warning-text">
				已被生产任务使用的配方将无法被删除。此操作不可撤销。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.DELETE_RECIPE_CONFIRM)">取消</AppButton>
				<AppButton type="danger" @click="confirmDeleteRecipe" :loading="isSubmitting">
					{{ isSubmitting ? '' : '确认删除' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showDiscontinueRecipeConfirmModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.DISCONTINUE_RECIPE_CONFIRM)" title="确认停用">
			<view class="modal-prompt-text">
				确定要停用 “{{ selectedRecipe?.name }}” 吗？
			</view>
			<view class="modal-warning-text">
				停用后，此配方将无法用于新的生产任务。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.DISCONTINUE_RECIPE_CONFIRM)">取消
				</AppButton>
				<AppButton type="danger" @click="confirmDiscontinueRecipe" :loading="isSubmitting">
					{{ isSubmitting ? '' : '确认停用' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showRestoreRecipeConfirmModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.RESTORE_RECIPE_CONFIRM)" title="确认恢复">
			<view class="modal-prompt-text">
				确定要恢复 “{{ selectedRecipe?.name }}” 吗？
			</view>
			<view class="modal-warning-text">
				恢复后，此配方将可以重新用于生产任务。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.RESTORE_RECIPE_CONFIRM)">取消
				</AppButton>
				<AppButton type="primary" @click="confirmRestoreRecipe" :loading="isSubmitting">
					{{ isSubmitting ? '' : '确认恢复' }}
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
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import { discontinueRecipe, restoreRecipe, deleteRecipe } from '@/api/recipes';
	import type { RecipeFamily } from '@/types/api';
	import MainHeader from '@/components/MainHeader.vue';
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

	const recipeFilter = ref<'MAIN' | 'OTHER'>('MAIN');
	const isSubmitting = ref(false);
	const selectedRecipe = ref<RecipeFamily | null>(null);

	const touchStartX = ref(0);
	const touchStartY = ref(0);

	const recipeTypeMap = {
		MAIN: '面团',
		PRE_DOUGH: '面种',
		EXTRA: '馅料',
	};

	onShow(async () => {
		if (!dataStore.dataLoaded.recipes) {
			await dataStore.fetchRecipesData();
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
				recipeFilter.value = 'OTHER';
			} else {
				recipeFilter.value = 'MAIN';
			}
		}
	};

	const recipeStatsForChart = computed(() => {
		return dataStore.recipeStats
			.map(item => ({
				name: item.name,
				value: item.count,
			}))
			.sort((a, b) => b.value - a.value);
	});

	const mainRecipes = computed(() => {
		if (!dataStore.recipes) return [];
		return [...dataStore.recipes]
			.filter((family) => family.type === 'MAIN')
			.sort((a, b) => (b.productionTaskCount || 0) - (a.productionTaskCount || 0));
	});

	const otherRecipes = computed(() => {
		if (!dataStore.recipes) return [];
		return [...dataStore.recipes]
			.filter((family) => family.type === 'PRE_DOUGH' || family.type === 'EXTRA')
			.sort((a, b) => a.name.localeCompare(b.name));
	});

	const getRecipeTypeDisplay = (type : 'MAIN' | 'PRE_DOUGH' | 'EXTRA') => {
		return recipeTypeMap[type] || type;
	};

	const getProductCount = (family : RecipeFamily) => {
		if (family.type !== 'MAIN' || !family.versions || family.versions.length === 0) {
			return 0;
		}
		const activeVersion = family.versions.find(v => v.isActive);
		return activeVersion?.products?.length || 0;
	};

	const getIngredientCount = (family : RecipeFamily) => {
		if (family.type === 'MAIN' || !family.versions || family.versions.length === 0) {
			return 0;
		}
		const activeVersion = family.versions.find(v => v.isActive);
		return activeVersion?.doughs.reduce((sum, dough) => sum + (dough._count?.ingredients || 0), 0) || 0;
	};

	const getRating = (count : number) => {
		if (count > 20) return '4.9';
		if (count > 10) return '4.8';
		if (count > 3) return '4.7';
		return '4.5';
	};

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canEditRecipe = computed(() => {
		return (
			currentUserRoleInTenant.value === 'OWNER' || currentUserRoleInTenant.value === 'ADMIN'
		);
	});

	const navigateToEditPage = (familyId : string | null) => {
		const url = familyId ? `/pages/recipes/edit?familyId=${familyId}` : '/pages/recipes/edit';
		uni.navigateTo({ url });
	};

	const navigateToDetail = (familyId : string) => {
		uni.navigateTo({
			url: `/pages/recipes/detail?familyId=${familyId}`,
		});
	};

	const openRecipeActions = (recipe : RecipeFamily) => {
		if (!canEditRecipe.value) return;
		selectedRecipe.value = recipe;
		uiStore.openModal(MODAL_KEYS.RECIPE_ACTIONS);
	};

	const handleDiscontinueRecipe = () => {
		uiStore.closeModal(MODAL_KEYS.RECIPE_ACTIONS);
		uiStore.openModal(MODAL_KEYS.DISCONTINUE_RECIPE_CONFIRM);
	};

	const handleRestoreRecipe = () => {
		uiStore.closeModal(MODAL_KEYS.RECIPE_ACTIONS);
		uiStore.openModal(MODAL_KEYS.RESTORE_RECIPE_CONFIRM);
	};

	const handleDeleteRecipe = () => {
		uiStore.closeModal(MODAL_KEYS.RECIPE_ACTIONS);
		uiStore.openModal(MODAL_KEYS.DELETE_RECIPE_CONFIRM);
	};

	const confirmDiscontinueRecipe = async () => {
		if (!selectedRecipe.value) return;
		isSubmitting.value = true;
		try {
			await discontinueRecipe(selectedRecipe.value.id);
			toastStore.show({ message: '已停用', type: 'success' });
			await dataStore.fetchRecipesData();
		} finally {
			isSubmitting.value = false;
			uiStore.closeModal(MODAL_KEYS.DISCONTINUE_RECIPE_CONFIRM);
			selectedRecipe.value = null;
		}
	};

	const confirmRestoreRecipe = async () => {
		if (!selectedRecipe.value) return;
		isSubmitting.value = true;
		try {
			await restoreRecipe(selectedRecipe.value.id);
			toastStore.show({ message: '已恢复', type: 'success' });
			await dataStore.fetchRecipesData();
		} finally {
			isSubmitting.value = false;
			uiStore.closeModal(MODAL_KEYS.RESTORE_RECIPE_CONFIRM);
			selectedRecipe.value = null;
		}
	};

	const confirmDeleteRecipe = async () => {
		if (!selectedRecipe.value) return;
		isSubmitting.value = true;
		try {
			await deleteRecipe(selectedRecipe.value.id);
			toastStore.show({ message: '删除成功', type: 'success' });
			await dataStore.fetchRecipesData();
		} finally {
			isSubmitting.value = false;
			uiStore.closeModal(MODAL_KEYS.DELETE_RECIPE_CONFIRM);
			selectedRecipe.value = null;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.list-wrapper {
		min-height: 60vh;
	}

	.list-wrapper :deep(.list-item) {
		margin-left: -15px;
		margin-right: -15px;
		padding-left: 20px;
		padding-right: 20px;
	}

	.list-wrapper :deep(.list-item:not(:last-child)::after) {
		left: 20px;
		right: 20px;
	}

	.rating {
		color: var(--accent-color);
		font-weight: bold;
	}

	.ranking-list {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 15px 25px;
		padding-top: 10px;
	}

	.ranking-item {
		display: flex;
		align-items: center;
		font-size: 14px;
	}

	.rank {
		font-style: italic;
		font-weight: bold;
		width: 12px;
		color: var(--accent-color);
	}

	.name {
		flex-grow: 1;
		margin: 0 8px 0 4px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--text-primary);
	}

	.count {
		color: var(--text-secondary);
		font-size: 13px;
	}

	.empty-state {
		text-align: center;
		padding: 50px 20px;
		color: var(--text-secondary);
	}

	.status-tag {
		font-size: 12px;
		font-weight: 500;
		padding: 3px 8px;
		border-radius: 6px;
		margin-left: 8px;
		display: inline-block;
		vertical-align: middle;
	}

	.status-tag.discontinued {
		background-color: #fee2e2;
		color: #991b1b;
	}

	.recipe-filter-tabs {
		margin-top: 32px;
	}
</style>