<template>
	<view class="page-header" :style="headerStyle">
		<view class="header-content" :style="contentStyle">
			<view class="back-btn ripple-container" @touchstart="handleTouchStart" @click="handleClick">
				<!-- 水波纹效果的容器 -->
				<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
				&#10094;
			</view>
			<h2 class="detail-title">{{ title }}</h2>
			<view class="actions">
				<slot></slot>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, getCurrentInstance } from 'vue';
	import { useSystemStore } from '@/store/system';

	defineProps({
		title: {
			type: String,
			required: true,
		},
	});

	const systemStore = useSystemStore();

	const headerStyle = computed(() => ({
		height: `${systemStore.headerHeight}px`
	}));

	const contentStyle = computed(() => ({
		top: `${systemStore.navBarContentTop}px`,
		height: `${systemStore.navBarHeight}px`
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

	const navigateBack = () => {
		uni.navigateBack();
	};

	// [体验优化] 新增 handleClick 方法以延迟事件触发
	const handleClick = () => {
		// [体验优化] 增加 300ms 延迟，确保水波纹动画可见后再执行点击操作
		setTimeout(() => {
			navigateBack();
		}, 300);
	};
</script>

<style scoped lang="scss">
	.back-btn {
		font-size: 20px;
		cursor: pointer;
		margin-right: 10px;
		color: var(--text-secondary);
		position: relative;
		overflow: hidden;
		width: 40px;
		height: 40px;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		transform: translateZ(0);
		padding: 0;
		-webkit-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;

		&::after {
			display: none;
		}
	}

	.detail-title {
		font-size: 20px;
		font-weight: 600;
		flex: 1;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.back-btn .ripple {
		background-color: rgba(0, 0, 0, 0.08);
	}

	.actions {
		display: flex;
		align-items: center;
	}
</style>