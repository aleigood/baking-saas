<template>
	<view class="page-header" :style="headerStyle" :class="{ transparent: transparent }">
		<view class="header-content" :style="contentStyle">
			<view class="store-selector" @click="uiStore.openModal(MODAL_KEYS.STORE)">
				{{ dataStore.currentTenant?.name || '请选择店铺' }} &#9662;
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
	import { useUiStore } from '@/store/ui';
	import { useDataStore } from '@/store/data';
	import { useUserStore } from '@/store/user';
	import { useSystemStore } from '@/store/system';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import IconButton from '@/components/IconButton.vue';

	// [新增] 定义 props，接收 transparent 属性
	defineProps({
		transparent: {
			type: Boolean,
			default: false
		}
	});

	const uiStore = useUiStore();
	const dataStore = useDataStore();
	const userStore = useUserStore();
	const systemStore = useSystemStore();

	// [修改] 计算整个 header 的动态高度
	const headerStyle = computed(() => ({
		height: `${systemStore.headerHeight}px`
	}));

	// [修改] 计算 header 内容区域的动态定位和高度
	const contentStyle = computed(() => ({
		top: `${systemStore.navBarContentTop}px`,
		height: `${systemStore.navBarHeight}px`,
		// [新增] 增加一个右边距，确保即使头像移除，标题也不会贴边
		paddingRight: '20px'
	}));
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [新增] 定义透明状态下的样式 */
	.page-header.transparent {
		background-color: transparent !important;
		backdrop-filter: none !important;
	}
</style>