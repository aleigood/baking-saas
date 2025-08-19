<template>
	<view v-if="isRendered" class="modal-overlay" :class="animationClass.overlay" @click="closeModal"
		@touchmove.stop.prevent="() => {}">
		<view class="modal-content" :style="{ width: width }"
			:class="[animationClass.content, { 'is-options-modal': noHeaderLine }]" @click.stop>
			<view class="modal-header" :class="{ 'no-line': noHeaderLine }" v-if="title">
				<h3 class="modal-title">{{ title }}</h3>
			</view>
			<slot></slot>
		</view>
	</view>
</template>

<script setup lang="ts">
	import {
		watch,
		ref,
		reactive,
		nextTick
	} from 'vue';

	const props = defineProps({
		visible: {
			type: Boolean,
			default: false,
		},
		title: {
			type: String,
			default: '',
		},
		width: {
			type: String,
			default: '80%',
		},
		noHeaderLine: {
			type: Boolean,
			default: false,
		}
	});

	const emit = defineEmits(['update:visible']);

	// [新增] isRendered 用于 v-if，控制组件是否真实存在于DOM中
	const isRendered = ref(false);
	// [新增] animationClass 用于控制进入和离开的动画类
	const animationClass = reactive({
		overlay: '',
		content: ''
	});
	// [新增] 用于管理动画结束后的DOM移除操作
	let animationTimer : ReturnType<typeof setTimeout> | null = null;


	watch(() => props.visible, (newValue) => {
		// 清除可能存在的上一个定时器
		if (animationTimer) {
			clearTimeout(animationTimer);
		}

		if (newValue) {
			// 1. 当需要显示时，立即渲染DOM
			isRendered.value = true;
			// 2. 使用 nextTick 确保DOM渲染完成后，再添加动画类以触发进入动画
			nextTick(() => {
				animationClass.overlay = 'fade-in';
				animationClass.content = 'slide-up';
			});
		} else {
			// 1. 当需要隐藏时，先应用离开动画
			animationClass.overlay = 'fade-out';
			animationClass.content = 'slide-down';
			// 2. 等待动画播放完毕（300ms）后，再从DOM中移除元素
			animationTimer = setTimeout(() => {
				isRendered.value = false;
			}, 300); // 这个时间必须和CSS动画的持续时间一致
		}
	});


	const closeModal = () => {
		emit('update:visible', false);
	};
</script>

<style scoped lang="scss">
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		justify-content: center;
		align-items: center;
		z-index: 99;
		/* [新增] 初始状态为透明 */
		opacity: 0;
	}

	.modal-content {
		background-color: white;
		border-radius: 20px;
		padding: 25px;
		box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
		max-height: 80vh;
		overflow-y: auto;
		/* [新增] 初始状态为透明且轻微向下偏移 */
		opacity: 0;
		transform: translateY(20px);
	}

	/* 恢复为移除水平内边距的策略，以确保通栏列表项的事件可以被完整触发 */
	.modal-content.is-options-modal {
		padding: 25px 0;
	}

	.modal-header {
		display: flex;
		justify-content: center;
		align-items: center;
		margin-bottom: 20px;
		padding-bottom: 15px;
		border-bottom: 1px solid var(--border-color);
		/* 当父级是 is-options-modal 时，其自身没有水平内边距，所以需要在这里补上 */
		padding-left: 25px;
		padding-right: 25px;
	}

	.modal-header.no-line {
		border-bottom: none;
		padding-bottom: 0;
		margin-bottom: 15px;
	}


	.modal-title {
		font-size: 18px;
		font-weight: 600;
		color: var(--text-primary);
	}

	/* [新增] CSS动画定义 */
	@keyframes fadeIn {
		from {
			opacity: 0;
		}

		to {
			opacity: 1;
		}
	}

	@keyframes fadeOut {
		from {
			opacity: 1;
		}

		to {
			opacity: 0;
		}
	}

	@keyframes slideUp {
		from {
			opacity: 0;
			transform: translateY(20px);
		}

		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes slideDown {
		from {
			opacity: 1;
			transform: translateY(0);
		}

		to {
			opacity: 0;
			transform: translateY(20px);
		}
	}

	/* [新增] 应用动画的类 */
	.modal-overlay.fade-in {
		animation: fadeIn 0.3s ease-in-out forwards;
	}

	.modal-overlay.fade-out {
		animation: fadeOut 0.3s ease-in-out forwards;
	}

	.modal-content.slide-up {
		animation: slideUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
	}

	.modal-content.slide-down {
		animation: slideDown 0.3s cubic-bezier(0.25, 0.1, 0.25, 1) forwards;
	}
</style>