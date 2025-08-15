<template>
	<view class="list-item" v-ripple @click="handleClick" @longpress="handleLongPress">
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	const props = defineProps({
		vibrateOnLongPress: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['click', 'longpress']);

	const handleClick = (event : Event) => {
		emit('click', event);
	};

	const handleLongPress = (event : Event) => {
		if (props.vibrateOnLongPress) {
			uni.vibrateShort({});
		}
		emit('longpress', event);
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.list-item {
		/* [新增] 为 v-ripple 指令提供定位上下文 */
		position: relative;
		overflow: hidden;
	}

	:deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.15);
	}
</style>