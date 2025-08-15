<template>
	<view class="card" v-if="selectedSku">
		<view class="card-title">{{ selectedSku.brand || '无品牌' }} - {{ selectedSku.specName }} 的采购记录
		</view>
		<view class="procurement-list">
			<view class="list-header">
				<text class="col-date">采购日期</text>
				<text class="col-quantity">数量</text>
				<text class="col-price">单价</text>
				<text class="col-total">总价</text>
			</view>
			<view v-if="displayedProcurementRecords && displayedProcurementRecords.length > 0">
				<ListItem v-for="record in displayedProcurementRecords" :key="record.id" class="procurement-item"
					@longpress="$emit('longpress', record)" :vibrate-on-long-press="true">
					<text class="col-date">{{ formatChineseDate(record.purchaseDate) }}</text>
					<text class="col-quantity">{{ record.packagesPurchased }} 包</text>
					<text class="col-price">¥{{ Number(record.pricePerPackage).toFixed(2) }}</text>
					<text
						class="col-total">¥{{ (record.packagesPurchased * Number(record.pricePerPackage)).toFixed(2) }}</text>
				</ListItem>
			</view>
			<view v-else class="empty-procurements">
				无采购记录
			</view>
		</view>
		<AppButton v-if="hasMoreRecords" type="text-link" @click="loadMoreRecords">加载更多</AppButton>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, type PropType } from 'vue';
	import type { IngredientSKU } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';
	import ListItem from '@/components/ListItem.vue';
	import AppButton from '@/components/AppButton.vue';

	// 定义组件接收的属性
	const props = defineProps({
		selectedSku: {
			type: Object as PropType<IngredientSKU | null>,
			default: null,
		},
	});

	// 定义组件可以向外触发的事件
	const emit = defineEmits(['longpress']);

	const displayedRecordsCount = ref(10);

	// 计算显示的采购记录
	const displayedProcurementRecords = computed(() => {
		if (!props.selectedSku || !props.selectedSku.procurementRecords) return [];
		return props.selectedSku.procurementRecords.slice(0, displayedRecordsCount.value);
	});

	// 计算是否还有更多记录可加载
	const hasMoreRecords = computed(() => {
		if (!props.selectedSku || !props.selectedSku.procurementRecords) return false;
		return displayedRecordsCount.value < props.selectedSku.procurementRecords.length;
	});

	// 加载更多记录
	const loadMoreRecords = () => {
		displayedRecordsCount.value += 10;
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.procurement-list {

		.list-header,
		.procurement-item {
			display: grid;
			grid-template-columns: 2fr 1.5fr 1.5fr 1.5fr;
			align-items: center;
			padding: 8px 5px;
			font-size: 13px;
		}

		.list-header {
			font-weight: 600;
			color: var(--primary-color);
			border-bottom: 1px solid var(--border-color);
			margin-bottom: 5px;
		}

		.procurement-item {
			color: var(--text-secondary);
		}

		.col-quantity,
		.col-price,
		.col-total {
			text-align: right;
		}
	}

	.empty-procurements {
		text-align: center;
		color: #b0a8a2;
		padding: 20px 0;
		font-size: 13px;
	}
</style>