<template>
	<view class="chart-container">
		<view v-if="!chartData || chartData.length === 0" class="chart-placeholder">
			暂无成本构成数据
		</view>
		<canvas v-else :id="canvasId" :canvas-id="canvasId" class="chart-canvas"></canvas>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch, nextTick, getCurrentInstance } from 'vue';

	const props = defineProps({
		chartData: {
			type: Array as () => { name : string, value : number }[],
			default: () => [],
		},
	});

	const instance = getCurrentInstance();
	const canvasId = `pie-chart-${Date.now()}-${Math.random().toString().slice(2)}`;
	let ctx : UniApp.CanvasContext | null = null;
	let canvasWidth = 0;
	let canvasHeight = 0;

	// 监听数据变化，重新绘制图表
	watch(() => props.chartData, () => {
		if (ctx) {
			drawChart();
		}
	}, { deep: true });

	onMounted(() => {
		initChart();
	});

	// 初始化 Canvas
	const initChart = () => {
		nextTick(() => {
			// [核心修正] 使用 uni.createCanvasContext 获取绘图上下文
			ctx = uni.createCanvasContext(canvasId, instance);

			const query = uni.createSelectorQuery().in(instance);
			query.select(`#${canvasId}`)
				.boundingClientRect((res) => {
					if (res) {
						canvasWidth = res.width as number;
						canvasHeight = res.height as number;
						drawChart();
					}
				}).exec();
		});
	};

	// 绘制图表的核心函数
	const drawChart = () => {
		if (!ctx || !props.chartData || props.chartData.length === 0) {
			return;
		}

		// 清空画布
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const colors = [
			'#8c5a3b', '#d4a373', '#a98467', '#c2956f',
			'#e6b89c', '#7b4f32', '#b38a68', '#d9ae94'
		];

		const displayData = props.chartData;

		const total = displayData.reduce((sum, d) => sum + d.value, 0);
		if (total === 0) return;

		// 图表参数
		const centerX = canvasWidth / 2;
		const centerY = canvasHeight / 2;
		const radius = Math.min(canvasWidth, canvasHeight) / 2 * 0.65;
		const innerRadius = radius * 0.5;

		let startAngle = -0.5 * Math.PI;

		const labelPositions : { y : number, height : number }[] = [];
		const LABEL_PADDING = 15; // 标签之间的最小垂直间距

		const labelsToDraw = displayData.map((item, index) => {
			const sliceAngle = (item.value / total) * 2 * Math.PI;
			const endAngle = startAngle + sliceAngle;
			const midAngle = startAngle + sliceAngle / 2;

			// 绘制扇区
			ctx!.beginPath();
			ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
			ctx!.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
			ctx!.closePath();
			ctx!.setFillStyle(colors[index % colors.length]);
			ctx!.fill();

			startAngle = endAngle;

			// 收集标签信息
			return {
				item,
				index,
				midAngle,
			};
		});

		// 绘制标签和引线
		labelsToDraw.forEach(({ item, index, midAngle }) => {
			const isRightSide = midAngle > -0.5 * Math.PI && midAngle < 0.5 * Math.PI;

			const lineStartX = centerX + Math.cos(midAngle) * radius;
			const lineStartY = centerY + Math.sin(midAngle) * radius;
			const lineMidX = centerX + Math.cos(midAngle) * (radius + 5);
			const lineMidY = centerY + Math.sin(midAngle) * (radius + 5);

			const lineHeight = 14;
			let finalLabelY = lineMidY;

			// 检查并调整标签的垂直位置以避免重叠
			let isOverlapping = true;
			while (isOverlapping) {
				isOverlapping = false;
				for (const pos of labelPositions) {
					if (Math.abs(finalLabelY - pos.y) < pos.height + 5) { // 5px额外的间距
						isOverlapping = true;
						finalLabelY += (finalLabelY > pos.y) ? (pos.height + 5) : -(pos.height + 5);
						break;
					}
				}
			}
			labelPositions.push({ y: finalLabelY, height: lineHeight });

			const percentage = ((item.value / total) * 100).toFixed(1);
			const text = `${item.name} ${percentage}%`;

			const textWidth = ctx!.measureText(text).width;
			// 确保文本不会超出画布边界
			const textX = isRightSide ? Math.min(canvasWidth - 5, lineMidX + 10) : Math.max(5, lineMidX - 10 - textWidth);

			// 绘制引线
			ctx!.beginPath();
			ctx!.moveTo(lineStartX, lineStartY);
			ctx!.lineTo(isRightSide ? lineMidX + 5 : lineMidX - 5, finalLabelY);
			ctx!.setStrokeStyle(colors[index % colors.length]);
			ctx!.stroke();

			// 绘制文本
			ctx!.setFillStyle(colors[index % colors.length]);
			ctx!.setFontSize(12);
			ctx!.setTextAlign(isRightSide ? 'left' : 'right');
			ctx!.setTextBaseline('middle');
			ctx!.fillText(text, isRightSide ? lineMidX + 5 : lineMidX - 5, finalLabelY);
		});

		ctx.draw();
	};
</script>

<style scoped>
	.chart-container {
		width: 100%;
		height: 180px;
		position: relative;
		background-color: #faf8f5;
		border-radius: 16px;
	}

	.chart-canvas {
		width: 100%;
		height: 100%;
	}

	.chart-placeholder {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		border-radius: 16px;
		display: flex;
		justify-content: center;
		align-items: center;
		color: #ced4da;
		font-size: 14px;
	}
</style>