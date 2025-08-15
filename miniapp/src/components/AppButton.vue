<template>
	<button class="btn" :class="buttonClasses" :disabled="disabled || loading" v-ripple @click="handleClick">

		<!-- 这个容器通过 visibility: hidden 来占据空间，以保持按钮尺寸在加载时不变 -->
		<view class="content-wrapper" :style="{ visibility: loading ? 'hidden' : 'visible' }">
			<slot></slot>
		</view>

		<!-- 加载状态的内容，使用绝对定位，因此不影响按钮布局 -->
		<view v-if="loading" class="loading-content-wrapper">
			<slot></slot>
		</view>
	</button>
</template>

<script setup lang="ts">
	import { computed } from 'vue';

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

	const handleClick = (event : Event) => {
		if (props.disabled || props.loading) return;
		emit('click', event);
	}
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
		/* [新增] 添加 overflow: hidden 以约束水波纹 */
		overflow: hidden;
		transform: translateZ(0);
		/* 开启硬件加速，优化动画性能 */

		&::after {
			border: none;
		}

		&[disabled] {
			background-color: #f3e9e3 !important;
			color: #b0a8a2 !important;
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

	.btn-primary.loading {
		background-color: #7d4f33;
		opacity: 1;
	}

	/* [修改] 通过伪元素定制水波纹颜色 */
	:deep(.ripple) {
		background-color: rgba(255, 255, 255, 0.4);
	}

	.btn-secondary :deep(.ripple),
	.btn-dashed :deep(.ripple),
	.btn-text-link :deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>