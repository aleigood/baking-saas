<template>
	<view class="icon-button ripple-container" :class="{ circle: circle }" @touchstart="handleTouchStart"
		@touchmove="handleTouchMove" @touchend="handleTouchEnd">
		<slot></slot>
		<span v-for="ripple in ripples" :key="ripple.id" class="ripple" :style="ripple.style"></span>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance } from 'vue';

	defineProps({
		circle: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['click']);
	const instance = getCurrentInstance();
	const ripples = ref<any[]>([]);
	const touchMoved = ref(false);

	const handleTouchStart = (event : any) => {
		touchMoved.value = false;
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		query.select('.icon-button').boundingClientRect(rect => {
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
		if (!touchMoved.value) {
			// [核心修改] 传入事件对象并阻止默认行为，以防止移动端上的“幽灵点击”问题。
			// 这是导致模态框立即关闭的关键修复。
			event.preventDefault();
			emit('click');
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.icon-button {
		/* [核心新增] 为图标按钮提供基础样式和水波纹容器属性 */
		position: relative;
		overflow: hidden;
		transform: translateZ(0);
		/* [修改] 调整内边距和圆角 */
		padding: 8px;
		border-radius: 12px;
		/* [核心新增] 使其内容（如图片）垂直居中 */
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-button.circle {
		border-radius: 50%;
	}

	.ripple {
		/* [核心新增] 为图标按钮的水波纹设置一个更柔和的颜色 */
		background-color: rgba(0, 0, 0, 0.08);
	}
</style>