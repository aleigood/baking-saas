<template>
	<view class="page-container">
		<!-- [重构] 使用 DetailHeader 组件 -->
		<DetailHeader title="生产统计" />
		<view class="page-content">
			<view class="date-range-selector">
				<FilterTabs>
					<FilterTab :active="activeDateRange === 'week'" @click="setDateRange('week')">本周</FilterTab>
					<FilterTab :active="activeDateRange === 'month'" @click="setDateRange('month')">本月</FilterTab>
					<FilterTab :active="activeDateRange === '7days'" @click="setDateRange('7days')">最近7天</FilterTab>
					<FilterTab :active="activeDateRange === '30days'" @click="setDateRange('30days')">最近30天</FilterTab>
					<FilterTab :active="activeDateRange === 'custom'" @click="setDateRange('custom')">自定义</FilterTab>
				</FilterTabs>
			</view>

			<view v-if="activeDateRange === 'custom'" class="custom-date-picker card">
				<picker mode="date" :value="customDate.start" @change="handleCustomDateChange($event, 'start')">
					<view class="picker-item">{{ customDate.start }}</view>
				</picker>
				<view class="date-separator">至</view>
				<picker mode="date" :value="customDate.end" @change="handleCustomDateChange($event, 'end')">
					<view class="picker-item">{{ customDate.end }}</view>
				</picker>
			</view>

			<view v-if="isLoading" class="loading-spinner">
				<text>加载中...</text>
			</view>
			<template v-else-if="statsData.length > 0">
				<view class="summary-card">
					<div>
						<view class="value">{{ kpi.totalCount }}</view>
						<view class="label">总产量</view>
					</div>
					<div>
						<view class="value">{{ kpi.varietyCount }}</view>
						<view class="label">面包种类</view>
					</div>
					<div>
						<view class="value">{{ kpi.totalTasks }}</view>
						<view class="label">任务总数</view>
					</div>
				</view>

				<view class="card">
					<view class="card-title">产量排行 Top 10</view>
					<BarChart :chart-data="statsData.slice(0, 10)" unit="个" />
				</view>

				<view class="card">
					<view class="card-title">详细数据</view>
					<view class="stats-table">
						<view class="table-header">
							<text class="col-rank">#</text>
							<text class="col-name">产品名称</text>
							<text class="col-count">制作数量</text>
							<text class="col-percent">占比</text>
						</view>
						<view v-for="(item, index) in statsData" :key="item.name" class="table-row">
							<text class="col-rank">{{ index + 1 }}</text>
							<text class="col-name">{{ item.name }}</text>
							<text class="col-count">{{ item.value }}</text>
							<text class="col-percent">{{ getPercentage(item.value) }}</text>
						</view>
					</view>
				</view>
			</template>
			<view v-else class="empty-state">
				<text>选定时间范围内暂无已完成的生产数据</text>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, onMounted, reactive } from 'vue';
	import { useToastStore } from '@/store/toast';
	import { getProductionStats } from '@/api/stats';
	import FilterTabs from '@/components/FilterTabs.vue';
	import FilterTab from '@/components/FilterTab.vue';
	import BarChart from '@/components/BarChart.vue';
	import DetailHeader from '@/components/DetailHeader.vue'; // [新增] 引入 DetailHeader 组件
	import type { RecipeStatDto } from '@/types/api';

	const isLoading = ref(true);
	const activeDateRange = ref<'week' | 'month' | '7days' | '30days' | 'custom'>('week');
	const statsData = ref<{ name : string, value : number }[]>([]);
	const totalTasks = ref(0);
	const toastStore = useToastStore();

	const customDate = reactive({
		start: new Date().toISOString().split('T')[0],
		end: new Date().toISOString().split('T')[0],
	});

	const getDateRange = (rangeType : typeof activeDateRange.value) => {
		if (rangeType === 'custom') {
			return { startDate: customDate.start, endDate: customDate.end };
		}
		const end = new Date();
		const start = new Date();
		switch (rangeType) {
			case 'week':
				const day = start.getDay() || 7;
				if (day !== 1) start.setHours(-24 * (day - 1));
				start.setHours(0, 0, 0, 0);
				break;
			case 'month':
				start.setDate(1);
				start.setHours(0, 0, 0, 0);
				break;
			case '7days':
				start.setDate(start.getDate() - 6);
				start.setHours(0, 0, 0, 0);
				break;
			case '30days':
				start.setDate(start.getDate() - 29);
				start.setHours(0, 0, 0, 0);
				break;
		}
		return {
			startDate: start.toISOString().split('T')[0],
			endDate: end.toISOString().split('T')[0],
		};
	};

	const fetchStatsData = async () => {
		isLoading.value = true;
		try {
			const { startDate, endDate } = getDateRange(activeDateRange.value);
			const data = await getProductionStats(startDate, endDate);
			if (data && data.productStats) {
				statsData.value = data.productStats.sort((a, b) => b.count - a.count).map(item => ({ name: item.name, value: item.count }));
				totalTasks.value = data.totalTasks;
			} else {
				statsData.value = [];
				totalTasks.value = 0;
			}
		} catch (error) {
			console.error('Failed to fetch stats data:', error);
		} finally {
			isLoading.value = false;
		}
	};

	const setDateRange = (rangeType : typeof activeDateRange.value) => {
		activeDateRange.value = rangeType;
		if (rangeType !== 'custom') {
			fetchStatsData();
		}
	};

	const handleCustomDateChange = (e : any, type : 'start' | 'end') => {
		if (type === 'start') {
			customDate.start = e.detail.value;
		} else {
			customDate.end = e.detail.value;
		}
		if (new Date(customDate.start) > new Date(customDate.end)) {
			toastStore.show({ message: '开始日期不能晚于结束日期', type: 'error' });
			return;
		}
		fetchStatsData();
	};

	const kpi = computed(() => {
		if (statsData.value.length === 0) {
			return { totalCount: 0, varietyCount: 0, totalTasks: 0 };
		}
		const totalCount = statsData.value.reduce((sum, item) => sum + item.value, 0);
		return {
			totalCount,
			varietyCount: statsData.value.length,
			totalTasks: totalTasks.value,
		};
	});

	const getPercentage = (value : number) => {
		if (kpi.value.totalCount === 0) return '0%';
		return `${((value / kpi.value.totalCount) * 100).toFixed(1)}%`;
	};

	onMounted(() => {
		fetchStatsData();
	});
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.date-range-selector {
		margin-bottom: 20px;
	}

	.custom-date-picker {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px;
		margin-bottom: 20px;
	}

	.picker-item {
		background-color: #f8f9fa;
		padding: 8px 18px;
		border-radius: 8px;
		border: 1px solid var(--border-color);
	}

	.date-separator {
		color: var(--text-secondary);
	}

	.summary-card {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 15px;
		background: var(--card-bg);
		padding: 20px;
		border-radius: 20px;
		margin-bottom: 20px;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	}

	.summary-card .value {
		font-size: 20px;
		font-weight: bold;
		color: var(--primary-color);

		&.name {
			font-size: 16px;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
		}
	}

	.summary-card .label {
		font-size: 13px;
		color: var(--text-secondary);
		margin-top: 5px;
	}

	.stats-table {
		font-size: 14px;

		.table-header,
		.table-row {
			display: flex;
			padding: 10px 5px;
			border-bottom: 1px solid var(--border-color);
		}

		.table-header {
			font-weight: 600;
			color: var(--text-secondary);
		}

		.table-row:last-child {
			border-bottom: none;
		}

		.col-rank {
			width: 10%;
			text-align: center;
		}

		.col-name {
			width: 50%;
		}

		.col-count {
			width: 20%;
			text-align: right;
		}

		.col-percent {
			width: 20%;
			text-align: right;
		}
	}
</style>