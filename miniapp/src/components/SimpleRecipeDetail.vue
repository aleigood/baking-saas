<template>
	<!-- 专门用于显示非主面团配方（面种、馅料等）的组件 -->
	<view class="card">
		<view class="card-title">原料列表</view>
		<view class="recipe-table-container">
			<view class="recipe-table simple-table">
				<view class="table-header">
					<text class="col-ingredient">原料名称</text>
					<text class="col-ratio">比例</text>
					<text class="col-price">单价</text>
				</view>
				<view v-for="(ing, ingIndex) in nonMainRecipeIngredients" :key="ingIndex" class="table-row">
					<text class="col-ingredient">{{ ing.name }}</text>
					<text class="col-ratio">{{ formatNumber(ing.ratio) }}%</text>
					<text class="col-price">¥{{ ing.pricePerKg }}/kg</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
	import type { PropType } from 'vue';
	import { useDataStore } from '@/store/data';
	import type { RecipeVersion, Ingredient } from '@/types/api';
	import { formatNumber } from '@/utils/format';

	const props = defineProps({
		version: {
			type: Object as PropType<RecipeVersion | null>,
			default: null
		}
	});

	const dataStore = useDataStore();

	// 计算属性，用于处理并格式化非主面团配方的原料列表
	const nonMainRecipeIngredients = computed(() => {
		if (!props.version) {
			return [];
		}
		// 非主面团配方通常只有一个 dough 定义
		const dough = props.version.doughs[0];
		if (!dough || !dough.ingredients) {
			return [];
		}
		return dough.ingredients.map(ing => {
			const ingredientData = dataStore.ingredients.find(i => i.name === ing.name);
			const pricePerKg = ingredientData ? getPricePerKg(ingredientData) : '0.00';
			return {
				...ing,
				pricePerKg,
			};
		});
	});

	// 辅助函数，用于查找并计算原料单价
	const getPricePerKg = (ing : Ingredient) => {
		if (!ing || !ing.activeSku || !ing.currentPricePerPackage || !ing.activeSku.specWeightInGrams) {
			return '0.00';
		}
		return ((Number(ing.currentPricePerPackage) / ing.activeSku.specWeightInGrams) * 1000).toFixed(2);
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* 此处样式与原 detail.vue 中简单表格相关的样式完全相同，直接复制过来即可 */
	.recipe-table-container {
		background-color: #faf8f5;
		border-radius: 16px;
		padding: 15px;
		margin-top: 15px;
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
		.col-price {
			display: table-cell;
			padding: 8px 4px;
			vertical-align: middle;
		}

		.col-ratio,
		.col-price {
			text-align: right;
			white-space: nowrap;
		}

		.col-ingredient {
			min-width: 80px;
			word-break: break-word;
		}

		&.simple-table {
			.col-ingredient {
				width: 50%;
			}

			.col-ratio {
				width: 25%;
			}

			.col-price {
				width: 25%;
			}
		}
	}
</style>