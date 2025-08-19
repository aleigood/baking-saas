<template>
	<view class="filter-tabs">
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	// 这个组件目前只是一个容器，不需要脚本逻辑
</script>

<style scoped lang="scss">
	.filter-tabs {
		display: flex;
		gap: 12px;
		/* [样式调整] 减小标签间距 */
		margin-bottom: 20px;
		overflow-x: auto;
		/* [样式调整] 允许横向滚动 */
		/* [样式调整] 隐藏滚动条，全局样式已处理，这里是备用方案 */
		-ms-overflow-style: none;
		/* IE and Edge */
		scrollbar-width: none;
		/* Firefox */
	}

	/* [样式调整] 隐藏滚动条 for Chrome, Safari and Opera */
	.filter-tabs::-webkit-scrollbar {
		display: none;
	}
</style>