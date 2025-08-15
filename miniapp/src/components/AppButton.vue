<template>
	<button class="btn ripple-container" :class="buttonClasses" :disabled="disabled || loading"
		@touchstart="handleTouchStart" @touchmove="handleTouchMove" @touchend="handleTouchEnd">

		<!-- 这个容器通过 visibility: hidden 来占据空间，以保持按钮尺寸在加载时不变 -->
		<view class="content-wrapper" :style="{ visibility: loading ? 'hidden' : 'visible' }">
			<slot></slot>
		</view>

		<!-- 加载状态的内容，使用绝对定位，因此不影响按钮布局 -->
		<view v-if="loading" class="loading-content-wrapper">
			<!-- 在加载时也显示 slot 内容，此时父组件应传入 "登录中..." 之类的文字 -->
			<slot></slot>
		</view>

		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
	</button>
</template>

<script setup lang="ts">
	import { ref, computed, getCurrentInstance } from 'vue';

	const props = defineProps({
		type: {
			type: String,
			default: 'primary', // primary, secondary, danger, dashed, text-link
		},
		size: {
			type: String,
			default: '', // sm, xs
		},
		fullWidth: {
			type: Boolean,
			default: false,
		},
		disabled: {
			type: Boolean,
			default: false,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['click']);
	const instance = getCurrentInstance();

	const buttonClasses = computed(() => ({
		'btn-primary': props.type === 'primary',
		'btn-secondary': props.type === 'secondary',
		'btn-danger': props.type === 'danger',
		'btn-dashed': props.type === 'dashed',
		'btn-text-link': props.type === 'text-link',
		'btn-sm': props.size === 'sm',
		'btn-xs': props.size === 'xs',
		'btn-full-width': props.fullWidth,
		'loading': props.loading,
	}));

	// 水波纹效果逻辑
	const ripples = ref<any[]>([]);
	const touchMoved = ref(false);

	const handleTouchStart = (event : any) => {
		if (props.disabled || props.loading) return;
		touchMoved.value = false;
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.btn').boundingClientRect(rect => {
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
		if (props.disabled || props.loading) return;
		if (!touchMoved.value) {
			event.preventDefault();
			emit('click');
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.btn {
		min-height: 50px;
		box-sizing: border-box;
		display: flex;
		justify-content: center;
		align-items: center;
		position: relative;

		&::after {
			border: none;
		}

		// [新增] 禁用状态样式
		&[disabled] {
			background-color: #f3e9e3 !important; // 使用淡色背景
			color: #b0a8a2 !important; // 使用更浅的文字颜色
			box-shadow: none !important;
			opacity: 1 !important;
			cursor: not-allowed;
		}

		&.btn-primary[disabled] {
			background-color: #f3e9e3 !important;
		}

	}

	.content-wrapper {
		display: flex;
		justify-content: center;
		align-items: center;
		width: 100%;
	}

	.loading-content-wrapper {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		display: flex;
		justify-content: center;
		align-items: center;
		gap: 8px;
	}

	/* [核心修改] 移除了 .loading-spinner 和 @keyframes spin 相关的所有样式 */

	.btn-primary.loading {
		background-color: #7d4f33;
		opacity: 1;
	}

	/* 水波纹颜色 */
	.ripple {
		background-color: rgba(255, 255, 255, 0.4);
	}

	.btn-secondary .ripple,
	.btn-dashed .ripple,
	.btn-text-link .ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>