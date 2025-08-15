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
			<FilterTabs>
				<FilterTab :active="ingredientFilter === 'all'" @click="ingredientFilter = 'all'">全部</FilterTab>
				<FilterTab :active="ingredientFilter === 'low'" @click="ingredientFilter = 'low'">库存紧张</FilterTab>
			</FilterTabs>

			<!-- [修改] 为触摸事件的容器添加class和样式 -->
			<view class="list-wrapper" @touchstart="handleTouchStart" @touchend="handleTouchEnd">
				<!-- 全部原料列表 -->
				<template v-if="ingredientFilter === 'all'">
					<template v-if="allIngredients.length > 0">
						<ListItem v-for="ing in allIngredients" :key="ing.id" @click="navigateToDetail(ing.id)">
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

				<!-- 库存紧张列表 -->
				<template v-if="ingredientFilter === 'low'">
					<template v-if="lowStockIngredients.length > 0">
						<ListItem v-for="ing in lowStockIngredients" :key="ing.id" @click="navigateToDetail(ing.id)">
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
	</view>
</template>
<script setup lang="ts">
	import IconButton from '@/components/IconButton.vue';
	import { ref, computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import type { Ingredient } from '@/types/api';
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue';
	import FilterTabs from '@/components/FilterTabs.vue';
	import FilterTab from '@/components/FilterTab.vue';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore();
	const ingredientFilter = ref('all');

	// [新增] 用于记录滑动起始位置的变量
	const touchStartX = ref(0);
	const touchStartY = ref(0);

	onShow(async () => {
		if (!dataStore.dataLoaded.ingredients) {
			await dataStore.fetchIngredientsData();
		}
	});

	// [新增] 记录触摸开始的坐标
	const handleTouchStart = (e : TouchEvent) => {
		touchStartX.value = e.touches[0].clientX;
		touchStartY.value = e.touches[0].clientY;
	};

	// [新增] 触摸结束时判断滑动方向并切换标签页
	const handleTouchEnd = (e : TouchEvent) => {
		const touchEndX = e.changedTouches[0].clientX;
		const touchEndY = e.changedTouches[0].clientY;
		const deltaX = touchEndX - touchStartX.value;
		const deltaY = touchEndY - touchStartY.value;

		if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 50) {
			if (deltaX < 0) {
				// 向左滑动
				ingredientFilter.value = 'low';
			} else {
				// 向右滑动
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