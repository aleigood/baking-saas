<template>
	<view class="chart-container">
		<view v-if="!chartData || chartData.length === 0" class="chart-placeholder">
			暂无成本构成数据
		</view>
		<!-- [核心修改] 增加 type="2d" 属性以启用新的 Canvas 2D 接口 -->
		<canvas v-else type="2d" :id="canvasId" :canvas-id="canvasId" class="chart-canvas"></canvas>
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
	// [核心修改] ctx 类型变更为 CanvasRenderingContext2D
	let ctx : CanvasRenderingContext2D | null = null;
	let canvasWidth = 0;
	let canvasHeight = 0;

	watch(() => props.chartData, () => {
		// [核心修改] 确保 canvas 和 context 都已初始化
		if (ctx && canvas) {
			drawChart();
		}
	}, { deep: true });

	onMounted(() => {
		// 延迟初始化以确保 canvas 元素已渲染
		setTimeout(initChart, 150);
	});

	// [核心修改] canvas 节点引用
	let canvas : any = null;

	// 初始化 Canvas
	const initChart = () => {
		nextTick(() => {
			const query = uni.createSelectorQuery().in(instance);
			query.select(`#${canvasId}`)
				.fields({ node: true, size: true }) // [核心修改] 获取 node 节点
				.exec((res) => {
					if (res && res[0] && res[0].node) {
						canvas = res[0].node;
						ctx = canvas.getContext('2d');

						// [核心修改] 使用条件编译，仅在小程序端进行高分屏适配
						// #ifdef MP-WEIXIN
						const dpr = uni.getWindowInfo().pixelRatio;
						canvas.width = res[0].width * dpr;
						canvas.height = res[0].height * dpr;
						ctx!.scale(dpr, dpr);
						// #endif

						// [核心修改] 在非小程序端，直接使用CSS尺寸作为绘图尺寸
						// #ifndef MP-WEIXIN
						canvas.width = res[0].width;
						canvas.height = res[0].height;
						// #endif

						canvasWidth = res[0].width;
						canvasHeight = res[0].height;
						drawChart();
					}
				});
		});
	};

	// 绘制图表的核心函数
	const drawChart = () => {
		if (!ctx || !props.chartData || props.chartData.length === 0) {
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const colors = [
			'#8c5a3b', '#d4a373', '#a98467', '#c2956f',
			'#e6b89c', '#7b4f32', '#b38a68', '#d9ae94'
		];

		const displayData = props.chartData;

		const total = displayData.reduce((sum, d) => sum + d.value, 0);
		if (total === 0) return;

		const centerX = canvasWidth / 2;
		const centerY = canvasHeight / 2;
		const radius = Math.min(canvasWidth, canvasHeight) / 2 * 0.65;
		const innerRadius = radius * 0.5;

		let startAngle = -0.5 * Math.PI;

		const labelPositions : { y : number, height : number }[] = [];

		const labelsToDraw = displayData.map((item, index) => {
			const sliceAngle = (item.value / total) * 2 * Math.PI;
			const endAngle = startAngle + sliceAngle;
			const midAngle = startAngle + sliceAngle / 2;

			// [核心修改] 使用新的 Canvas 2D API
			ctx!.beginPath();
			ctx!.arc(centerX, centerY, radius, startAngle, endAngle);
			ctx!.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
			ctx!.closePath();
			ctx!.fillStyle = colors[index % colors.length];
			ctx!.fill();

			startAngle = endAngle;

			return { item, index, midAngle };
		});

		labelsToDraw.forEach(({ item, index, midAngle }) => {
			const isRightSide = midAngle > -0.5 * Math.PI && midAngle < 0.5 * Math.PI;

			const lineStartX = centerX + Math.cos(midAngle) * radius;
			const lineStartY = centerY + Math.sin(midAngle) * radius;
			const lineMidX = centerX + Math.cos(midAngle) * (radius + 5);
			const lineMidY = centerY + Math.sin(midAngle) * (radius + 5);

			const lineHeight = 14;
			let finalLabelY = lineMidY;

			let isOverlapping = true;
			while (isOverlapping) {
				isOverlapping = false;
				for (const pos of labelPositions) {
					if (Math.abs(finalLabelY - pos.y) < pos.height + 5) {
						isOverlapping = true;
						finalLabelY += (finalLabelY > pos.y) ? (pos.height + 5) : -(pos.height + 5);
						break;
					}
				}
			}
			labelPositions.push({ y: finalLabelY, height: lineHeight });

			const percentage = ((item.value / total) * 100).toFixed(1);
			const text = `${item.name} ${percentage}%`;

			// [核心修改] 使用新的 Canvas 2D API
			ctx!.beginPath();
			ctx!.moveTo(lineStartX, lineStartY);
			ctx!.lineTo(isRightSide ? lineMidX + 5 : lineMidX - 5, finalLabelY);
			ctx!.strokeStyle = colors[index % colors.length];
			ctx!.stroke();

			ctx!.fillStyle = colors[index % colors.length];
			ctx!.font = '12px sans-serif';
			ctx!.textAlign = isRightSide ? 'left' : 'right';
			ctx!.textBaseline = 'middle';
			ctx!.fillText(text, isRightSide ? lineMidX + 5 : lineMidX - 5, finalLabelY);
		});

		// [核心修改] 新版 API 无需 draw()
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