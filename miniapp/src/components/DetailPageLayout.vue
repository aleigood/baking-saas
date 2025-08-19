<template>
	<!-- 
		这是一个可复用的独立页面布局组件，封装了滚动容器的核心逻辑。
		- 它为没有底部 TabBar 的页面设计。
		- scroll-y="true": 允许垂直滚动。
		- :show-scrollbar="false": 隐藏滚动条。
		- enhanced: 开启增强特性，提升滚动性能。
		- :style="{ height: scrollAreaHeight }": 动态计算并设置滚动区域的高度。
		- [核心修改] @scrolltolower="$emit('scrolltolower')": 监听滚动到底部的事件，并向父组件派发 'scrolltolower' 事件。
	-->
	<scroll-view :scroll-y="true" :show-scrollbar="false" class="scroll-area" :style="{ height: scrollAreaHeight }"
		enhanced @scrolltolower="$emit('scrolltolower')">
		<!-- 通过插槽，让父组件可以填充任意内容 -->
		<slot></slot>
	</scroll-view>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
	import { useSystemStore } from '@/store/system';

	// [核心修改] 定义组件可以派发的事件
	defineEmits(['scrolltolower']);

	// 引入系统信息 store
	const systemStore = useSystemStore();

	// 动态计算滚动区域的高度
	const scrollAreaHeight = computed(() => {
		// 100vh 是整个屏幕的高度
		// systemStore.headerHeight 是顶部自定义导航栏的高度
		// 对于没有 TabBar 的页面，滚动区域的高度就是视口高度减去头部高度
		return `calc(100vh - ${systemStore.headerHeight}px)`;
	});
</script>

<style scoped lang="scss">
	.scroll-area {
		flex: 1;
		min-height: 0;
		box-sizing: border-box;
	}
</style>