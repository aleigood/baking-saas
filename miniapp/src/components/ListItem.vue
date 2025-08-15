<template>
	<view class="list-item ripple-container" @touchstart="handleTouchStart" @touchmove="handleTouchMove"
		@touchend="handleTouchEnd">
		<slot></slot>
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	// [核心新增] 添加 props 定义
	const props = defineProps({
		// 控制是否在长按时触发震动
		vibrateOnLongPress: {
			type: Boolean,
			default: false,
		},
	});

	// 定义组件可以向外触发的事件
	const emit = defineEmits(['click', 'longpress']);

	// --- 内部状态定义 ---
	const ripples = ref<any[]>([]); // 存储当前显示的水波纹
	const longPressTimer = ref<any>(null); // 长按计时器
	const touchMoved = ref(false); // 标记手指是否移动过
	const longPressTriggered = ref(false); // 标记长按事件是否已触发
	const LONG_PRESS_DURATION = 350; // 定义长按的时长（毫秒）
	const instance = getCurrentInstance(); // 获取当前组件实例，用于 SelectorQuery

	/**
	 * 手指按下时触发
	 * @param {any} event - uni-app 提供的触摸事件对象
	 */
	const handleTouchStart = (event : any) => {
		touchMoved.value = false;
		longPressTriggered.value = false;
		clearTimeout(longPressTimer.value);

		const touch = event.touches[0];

		const query = uni.createSelectorQuery().in(instance);
		query.select('.list-item').boundingClientRect(rect => {
			if (rect) {
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const size = Math.max(rect.width, rect.height) * 2;

				const ripple = {
					id: Date.now(),
					style: {
						width: `${size}px`,
						height: `${size}px`,
						top: `${y - size / 2}px`,
						left: `${x - size / 2}px`,
					}
				};
				ripples.value.push(ripple);

				setTimeout(() => {
					if (ripples.value.length > 0) {
						ripples.value.shift();
					}
				}, 600);
			}
		}).exec();


		// 启动长按计时器
		longPressTimer.value = setTimeout(() => {
			if (!touchMoved.value) {
				longPressTriggered.value = true;
				emit('longpress');
				// [核心修复] 在 longpress 事件触发时调用振动
				if (props.vibrateOnLongPress) {
					uni.vibrateShort({
						success() {
							console.log('Vibrate success');
						},
						fail(err) {
							console.error('Vibrate failed', err);
						}
					});
				}
			}
		}, LONG_PRESS_DURATION);
	};

	/**
	 * 手指移动时触发
	 */
	const handleTouchMove = () => {
		touchMoved.value = true;
		clearTimeout(longPressTimer.value); // 移动则取消长按
	};

	/**
	 * 手指抬起时触发
	 */
	const handleTouchEnd = (event : Event) => {
		clearTimeout(longPressTimer.value);
		if (!touchMoved.value && !longPressTriggered.value) {
			event.preventDefault();
			emit('click');
		}
	};
</script>

<style scoped lang="scss">
	// 引入全局样式，使组件拥有 list-item 和 ripple-container 的基础样式
	@import '@/styles/common.scss';

	.ripple {
		background-color: rgba(0, 0, 0, 0.15);
	}

	.list-item {
		// 这里可以为组件本身添加一些特有的、不与父组件冲突的样式
	}
</style>