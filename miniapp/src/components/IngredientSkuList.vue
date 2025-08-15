<template>
	<view class="card card-full-bleed-list">
		<view class="card-title-wrapper">
			<span class="card-title">品牌与规格 (SKU)</span>
		</view>
		<ListItem v-for="sku in ingredient.skus" :key="sku.id" class="sku-item"
			:class="{ 'item-selected': selectedSkuId === sku.id }" @click="$emit('select', sku)"
			@longpress="$emit('longpress', sku)" :vibrate-on-long-press="ingredient.activeSkuId !== sku.id">
			<view class="main-info">
				<view class="name">{{ sku.brand || '无品牌' }} - {{ sku.specName }}</view>
				<view class="desc">添加于: {{ formatChineseDate(sku.createdAt) }}</view>
			</view>
			<view class="side-info">
				<span v-if="sku.id === ingredient.activeSkuId" class="status-tag active">使用中</span>
			</view>
		</ListItem>
		<!-- [修改] 恢复使用 AppButton 组件 -->
		<AppButton type="text-link" @click="$emit('add')">+ 新增品牌规格</AppButton>
	</view>
</template>

<script setup lang="ts">
	import { type PropType } from 'vue';
	import type { Ingredient, IngredientSKU } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';
	import ListItem from '@/components/ListItem.vue';
	import AppButton from '@/components/AppButton.vue'; // [新增] 引入 AppButton 组件

	// 定义组件接收的属性
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

	// 定义组件可以向外触发的事件
	const emit = defineEmits(['select', 'longpress', 'add']);

	// [删除] 移除手动实现的水波纹效果相关逻辑
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

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

	.list-item.item-selected {
		background-color: transparent;
	}

	.list-item.item-selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 50%;
		background-color: var(--primary-color);
		border-radius: 0 4px 4px 0;
	}

	.card-full-bleed-list {
		padding-left: 0;
		padding-right: 0;
	}

	.card-full-bleed-list .card-title-wrapper {
		padding-left: 20px;
		padding-right: 20px;
	}

	.card-full-bleed-list .list-item {
		padding-left: 20px;
		padding-right: 20px;
	}

	.btn-text-link .ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>