<template>
	<view v-if="isOpen" class="fab-overlay" @click="toggleMenu"></view>
	<view class="fab-container" :class="{ 'fab-no-tab-bar': noTabBar }">
		<view class="fab-options" :class="{ 'is-open': isOpen }">
			<view v-for="(item, index) in actions" :key="index" class="fab-option-wrapper"
				:style="{ transitionDelay: `${isOpen ? (actions.length - 1 - index) * 30 : index * 30}ms` }">
				<view class="option-label">{{ item.text }}</view>
				<view :id="`fab-ripple-${index}`" class="option-button ripple-container"
					@touchstart="handleTouchStart($event, index)" @click="selectAction(item.action)">
					<span v-for="ripple in ripples[index]" :key="ripple.id" class="ripple" :style="ripple.style"></span>
					<image class="option-icon" :src="item.icon" />
				</view>
			</view>
		</view>

		<view :id="`fab-ripple-main`" class="fab-main ripple-container" @touchstart="handleTouchStart($event, 'main')"
			@click="toggleMenu">
			<span v-for="ripple in ripples['main']" :key="ripple.id" class="ripple" :style="ripple.style"></span>
			<image class="fab-icon" :class="{ 'is-open': isOpen }" src="/static/icons/fab-add.svg" />
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, reactive, getCurrentInstance, type PropType } from 'vue';

	// 定义组件的props
	const props = defineProps({
		actions: {
			type: Array as PropType<{ icon : string; text : string; action : () => void }[]>,
			default: () => []
		},
		noTabBar: {
			type: Boolean,
			default: false
		}
	});

	const instance = getCurrentInstance();
	const isOpen = ref(false); // 控制菜单的展开/收起状态

	// 为每个按钮（包括主按钮和选项按钮）维护独立的水波纹效果数组
	const ripples = reactive<Record<string | number, any[]>>({
		main: []
	});
	props.actions.forEach((_, index) => {
		ripples[index] = [];
	});

	// 切换菜单的显示状态
	const toggleMenu = () => {
		isOpen.value = !isOpen.value;
	};

	// 执行选项对应的动作
	const selectAction = (action : () => void) => {
		// [体验优化] 增加延迟，让水波纹动画播放完毕
		setTimeout(() => {
			action();
			isOpen.value = false; // 执行动作后自动收起菜单
		}, 200);
	};


	// 水波纹效果的触摸事件处理
	const handleTouchStart = (event : TouchEvent, key : string | number) => {
		const touch = event.touches[0];
		const viewId = `fab-ripple-${key}`;

		const query = uni.createSelectorQuery().in(instance);
		query.select('#' + viewId).boundingClientRect(rect => {
			if (rect) {
				// [核心修正] 移除上一轮的特殊处理。由于主按钮容器不再旋转，
				// clientX/Y 和 boundingClientRect 的计算始终是准确的。
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
				if (!ripples[key]) ripples[key] = [];
				ripples[key].push(newRipple);
				setTimeout(() => {
					if (ripples[key] && ripples[key].length > 0) ripples[key].shift();
				}, 600);
			}
		}).exec();
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [功能新增] 遮罩层样式 */
	.fab-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: transparent;
		/* 确保遮罩层在FAB按钮之下，但在其他页面内容之上 */
		z-index: 19;
	}

	.fab-container {
		position: fixed;
		bottom: calc(85px + constant(safe-area-inset-bottom));
		bottom: calc(85px + env(safe-area-inset-bottom));
		right: 20px;
		z-index: 20;
		width: 56px;
		height: 56px;
	}

	.fab-container.fab-no-tab-bar {
		bottom: calc(30px + constant(safe-area-inset-bottom));
		bottom: calc(30px + env(safe-area-inset-bottom));
	}

	.fab-main {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 56px;
		height: 56px;
		background-color: var(--primary-color);
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 6px 20px rgba(140, 90, 59, 0.3);
		z-index: 2;
		transform: translateZ(0);
		overflow: hidden;
		/* [核心修改] 移除主按钮的 transform 动画 */
		/* transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); */

		.fab-icon {
			width: 28px;
			height: 28px;
			/* [核心修改] 将旋转动画应用到图标上 */
			transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		}

		/* [核心修改] 仅旋转图标 */
		.fab-icon.is-open {
			transform: rotate(135deg);
		}
	}

	.fab-options {
		position: absolute;
		bottom: calc(100% + 15px);
		right: 0;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		list-style: none;
		padding: 0;
		margin: 0;
		z-index: 1;
		gap: 15px;
		/* [布局兼容性修复] 默认禁用指针事件，防止在收起状态下拦截点击 */
		pointer-events: none;
	}

	.fab-option-wrapper {
		display: flex;
		align-items: center;
		opacity: 0;
		transform: translateY(10px);
		transition: opacity 0.2s, transform 0.2s;
		transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
		/* [布局兼容性修复] 移除此处的pointer-events，由父级 .fab-options 统一控制 */
	}

	.fab-options.is-open {
		/* [布局兼容性修复] 菜单展开时，启用指针事件，使其可被点击 */
		pointer-events: auto;
	}

	.fab-options.is-open .fab-option-wrapper {
		opacity: 1;
		transform: translateY(0);
	}

	.option-label {
		background-color: #fff;
		color: var(--text-primary);
		padding: 5px 12px;
		border-radius: 8px;
		margin-right: 12px;
		font-size: 14px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
		white-space: nowrap;
	}

	.option-button {
		width: 44px;
		height: 44px;
		background-color: #fff;
		border-radius: 50%;
		display: flex;
		justify-content: center;
		align-items: center;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
		overflow: hidden;
		transform: translateZ(0);
		margin-right: 6px;

		.option-icon {
			width: 22px;
			height: 22px;
		}
	}

	.ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.fab-main .ripple {
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>