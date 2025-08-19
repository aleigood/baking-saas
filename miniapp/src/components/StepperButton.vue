<template>
	<view class="btn-stepper ripple-container" @touchstart="handleTouchStart" @click="emit('click', $event)">
		<!-- 水波纹效果的容器 -->
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	const emit = defineEmits(['click']);

	// [新增] 水波纹效果逻辑
	const ripples = ref<any[]>([]);
	const instance = getCurrentInstance();
	const handleTouchStart = (event : TouchEvent) => {
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.ripple-container').boundingClientRect(rect => {
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
					if (ripples.value.length > 0) ripples.value.shift();
				}, 600);
			}
		}).exec();
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