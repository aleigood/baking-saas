<template>
	<view class="animated-tabs-container">
		<view class="tabs-wrapper" id="tabs-wrapper">
			<view v-for="(tab, index) in tabs" :key="tab.key" :id="'tab-' + tab.key" class="tab-item"
				:class="{ active: modelValue === tab.key }" @click="handleClick(tab.key, index)">
				{{ tab.label }}
			</view>
			<view class="underline" :style="underlineStyle"></view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, watch, nextTick, onMounted, getCurrentInstance } from 'vue';

	// 定义组件的 props 和 emits
	const props = defineProps<{
		tabs : { key : string; label : string }[];
		modelValue : string;
	}>();
	const emit = defineEmits(['update:modelValue']);

	const instance = getCurrentInstance();
	const underlineStyle = ref({
		width: '0px',
		transform: 'translateX(0px)',
		transition: 'none', // 初始无动画
	});
	const tabElementsInfo = ref<any[]>([]);
	// 存储父容器的位置信息
	let wrapperLeft = 0;

	// 获取所有 tab 元素的尺寸和位置信息
	const getTabsInfo = () => {
		const query = uni.createSelectorQuery().in(instance);
		// 同时获取父容器和所有子项的位置
		query.select('#tabs-wrapper').boundingClientRect();
		query.selectAll('.tab-item').boundingClientRect();

		query.exec(data => {
			if (data && data[0] && Array.isArray(data[1]) && data[1].length > 0) {
				wrapperLeft = data[0].left; // 存储父容器的左侧偏移
				tabElementsInfo.value = data[1];
				// 初始化时立即定位下划线，无动画
				updateUnderline(props.modelValue, props.modelValue, true);
			}
		});
	};

	// 页面挂载后获取元素信息
	onMounted(() => {
		// 确保 DOM 渲染完毕
		setTimeout(getTabsInfo, 150);
	});

	// 监听 activeTab 的变化来驱动下划线动画
	watch(() => props.modelValue, (newValue, oldValue) => {
		if (tabElementsInfo.value.length > 0) {
			updateUnderline(newValue, oldValue);
		}
	});

	// 核心动画逻辑
	const updateUnderline = (newKey : string, oldKey : string, immediate = false) => {
		const newIndex = props.tabs.findIndex(t => t.key === newKey);
		const oldIndex = props.tabs.findIndex(t => t.key === oldKey);

		if (newIndex === -1) return;

		const newTabInfo = tabElementsInfo.value[newIndex];
		if (!newTabInfo) return;

		// 计算相对于父容器的正确 left 值
		const newLeft = newTabInfo.left - wrapperLeft;

		if (immediate) {
			// 立即定位，无动画
			underlineStyle.value = {
				width: `${newTabInfo.width}px`,
				transform: `translateX(${newLeft}px)`,
				transition: 'none',
			};
			// 延迟一帧后恢复动画，防止影响后续的切换
			nextTick(() => {
				underlineStyle.value.transition = 'transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55), width 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)';
			});
			return;
		}

		// --- 实现弹性滑动动画 ---
		const oldTabInfo = tabElementsInfo.value[oldIndex];
		const isMovingRight = newIndex > oldIndex;

		// 所有 left 值的计算都需要减去父容器的 left
		const oldLeft = oldTabInfo.left - wrapperLeft;

		// 阶段1: 拉伸阶段
		const stretchWidth = isMovingRight
			? (newLeft + newTabInfo.width) - oldLeft
			: (oldLeft + oldTabInfo.width) - newLeft;
		const stretchLeft = isMovingRight ? oldLeft : newLeft;

		underlineStyle.value = {
			width: `${stretchWidth}px`,
			transform: `translateX(${stretchLeft}px)`,
			transition: 'transform 0.15s ease-out, width 0.15s ease-out',
		};


		// 阶段2: 收缩和回弹阶段
		setTimeout(() => {
			underlineStyle.value = {
				width: `${newTabInfo.width}px`,
				transform: `translateX(${newLeft}px)`,
				transition: 'transform 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55), width 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
			};
		}, 120);
	};

	const handleClick = (key : string, index : number) => {
		emit('update:modelValue', key);
	};
</script>

<style scoped lang="scss">
	.animated-tabs-container {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 20px;
	}

	.tabs-wrapper {
		position: relative;
		display: inline-flex;
		gap: 20px;
		padding: 5px 0;
	}

	.tab-item {
		font-size: 14px;
		color: var(--text-secondary);
		padding: 8px 0;
		cursor: pointer;
		transition: color 0.3s ease-in-out;
		z-index: 1;
		/* [兼容性修复] 移除微信小程序和其他 webkit 内核浏览器中的点击高亮效果 */
		-webkit-tap-highlight-color: transparent;

		&.active {
			color: var(--primary-color);
			font-weight: 600;
		}
	}

	.underline {
		position: absolute;
		bottom: 8px;
		height: 3px;
		background-color: var(--primary-color);
		border-radius: 2px;
		z-index: 0;
	}
</style>