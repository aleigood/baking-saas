<template>
	<!-- 
    一个简单的表单项封装组件。
    - label prop 用于设置标签文字。
    - 使用 <slot> 填充输入控件，如 <input> 或 <picker>。
  -->
	<view class="form-item">
		<label v-if="label">{{ label }}</label>
		<slot></slot>
	</view>
</template>

<script setup lang="ts">
	defineProps({
		label: {
			type: String,
			default: '',
		},
	});
</script>

<style scoped lang="scss">
	.form-item {
		margin-bottom: 20px;
	}

	.form-item label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		color: #606266;
	}
</style>