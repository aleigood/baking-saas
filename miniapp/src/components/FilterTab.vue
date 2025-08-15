<template>
	<view class="filter-tab" :class="{ active: active }" v-ripple @click="emit('click', $event)">
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		active: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits(['click']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.filter-tab {
		padding: 8px 12px;
		border-radius: 20px;
		background: #f3e9e3;
		color: var(--text-secondary);
		font-size: 14px;
		white-space: nowrap;
		position: relative;
		overflow: hidden;
		transform: translateZ(0);
	}

	.filter-tab.active {
		background: var(--primary-color);
		color: white;
	}

	:deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.1);
	}

	.filter-tab.active :deep(.ripple) {
		background-color: rgba(255, 255, 255, 0.3);
	}
</style>