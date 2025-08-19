<template>
	<view class="ripple-container" :class="fabClasses" @touchstart="handleTouchStart" @click="handleClick">
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
		<image class="fab-icon" src="/static/icons/fab-add.svg" />
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance, computed } from 'vue';

	// [兼容性修复] 新增 noTabBar prop，用于从组件内部控制样式
	const props = defineProps({
		noTabBar: {
			type: Boolean,
			default: false
		}
	});

	const emit = defineEmits(['click']);

	// [兼容性修复] 使用计算属性动态生成class列表
	const fabClasses = computed(() => ({
		'fab': true,
		'fab-no-tab-bar': props.noTabBar
	}));


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

	// [体验优化] 新增 handleClick 方法以延迟事件触发
	const handleClick = (event : Event) => {
		// [体验优化] 增加 300ms 延迟，确保水波纹动画可见后再执行点击操作
		setTimeout(() => {
			emit('click', event);
		}, 300);
	};
</script>

<style scoped lang="scss">
	/* [CSS重构] 将 FAB 相关的样式从 common.scss 移入组件内部 */
	.fab {
		position: fixed;
		bottom: calc(85px + constant(safe-area-inset-bottom));
		bottom: calc(85px + env(safe-area-inset-bottom));
		right: 20px;
		width: 56px;
		height: 56px;
		background-color: var(--primary-color);
		color: white;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 6px 20px rgba(140, 90, 59, 0.3);
		z-index: 20;
		transform: translateZ(0);
		overflow: hidden;
	}

	.fab.fab-no-tab-bar {
		bottom: calc(30px + constant(safe-area-inset-bottom));
		bottom: calc(30px + env(safe-area-inset-bottom));
	}

	.fab-icon {
		width: 28px;
		height: 28px;
		z-index: 1;
	}

	/* [CSS重构] 水波纹效果的样式也一并移入 */
	.ripple {
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>