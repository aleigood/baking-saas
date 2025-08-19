<template>
	<view class="card-full-bleed-list">
		<view class="card-title-wrapper">
			<span class="card-title">品牌与规格 (SKU)</span>
		</view>
		<ListItem v-for="(sku) in ingredient.skus" :key="sku.id" class="sku-item" :selected="selectedSkuId === sku.id"
			@click="$emit('select', sku)" @longpress="$emit('longpress-sku', sku)"
			:vibrate-on-long-press="ingredient.activeSku?.id !== sku.id" :bleed="true" :divider="true">
			<view class="main-info">
				<view class="name">{{ sku.brand || '无品牌' }} - {{ sku.specName }}</view>
				<view class="desc">添加于: {{ formatChineseDate(sku.createdAt) }}</view>
			</view>
			<view class="side-info">
				<span v-if="sku.id === ingredient.activeSku?.id" class="status-tag active">使用中</span>
			</view>
		</ListItem>
		<AppButton type="text-link" @click="$emit('add')">+ 新增品牌规格</AppButton>
	</view>
</template>

<script setup lang="ts">
	import { type PropType } from 'vue';
	import type { Ingredient, IngredientSKU } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';
	import ListItem from '@/components/ListItem.vue';
	import AppButton from '@/components/AppButton.vue';

	defineProps({
		ingredient: {
			type: Object as PropType<Ingredient>,
			required: true,
		},
		selectedSkuId: {
			type: String as PropType<string | null>,
			default: null,
		},
	});

	// [架构修复] 将发出的事件重命名为 'longpress-sku' 以避免与原生事件冲突
	const emit = defineEmits(['select', 'longpress-sku', 'add']);
</script>

<style scoped lang="scss">
	/* [兼容性修复] 引入 Mixin，将列表项内容的样式应用到当前组件作用域 */
	@include list-item-content-style;

	.sku-item .side-info {
		display: flex;
		align-items: center;
	}

	.status-tag {
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 13px;
		color: white;
		font-weight: 500;

		&.active {
			background-color: #5ac725;
		}
	}

	.card-full-bleed-list {
		background: var(--card-bg);
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
		border-radius: 20px;
		margin-bottom: 20px;
		padding-top: 20px;
		padding-bottom: 20px;
		padding-left: 0;
		padding-right: 0;
	}

	.card-full-bleed-list .card-title-wrapper {
		padding-left: 20px;
		padding-right: 20px;
	}

	.btn-text-link .ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>