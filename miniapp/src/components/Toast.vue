<template>
	<view v-show="toastStore.isVisible" class="toast-wrapper" :class="animationClass">
		<view class="toast-content" :class="toastStore.type">
			{{ toastStore.message }}
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, watch, nextTick } from 'vue';
	import { useToastStore } from '@/store/toast';
	const toastStore = useToastStore();

	// [修改] isRendered 不再需要，v-show 直接绑定 store 状态
	// const isRendered = ref(false); 

	// animationClass 用于控制进入和离开的动画类
	const animationClass = ref('');

	// [修改] animationTimer 的作用简化，不再需要移除DOM
	let animationTimer : ReturnType<typeof setTimeout> | null = null;

	watch(() => toastStore.isVisible, (newValue) => {
		if (animationTimer) {
			clearTimeout(animationTimer);
		}

		if (newValue) {
			// [修改] 由于元素一直存在于DOM中，直接应用进入动画即可
			animationClass.value = 'toast-fade-in';
		} else {
			// [修改] 当需要隐藏时，应用离开动画。v-show 会在动画结束后自动添加 display: none
			animationClass.value = 'toast-fade-out';
		}
	});
</script>

<style scoped lang="scss">
	.toast-wrapper {
		position: fixed;
		bottom: 80px;
		left: 50%;
		/* [修改] 动画会处理transform，这里只负责水平居中 */
		transform: translateX(-50%);
		z-index: 1000;
		pointer-events: none;
		display: flex;
		justify-content: center;
		width: 100%;
		opacity: 0;
	}

	.toast-content {
		padding: 10px 20px;
		border-radius: 20px;
		font-size: 14px;
		color: #ffffff;
		background-color: rgba(0, 0, 0, 0.7);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		text-align: center;
		min-width: 150px;
		max-width: 80vw;
		box-sizing: border-box;
	}

	.toast-content.success {
		background-color: rgba(140, 90, 59, 0.8);
	}

	.toast-content.error {
		background-color: rgba(140, 90, 59, 0.8);
	}

	/* CSS动画定义 */
	@keyframes fadeIn {
		from {
			opacity: 0;
			/* [修改] 动画的transform需要带上translateX以保持居中 */
			transform: translate(-50%, 20px);
		}

		to {
			opacity: 1;
			transform: translate(-50%, 0);
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
			transform: translate(-50%, 0);
		}

		to {
			opacity: 0;
			transform: translate(-50%, 20px);
		}
	}

	/* 应用动画的类 */
	.toast-fade-in {
		/* [修改] 动画时长0.3s，缓动函数ease，并使用forwards保持动画结束状态 */
		animation: fadeIn 0.3s ease forwards;
	}

	.toast-fade-out {
		animation: fadeOut 0.3s ease forwards;
	}
</style>