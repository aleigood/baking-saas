<template>
	<view class="list-item ripple-container"
		:class="{ 'card-mode': cardMode, 'is-selected': selected, 'bleed-mode': bleed }" @touchstart="handleTouchStart"
		@click="handleClick" @longpress="handleLongPress">
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
		<view class="list-item-content" :class="{ 'no-padding': noPadding, 'bleed-padding': bleed }">
			<slot></slot>
		</view>
		<view v-if="divider" class="divider"></view>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	const props = defineProps({
		vibrateOnLongPress: {
			type: Boolean,
			default: false,
		},
		cardMode: {
			type: Boolean,
			default: false,
		},
		noPadding: {
			type: Boolean,
			default: false,
		},
		bleed: {
			type: Boolean,
			default: false,
		},
		// [兼容性修复] 新增 selected 属性，用于控制选中状态
		selected: {
			type: Boolean,
			default: false,
		},
		// [兼容性修复] 新增 divider 属性，用于控制分隔线的显示
		divider: {
			type: Boolean,
			default: false,
		}
	});

	const emit = defineEmits(['click', 'longpress']);

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

	const handleClick = (event : Event) => {
		// [体验优化] 增加 300ms 延迟，确保水波纹动画可见后再执行点击操作
		setTimeout(() => {
			emit('click', event);
		}, 300);
	};

	const handleLongPress = (event : Event) => {
		// [逻辑优化] 只有在允许长按操作时（即 vibrateOnLongPress 为 true），才触发振动和 longpress 事件
		if (props.vibrateOnLongPress) {
			uni.vibrateShort({});
			emit('longpress', event);
		}
	};
</script>

<style scoped lang="scss">
	/* [CSS重构] 将 .list-item 相关的样式从 common.scss 移入组件内部 */
	.list-item {
		position: relative;
		overflow: hidden;
		-webkit-user-select: none;
		user-select: none;
		-webkit-tap-highlight-color: transparent;
		display: flex;
		/* 新增flex布局以确保内容撑满 */
		justify-content: space-between;
		align-items: center;
	}

	.list-item-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 15px 5px;
		flex: 1;
		position: relative;
		z-index: 1;
	}

	.list-item-content.bleed-padding {
		padding: 15px 20px;
	}

	.list-item-content.no-padding {
		padding: 0;
	}

	.card-mode {
		background: var(--card-bg);
		padding: 0;
		border-radius: 20px;
		margin-bottom: 15px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
		border-left: 5px solid var(--card-border-color, transparent);
	}

	.card-mode .list-item-content {
		padding: 20px;
	}

	/* [CSS重构] card 内部的 list-item 特殊边距规则也移入 */
	.card .list-item {
		padding-left: 0;
		padding-right: 0;
	}

	.card-mode .list-item-content.no-padding {
		padding: 0;
	}

	.ripple {
		background-color: rgba(0, 0, 0, 0.15);
	}

	.list-item.is-selected {
		background-color: transparent;
	}

	.list-item.is-selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 50%;
		background-color: var(--primary-color);
		border-radius: 0 4px 4px 0;
		z-index: 1;
	}

	/* [兼容性修复] 新增一个真实的view元素作为分隔线，替代::after伪元素 */
	.divider {
		content: '';
		position: absolute;
		bottom: 0;
		height: 1px;
		background-color: var(--border-color);
		left: 0;
		right: 0;
	}

	/* [兼容性修复] 当列表项为 bleed 模式时，分隔线也需要相应的内边距 */
	.list-item.bleed-mode .divider {
		left: 20px;
		right: 20px;
	}
</style>