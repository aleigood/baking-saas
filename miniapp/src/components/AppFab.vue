<template>
	<!-- 
    一个通用的、可复用的浮动操作按钮 (FAB) 组件。
    - 包含了 SVG 图标和水波纹点击效果。
    - 通过 v-if 控制显示。
    - 监听 click 事件。
  -->
	<view class="fab ripple-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
		@touchend="handleTouchEnd">
		<image class="fab-icon"
			src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E" />
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	// 定义组件可以触发的事件
	const emit = defineEmits(['click']);

	const ripples = ref<any[]>([]);
	const touchMoved = ref(false);
	const instance = getCurrentInstance();

	const handleTouchStart = (event : any) => {
		touchMoved.value = false;
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.fab').boundingClientRect(rect => {
			if (rect) {
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const size = Math.max(rect.width, rect.height) * 2;
				const newRipple = {
					id: Date.now(),
					style: {
						width: `${size}px`,
						height: `${size}px`,
						top: `${y - size / 2}px`,
						left: `${x - size / 2}px`,
					}
				};
				ripples.value.push(newRipple);
				setTimeout(() => {
					if (ripples.value.length > 0) {
						ripples.value.shift();
					}
				}, 600);
			}
		}).exec();
	};

	const handleTouchMove = () => {
		touchMoved.value = true;
	};

	const handleTouchEnd = (event : Event) => {
		if (!touchMoved.value) {
			// [核心修改] 传入事件对象并阻止默认行为，以防止移动端上的“幽灵点击”问题。
			event.preventDefault();
			emit('click');
		}
	};
</script>

<style scoped lang="scss">
	// 样式从全局 common.scss 继承
	@import '@/styles/common.scss';

	/* 为FAB定制水波纹颜色，因为背景是深色，所以水波纹用亮色 */
	.ripple {
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>