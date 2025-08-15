<template>
	<view class="filter-tab ripple-container" :class="{ active: active }" @touchstart="handleTouchStart"
		@touchmove="handleTouchMove" @touchend="handleTouchEnd">
		<slot></slot>
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
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
	const instance = getCurrentInstance();
	const ripples = ref<any[]>([]);
	const touchMoved = ref(false);

	const handleTouchStart = (event : any) => {
		touchMoved.value = false;
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.filter-tab').boundingClientRect(rect => {
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

	const handleTouchEnd = () => {
		if (!touchMoved.value) {
			emit('click');
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.filter-tab {
		padding: 8px 12px;
		/* [样式调整] 减小水平内边距 */
		border-radius: 20px;
		background: #f3e9e3;
		color: var(--text-secondary);
		/* [修改] 调整字体大小 */
		font-size: 14px;
		white-space: nowrap;
		/* [样式调整] 防止文字换行 */
		/* 添加水波纹容器样式 */
		position: relative;
		overflow: hidden;
		transform: translateZ(0);
	}

	.filter-tab.active {
		background: var(--primary-color);
		color: white;
	}

	.ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.filter-tab.active .ripple {
		background-color: rgba(255, 255, 255, 0.3);
	}
</style>