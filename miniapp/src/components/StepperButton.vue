<template>
	<view class="btn-stepper" v-ripple @click="emit('click', $event)">
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	const emit = defineEmits(['click']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.btn-stepper {
		width: 30px;
		height: 30px;
		padding: 0;
		background-color: #f3e9e3;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		position: relative;
		overflow: hidden;
		transform: translateZ(0);

		&::after {
			border: none;
		}
	}

	:deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>