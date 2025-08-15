<template>
	<view class="fab" v-ripple @click="emit('click', $event)">
		<image class="fab-icon"
			src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E" />
	</view>
</template>

<script setup lang="ts">
	const emit = defineEmits(['click']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [修改] fab 样式已在 common.scss 中定义，这里定制水波纹颜色 */
	:deep(.ripple) {
		background-color: rgba(255, 255, 255, 0.4);
	}
</style>