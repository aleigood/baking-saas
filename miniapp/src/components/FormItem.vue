<template>
	<!-- 
    一个简单的表单项封装组件。
    - label prop 用于设置标签文字。
    - 使用 <slot> 填充输入控件，如 <input> 或 <picker>。
  -->
	<view class="form-item">
		<!-- [修改] 将 label 标签改为 view 标签，并赋予一个类名 -->
		<view class="form-item-label" v-if="label">{{ label }}</view>
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

	// [修改] 使用类选择器 .form-item-label 替代 label 标签选择器
	.form-item-label {
		display: block;
		margin-bottom: 8px;
		font-size: 14px;
		color: #606266;
	}
</style>