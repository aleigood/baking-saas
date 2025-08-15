<template>
	<!-- 专门用于显示主面团配方详情的组件 -->
	<view>
		<!-- 产品切换标签 -->
		<view class="product-tabs-wrapper">
			<FilterTabs v-if="version && version.products.length > 0">
				<FilterTab v-for="product in version.products" :key="product.id"
					:active="selectedProductId === product.id" @click="handleProductClick(product.id)">
					{{ product.name }}
				</FilterTab>
			</FilterTabs>
		</view>

		<!-- 主内容卡片 -->
		<view class="card" v-if="selectedProduct && recipeDetails">
			<!-- 数据分析区域 -->
			<view class="data-analysis-section">
				<AnimatedTabs v-model="detailChartTab" :tabs="chartTabs" />
				<LineChart v-if="detailChartTab === 'trend'" :chart-data="costHistory" />
				<PieChart v-if="detailChartTab === 'breakdown'" :chart-data="costBreakdown" />
			</view>

			<!-- 原料与流程详情 -->
			<view v-if="recipeDetails.doughGroups.length > 0">
				<view v-for="(dough, index) in recipeDetails.doughGroups" :key="dough.name + index"
					class="dough-section">
					<view class="group-title" @click="toggleCollapse(dough.name)">
						<span>{{ dough.name }}</span>
						<span class="arrow" :class="{ collapsed: collapsedSections.has(dough.name) }">&#10094;</span>
					</view>
					<view v-show="!collapsedSections.has(dough.name)">
						<view class="recipe-table-container">
							<view class="recipe-table">
								<view class="table-header">
									<text class="col-ingredient">原料</text>
									<text class="col-ratio">比例</text>
									<text class="col-usage">用量</text>
									<text class="col-price">单价</text>
									<text class="col-total">成本</text>
								</view>
								<view v-for="(ing, ingIndex) in dough.ingredients" :key="ingIndex" class="table-row">
									<text class="col-ingredient">{{ ing.name }}</text>
									<text class="col-ratio">{{ formatNumber(ing.ratio) }}%</text>
									<text class="col-usage">{{ formatNumber(ing.weightInGrams) }}g</text>
									<text class="col-price">¥{{ ing.pricePerKg }}/kg</text>
									<text class="col-total">¥{{ formatNumber(ing.cost) }}</text>
								</view>
							</view>
							<view v-if="dough.procedure && dough.procedure.length > 0" class="procedure-notes">
								<text class="notes-title">制作要点:</text>
								<text v-for="(step, stepIndex) in dough.procedure" :key="stepIndex"
									class="note-item">{{ stepIndex + 1 }}. {{ step }}</text>
							</view>
						</view>
					</view>
				</view>
			</view>
			<view v-else class="empty-state" style="padding: 20px 0">
				暂无面团原料信息
			</view>

			<view class="other-ingredients-section">
				<view class="group-title" @click="toggleCollapse('otherIngredients')">
					<span>原料汇总 (总成本: ¥{{ formatNumber(recipeDetails.totalCost) }})</span>
					<span class="arrow"
						:class="{ collapsed: collapsedSections.has('otherIngredients') }">&#10094;</span>
				</view>
				<view v-show="!collapsedSections.has('otherIngredients')">
					<view class="recipe-table-container">
						<view v-if="recipeDetails.extraIngredients.length > 0" class="product-ingredient-table">
							<view class="table-header">
								<text class="col-group">类型</text>
								<text class="col-ingredient">原料</text>
								<text class="col-usage">用量</text>
								<text class="col-cost">成本</text>
							</view>
							<template v-for="(group, groupName) in recipeDetails.groupedExtraIngredients"
								:key="groupName">
								<view v-for="(pIng, index) in group" :key="pIng.id" class="table-row">
									<text v-if="index === 0" class="col-group"
										:style="{ 'vertical-align': group.length > 1 ? 'top' : 'middle' }">
										{{ groupName }}
									</text>
									<text v-else class="col-group"></text>
									<text class="col-ingredient">{{ pIng.name }}</text>
									<text class="col-usage">
										<template v-if="pIng.id === 'dough-summary'">
											{{ formatNumber(pIng.weightInGrams) }}g
										</template>
										<template v-else-if="pIng.type === '搅拌原料'">
											{{ formatNumber(pIng.ratio) }}% ({{
											formatNumber(pIng.weightInGrams)
										}}g)
										</template>
										<template v-else-if="pIng.weightInGrams != null">
											{{ formatNumber(pIng.weightInGrams) }}g
										</template>
									</text>
									<text class="col-cost">¥{{ formatNumber(pIng.cost) }}</text>
								</view>
							</template>
						</view>
						<view v-else class="empty-state" style="padding: 20px 0;">
							暂无其他原料
						</view>
					</view>
				</view>
			</view>
		</view>
		<view v-else-if="version && version.products.length === 0" class="empty-state">
			当前版本暂无产品
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, watch, onMounted } from 'vue';
	import type { PropType } from 'vue';
	import type { RecipeVersion, RecipeDetails, Product } from '@/types/api';
	import { getProductCostHistory, getProductCostBreakdown, getRecipeDetails } from '@/api/costing';
	import LineChart from '@/components/LineChart.vue';
	import PieChart from '@/components/PieChart.vue';
	import FilterTabs from '@/components/FilterTabs.vue';
	import FilterTab from '@/components/FilterTab.vue';
	import AnimatedTabs from '@/components/AnimatedTabs.vue';
	import { formatNumber } from '@/utils/format';

	// 定义组件接收的属性
	const props = defineProps({
		version: {
			type: Object as PropType<RecipeVersion | null>,
			default: null
		}
	});

	// 内部状态
	const selectedProductId = ref<string | null>(null);
	const recipeDetails = ref<RecipeDetails | null>(null);
	const costHistory = ref<{ cost : number }[]>([]);
	const costBreakdown = ref<{ name : string, value : number }[]>([]);
	const detailChartTab = ref<'trend' | 'breakdown'>('trend');
	const collapsedSections = ref(new Set<string>());

	const chartTabs = ref([
		{ key: 'trend', label: '成本走势' },
		{ key: 'breakdown', label: '原料成本' },
	]);

	// 计算属性，获取当前选中的产品对象
	const selectedProduct = computed(() => {
		if (!props.version || !selectedProductId.value) return null;
		// @ts-ignore
		return props.version.products.find(p => p.id === selectedProductId.value);
	});

	// 方法：获取成本相关数据
	const fetchCostData = async (productId : string | null) => {
		if (!productId) {
			costHistory.value = [];
			costBreakdown.value = [];
			recipeDetails.value = null;
			return;
		}
		try {
			const [historyData, breakdownData, detailsData] = await Promise.all([
				getProductCostHistory(productId),
				getProductCostBreakdown(productId),
				getRecipeDetails(productId)
			]);
			costHistory.value = historyData;
			costBreakdown.value = breakdownData;
			recipeDetails.value = detailsData;
		} catch (error) {
			console.error('Failed to fetch cost data for product:', error);
			costHistory.value = [];
			costBreakdown.value = [];
			recipeDetails.value = null;
		}
	};

	// 方法：处理产品标签点击
	const handleProductClick = (productId : string) => {
		selectedProductId.value = productId;
	};

	// 方法：切换内容区域的折叠状态
	const toggleCollapse = (sectionName : string) => {
		const newSet = new Set(collapsedSections.value);
		if (newSet.has(sectionName)) {
			newSet.delete(sectionName);
		} else {
			newSet.add(sectionName);
		}
		collapsedSections.value = newSet;
	};

	// 监听 selectedProductId 的变化，自动获取新数据
	watch(selectedProductId, (newProductId) => {
		fetchCostData(newProductId);
	});

	// 监听 version prop 的变化，当父组件切换版本时，重置选中产品并加载数据
	watch(() => props.version, (newVersion) => {
		if (newVersion && newVersion.products.length > 0) {
			// @ts-ignore
			selectedProductId.value = newVersion.products[0].id;
		} else {
			selectedProductId.value = null;
		}
	}, { immediate: true }); // immediate: true 确保组件首次挂载时也执行
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* 此处样式与原 detail.vue 中主配方相关的样式完全相同，直接复制过来即可 */
	.recipe-table-container {
		background-color: #faf8f5;
		border-radius: 16px;
		padding: 15px;
		margin-top: 15px;
	}

	.group-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		padding: 15px 5px 15px 5px;
		border-bottom: 1px solid var(--border-color);
		margin-top: 10px;
	}

	.arrow {
		font-size: 14px;
		color: var(--text-secondary);
		transform: rotate(90deg);
		transition: transform 0.3s ease;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.recipe-table {
		display: table;
		width: 100%;
		font-size: 14px;
		border-collapse: collapse;

		.table-header,
		.table-row {
			display: table-row;
		}

		.table-header {
			color: var(--text-secondary);
			font-weight: 500;
		}

		.table-row {
			color: var(--text-primary);
			border-bottom: 1px solid var(--border-color);

			&:last-child {
				border-bottom: none;
			}
		}

		.col-ingredient,
		.col-ratio,
		.col-usage,
		.col-price,
		.col-total {
			display: table-cell;
			padding: 8px 4px;
			vertical-align: middle;
		}

		.col-ratio,
		.col-usage,
		.col-price,
		.col-total {
			text-align: right;
			white-space: nowrap;
		}

		.col-ingredient {
			min-width: 80px;
			word-break: break-word;
		}
	}

	.procedure-notes {
		margin-top: 15px;
		font-size: 12px;
		color: var(--text-secondary);
		line-height: 1.6;

		.notes-title {
			font-weight: 600;
			display: block;
			margin-bottom: 5px;
		}

		.note-item {
			display: block;
		}
	}

	.product-tabs-wrapper {
		padding: 0;
		margin-bottom: 20px;

		:deep(.filter-tabs) {
			flex-wrap: wrap;
			margin-bottom: 0;
		}
	}

	.data-analysis-section {
		margin-bottom: 20px;
	}

	.product-ingredient-table {
		display: table;
		width: 100%;
		font-size: 14px;

		.table-header,
		.table-row {
			display: table-row;
		}

		.table-header {
			color: var(--text-secondary);
			font-weight: 500;
		}

		.table-row {
			color: var(--text-primary);
			border-bottom: 1px solid var(--border-color);

			&:last-child {
				border-bottom: none;
			}
		}

		.col-group,
		.col-ingredient,
		.col-usage,
		.col-cost {
			display: table-cell;
			padding: 8px 4px;
			vertical-align: middle;
		}

		.col-group {
			width: 25%;
			word-break: break-word;
			font-weight: 500;
			color: var(--text-secondary);
		}

		.col-ingredient {
			width: 35%;
			word-break: break-word;
		}

		.col-usage,
		.col-cost {
			text-align: right;
			white-space: nowrap;
		}
	}
</style>