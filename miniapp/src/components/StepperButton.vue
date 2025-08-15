<template>
	<view class="btn-stepper ripple-container" @touchstart="handleTouchStart" @touchend="handleTouchEnd"
		@touchcancel="handleTouchEnd">
		<slot></slot>
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	const emit = defineEmits(['touchstart', 'touchend']);
	const instance = getCurrentInstance();
	const ripples = ref<any[]>([]);

	const handleTouchStart = (event : any) => {
		emit('touchstart', event); // 将原生事件传递给父组件

		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.btn-stepper').boundingClientRect(rect => {
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

	const handleTouchEnd = (event : any) => {
		emit('touchend', event); // 将原生事件传递给父组件
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.btn-stepper {
		width: 30px;
		height: 30px;
		padding: 0;
		background-color: #f3e9e3;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		/* 添加水波纹容器样式 */
		position: relative;
		overflow: hidden;
		transform: translateZ(0);

		&::after {
			border: none;
		}
	}

	.ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>