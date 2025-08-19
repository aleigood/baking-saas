<template>
	<view class="filter-tab ripple-container" :class="{ active: active }" @touchstart="handleTouchStart"
		@click="emit('click', $event)">
		<!-- 水波纹效果的容器 -->
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	defineProps({
		active: {
			type: Boolean,
			default: false,
		},
	});

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

	.filter-tab {
		padding: 8px 12px;
		border-radius: 20px;
		background: #f3e9e3;
		color: var(--text-secondary);
		font-size: 14px;
		white-space: nowrap;
		position: relative;
		overflow: hidden;
		transform: translateZ(0);
	}

	.filter-tab.active {
		background: var(--primary-color);
		color: white;
	}

	/* [修改] 样式现在直接作用于组件内的 .ripple */
	.ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.filter-tab.active .ripple {
		background-color: rgba(255, 255, 255, 0.3);
	}
</style>