<template>
	<view>
		<view class="page-header">
			<view class="store-selector" @click="uiStore.openModal('store')">{{ dataStore.currentTenant?.name }} &#9662;
			</view>
			<IconButton circle class="user-avatar" @click="uiStore.openModal('userOptions')">
				{{ userStore.userInfo?.name?.[0] || '管' }}
			</IconButton>
		</view>
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

			<FilterTabs>
				<FilterTab :active="recipeFilter === 'MAIN'" @click="recipeFilter = 'MAIN'">面团</FilterTab>
				<FilterTab :active="recipeFilter === 'OTHER'" @click="recipeFilter = 'OTHER'">其他</FilterTab>
			</FilterTabs>

			<!-- [修改] 为触摸事件的容器添加class和样式 -->
			<view class="list-wrapper" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
				<!-- 面团列表 -->
				<template v-if="recipeFilter === 'MAIN'">
					<template v-if="mainRecipes.length > 0">
						<ListItem v-for="family in mainRecipes" :key="family.id" @click="navigateToDetail(family.id)">
							<view class="main-info">
								<view class="name">{{ family.name }}</view>
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

				<!-- 其他配方列表 -->
				<template v-if="recipeFilter === 'OTHER'">
					<template v-if="otherRecipes.length > 0">
						<ListItem v-for="family in otherRecipes" :key="family.id" @click="navigateToDetail(family.id)">
							<view class="main-info">
								<view class="name">{{ family.name }}</view>
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
	</view>
</template>

<script setup lang="ts">
	import IconButton from '@/components/IconButton.vue';
	import { ref, computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import type { RecipeFamily } from '@/types/api';
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue';
	import FilterTabs from '@/components/FilterTabs.vue';
	import FilterTab from '@/components/FilterTab.vue';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore();

	const recipeFilter = ref<'MAIN' | 'OTHER'>('MAIN');

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
		return family.versions[0].products?.length || 0;
	};

	const getIngredientCount = (family : RecipeFamily) => {
		if (family.type === 'MAIN' || !family.versions || family.versions.length === 0) {
			return 0;
		}
		return family.versions[0].doughs.reduce((sum, dough) => sum + (dough._count?.ingredients || 0), 0);
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
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [新增] 列表滑动容器样式 */
	.list-wrapper {
		min-height: 60vh;
		/* 确保即使列表为空，也有足够的滑动区域 */
	}

	/* [新增] 通过wrapper类来定位ListItem，修复边距问题 */
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
</style>