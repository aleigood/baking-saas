<template>
	<transition name="toast-fade">
		<view v-if="toastStore.isVisible" class="toast-wrapper">
			<view class="toast-content" :class="toastStore.type">
				{{ toastStore.message }}
			</view>
		</view>
	</transition>
</template>

<script setup lang="ts">
	import { useToastStore } from '@/store/toast';
	const toastStore = useToastStore();
</script>

<style scoped lang="scss">
	.toast-wrapper {
		position: fixed;
		bottom: 80px;
		left: 50%;
		transform: translateX(-50%);
		z-index: 1000;
		pointer-events: none;
		display: flex;
		/* 新增，用于内容居中 */
		justify-content: center;
		/* 新增 */
		width: 100%;
	}

	.toast-content {
		padding: 10px 20px;
		border-radius: 20px;
		font-size: 14px;
		color: white;
		background-color: rgba(0, 0, 0, 0.7);
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		text-align: center;
		/* [修改] 调整宽度 */
		min-width: 150px;
		max-width: 80vw;
		box-sizing: border-box;
	}

	/* [修改] 调整成功和错误的颜色 */
	.toast-content.success {
		background-color: #6A994E;
		/* 一个更柔和的绿色 */
	}

	.toast-content.error {
		background-color: #BC4749;
		/* 一个不那么刺眼的红色 */
	}

	/* Vue transition classes */
	.toast-fade-enter-active,
	.toast-fade-leave-active {
		transition: all 0.3s ease;
	}

	.toast-fade-enter-from,
	.toast-fade-leave-to {
		opacity: 0;
		transform: translate(-50%, 20px);
	}
</style>