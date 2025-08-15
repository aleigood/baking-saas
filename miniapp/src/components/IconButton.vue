<template>
	<view class="icon-button" :class="{ circle: circle }" v-ripple @click="emit('click', $event)">
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		circle: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['click']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.icon-button {
		position: relative;
		overflow: hidden;
		transform: translateZ(0);
		padding: 8px;
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.icon-button.circle {
		border-radius: 50%;
	}

	:deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.08);
	}
</style>