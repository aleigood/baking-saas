<template>
	<view class="page-header">
		<view class="detail-header">
			<view class="back-btn" @click="navigateBack" v-ripple>&#10094;</view>
			<h2 class="detail-title">{{ title }}</h2>
			<view class="actions">
				<slot></slot>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		title: {
			type: String,
			required: true,
		},
	});

	const navigateBack = () => {
		uni.navigateBack();
	};
</script>

<style scoped lang="scss">
	// The styles for page-header and detail-header are already in common.scss
	// We just need a placeholder for the actions slot
	.actions {
		display: flex;
		align-items: center;
	}
</style>