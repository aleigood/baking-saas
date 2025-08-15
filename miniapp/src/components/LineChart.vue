<template>
	<view class="chart-container">
		<view v-if="!chartData || chartData.length <= 1" class="chart-placeholder">
			需要至少两次记录才能生成曲线
		</view>
		<canvas v-else :id="canvasId" :canvas-id="canvasId" class="chart-canvas"></canvas>
	</view>
</template>

<script setup lang="ts">
	import { ref, onMounted, watch, nextTick, getCurrentInstance } from 'vue';

	// 定义组件的属性接口
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

	// --- Canvas上下文和尺寸 ---
	const instance = getCurrentInstance();
	// 创建一个唯一的canvasId，避免在同一页面多次使用组件时冲突
	const canvasId = `line-chart-${Date.now()}-${Math.random().toString().slice(2)}`;
	let ctx : UniApp.CanvasContext | null = null;
	let canvasWidth = 0;
	let canvasHeight = 0;

	// --- 监听和生命周期钩子 ---

	// 监听chartData的变化，数据更新时重绘图表
	watch(() => props.chartData, () => {
		if (ctx) {
			drawChart();
		}
	}, { deep: true });

	// 组件挂载后初始化图表
	onMounted(() => {
		initChart();
	});

	// --- 方法 ---

	/**
	 * @description 初始化Canvas，获取其尺寸和绘图上下文
	 */
	const initChart = () => {
		nextTick(() => {
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

	/**
	 * @description 绘制图表的主函数
	 */
	const drawChart = () => {
		if (!ctx || !props.chartData || props.chartData.length <= 1) {
			return;
		}

		// 清空画布
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// --- 数据坐标转换 ---
		const padding = { top: 30, right: 20, bottom: 20, left: 20 };
		const data = props.chartData.map(d => d.cost);
		const yMin = Math.min(...data);
		const yMax = Math.max(...data);

		const range = yMax - yMin;
		// 计算Y轴的显示范围，上下留出20%的缓冲空间
		const yRange = {
			min: Math.max(0, yMin - range * 0.2),
			max: yMax + range * 0.2,
		};
		// 如果所有数据都相同，防止除零错误
		if (yRange.max === yRange.min) {
			yRange.max += 1;
		}

		// 将原始数据转换为Canvas上的坐标点
		const points = data.map((value, index) => {
			const x = padding.left + (index / (data.length - 1)) * (canvasWidth - padding.left - padding.right);
			const y = canvasHeight - padding.bottom - ((value - yRange.min) / (yRange.max - yRange.min)) * (canvasHeight - padding.top - padding.bottom);
			return { x, y, value };
		});

		// --- 核心绘图逻辑 ---

		// 绘制平滑曲线和下方的填充区域
		drawSpline(points, true, padding); // [核心修正] 传入padding对象
		drawSpline(points, false, padding); // [核心修正] 传入padding对象

		// 绘制数据点和标签文本
		points.forEach(p => {
			// 绘制数据点圆圈
			ctx!.beginPath();
			ctx!.arc(p.x, p.y, 4, 0, 2 * Math.PI);
			ctx!.setFillStyle('#8c5a3b');
			ctx!.fill();

			// 绘制数据点上方的文本
			const text = `${props.unitPrefix}${p.value.toFixed(1)}${props.unitSuffix}`;
			ctx!.setFontSize(12);
			ctx!.setFillStyle('#8c5a3b');
			ctx!.setTextAlign('center');
			ctx!.fillText(text, p.x, p.y - 10);
		});

		// 将所有绘制操作渲染到Canvas上
		ctx.draw();
	};

	/**
	 * @description 使用Catmull-Rom样条曲线算法绘制平滑曲线
	 * @param {Array} points - 数据点的坐标数组
	 * @param {boolean} isFill - 是否为填充模式
	 * @param {object} padding - 画布的内边距
	 */
	const drawSpline = (points : { x : number, y : number }[], isFill : boolean, padding : { top : number, right : number, bottom : number, left : number }) => {
		if (!ctx || points.length < 2) return;

		ctx.beginPath();

		// 如果是填充模式，路径从左下角开始
		if (isFill) {
			ctx.moveTo(points[0].x, canvasHeight - padding.bottom);
			ctx.lineTo(points[0].x, points[0].y);
		} else {
			ctx.moveTo(points[0].x, points[0].y);
		}

		// [核心修改] 张力系数，0表示直线，1表示最圆滑。增加该值使曲线更平滑。
		const tension = 1;

		for (let i = 0; i < points.length - 1; i++) {
			// 获取当前点、前后点用于计算控制点
			const p0 = i > 0 ? points[i - 1] : points[0];
			const p1 = points[i];
			const p2 = points[i + 1];
			const p3 = i < points.length - 2 ? points[i + 2] : p2;

			// 计算Catmull-Rom样条曲线的两个控制点
			const cp1x = p1.x + (p2.x - p0.x) / 6 * tension;
			const cp1y = p1.y + (p2.y - p0.y) / 6 * tension;
			const cp2x = p2.x - (p3.x - p1.x) / 6 * tension;
			const cp2y = p2.y - (p3.y - p1.y) / 6 * tension;

			// 使用贝塞尔曲线连接点
			ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
		}

		if (isFill) {
			// 填充模式下，封闭路径到右下角
			ctx.lineTo(points[points.length - 1].x, canvasHeight - padding.bottom);
			ctx.closePath();
			const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
			gradient.addColorStop(0, 'rgba(140, 90, 59, 0.3)');
			gradient.addColorStop(1, 'rgba(140, 90, 59, 0)');
			ctx.setFillStyle(gradient);
			ctx.fill();
		} else {
			// 线条模式下，直接描边
			ctx.setStrokeStyle('#8c5a3b');
			ctx.setLineWidth(2);
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