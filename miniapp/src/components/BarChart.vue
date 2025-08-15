<template>
	<view class="bar-chart-container">
		<view v-if="!chartData || chartData.length === 0" class="chart-placeholder">
			暂无统计数据
		</view>
		<!-- [核心修改] 恢复为横向条形图布局 -->
		<view v-else class="chart-content">
			<view v-for="(item, index) in chartData" :key="item.name" class="bar-item">
				<view class="bar-label">
					<span class="rank">{{ index + 1 }}</span>
					<span class="name">{{ item.name }}</span>
				</view>
				<view class="bar-wrapper">
					<view class="bar" :style="{ width: getBarWidth(item.value), background: getBarColor(index) }">
					</view>
					<span class="value">{{ item.value.toFixed(1) }} {{ unit }}</span>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { computed } from 'vue';

	// 定义组件接收的属性
	const props = defineProps({
		chartData: {
			type: Array as () => { name : string, value : number }[],
			default: () => [],
		},
		unit: {
			type: String,
			default: '',
		}
	});

	// 预定义的颜色列表
	const colors = [
		'#8c5a3b', '#d4a373', '#a98467', '#c2956f', '#e6b89c'
	];

	// 计算最大值，用于确定条形图的相对长度
	const maxValue = computed(() => {
		if (!props.chartData || props.chartData.length === 0) {
			return 0;
		}
		// 增加一个1.2的系数，让最长的条不到头，留出空间
		return Math.max(...props.chartData.map(d => d.value)) * 1.2;
	});

	// 获取条形的宽度百分比
	const getBarWidth = (value : number) => {
		if (maxValue.value === 0) {
			return '0%';
		}
		const percent = (value / maxValue.value) * 100;
		return `${percent}%`;
	};

	// 获取条形的颜色
	const getBarColor = (index : number) => {
		return colors[index % colors.length];
	};
</script>

<style scoped>
	.bar-chart-container {
		width: 100%;
		/* [核心修改] 设置背景颜色以匹配LineChart */
		background-color: #faf8f5;
		border-radius: 16px;
		padding: 15px;
		box-sizing: border-box;
	}

	.chart-placeholder {
		display: flex;
		justify-content: center;
		align-items: center;
		color: #ced4da;
		font-size: 14px;
		padding: 20px 0;
		min-height: 100px;
	}

	.bar-item {
		margin-bottom: 12px;
	}

	.bar-item:last-child {
		margin-bottom: 0;
	}

	.bar-label {
		display: flex;
		align-items: center;
		font-size: 14px;
		margin-bottom: 6px;
	}

	.rank {
		font-style: italic;
		font-weight: bold;
		width: 20px;
		color: var(--accent-color);
	}

	.name {
		color: var(--text-primary);
	}

	.bar-wrapper {
		display: flex;
		align-items: center;
		position: relative;
		/* [核心修改] 调整条的高度，使其变细 */
		height: 16px;
		background-color: #f3e9e3;
		border-radius: 8px;
	}

	.bar {
		height: 100%;
		border-radius: 8px;
		transition: width 0.5s ease-in-out;
	}

	.value {
		position: absolute;
		left: 8px;
		font-size: 12px;
		color: white;
		font-weight: bold;
		text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2);
	}
</style>