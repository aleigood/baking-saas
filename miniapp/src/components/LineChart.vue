<template>
	<view class="chart-container">
		<view v-if="!chartData || chartData.length <= 1" class="chart-placeholder">
			需要至少两次记录才能生成曲线
		</view>
		<!-- [核心修改] 增加 type="2d" 属性以启用新的 Canvas 2D 接口 -->
		<canvas v-else type="2d" :id="canvasId" :canvas-id="canvasId" class="chart-canvas"></canvas>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch, nextTick, getCurrentInstance } from 'vue';

	const props = defineProps({
		chartData: {
			type: Array as () => { cost : number }[],
			default: () => [],
		},
		unitPrefix: {
			type: String,
			default: '¥',
		},
		unitSuffix: {
			type: String,
			default: '',
		},
	});

	const instance = getCurrentInstance();
	const canvasId = `line-chart-${Date.now()}-${Math.random().toString().slice(2)}`;
	// [核心修改] ctx 类型变更为 CanvasRenderingContext2D
	let ctx : CanvasRenderingContext2D | null = null;
	let canvasWidth = 0;
	let canvasHeight = 0;

	// [核心修改] canvas 节点引用
	let canvas : any = null;

	watch(() => props.chartData, () => {
		if (ctx && canvas) {
			drawChart();
		}
	}, { deep: true });

	onMounted(() => {
		setTimeout(initChart, 150);
	});

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

	const drawChart = () => {
		if (!ctx || !props.chartData || props.chartData.length <= 1) {
			return;
		}

		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		const padding = { top: 30, right: 20, bottom: 20, left: 20 };
		const data = props.chartData.map(d => d.cost);
		const yMin = Math.min(...data);
		const yMax = Math.max(...data);

		const range = yMax - yMin;
		const yRange = {
			min: Math.max(0, yMin - range * 0.2),
			max: yMax + range * 0.2,
		};
		if (yRange.max === yRange.min) {
			yRange.max += 1;
		}

		const points = data.map((value, index) => {
			const x = padding.left + (index / (data.length - 1)) * (canvasWidth - padding.left - padding.right);
			const y = canvasHeight - padding.bottom - ((value - yRange.min) / (yRange.max - yRange.min)) * (canvasHeight - padding.top - padding.bottom);
			return { x, y, value };
		});

		drawSpline(points, true, padding);
		drawSpline(points, false, padding);

		points.forEach(p => {
			// [核心修改] 使用新的 Canvas 2D API
			ctx!.beginPath();
			ctx!.arc(p.x, p.y, 4, 0, 2 * Math.PI);
			ctx!.fillStyle = '#8c5a3b';
			ctx!.fill();

			const text = `${props.unitPrefix}${p.value.toFixed(1)}${props.unitSuffix}`;
			ctx!.font = '12px sans-serif';
			ctx!.fillStyle = '#8c5a3b';
			ctx!.textAlign = 'center';
			ctx!.fillText(text, p.x, p.y - 10);
		});

		// [核心修改] 新版 API 无需 draw()
	};

	const drawSpline = (points : { x : number, y : number }[], isFill : boolean, padding : { top : number, right : number, bottom : number, left : number }) => {
		if (!ctx || points.length < 2) return;

		ctx.beginPath();

		if (isFill) {
			ctx.moveTo(points[0].x, canvasHeight - padding.bottom);
			ctx.lineTo(points[0].x, points[0].y);
		} else {
			ctx.moveTo(points[0].x, points[0].y);
		}

		const tension = 1;

		for (let i = 0; i < points.length - 1; i++) {
			const p0 = i > 0 ? points[i - 1] : points[0];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = i < points.length - 2 ? points[i + 2] : p2;

			const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
			const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
			const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
			const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
		}

		if (isFill) {
			ctx.lineTo(points[points.length - 1].x, canvasHeight - padding.bottom);
			ctx.closePath();
			const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
			gradient.addColorStop(0, 'rgba(140, 90, 59, 0.3)');
			gradient.addColorStop(1, 'rgba(140, 90, 59, 0)');
			ctx.fillStyle = gradient;
			ctx.fill();
		} else {
			ctx.strokeStyle = '#8c5a3b';
			ctx.lineWidth = 2;
			ctx.stroke();
		}
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