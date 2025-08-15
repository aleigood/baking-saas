<template>
	<view class="custom-tab-bar">
		<view v-for="item in list" :key="item.key" class="tab-item" v-ripple @click="switchTab(item)">
			<image class="icon" :src="uiStore.activeTab === item.key ? item.selectedIconPath : item.iconPath" />
			<view class="text" :class="{ 'text-active': uiStore.activeTab === item.key }">{{ item.text }}</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { useUiStore } from '@/store/ui';

	const uiStore = useUiStore();

	const list = ref([{
		key: "production",
		text: "制作",
		iconPath: "/static/tabbar/production.svg",
		selectedIconPath: "/static/tabbar/production_active.svg"
	}, {
		key: "ingredients",
		text: "原料",
		iconPath: "/static/tabbar/ingredients.svg",
		selectedIconPath: "/static/tabbar/ingredients_active.svg"
	}, {
		key: "recipes",
		text: "配方",
		iconPath: "/static/tabbar/recipes.svg",
		selectedIconPath: "/static/tabbar/recipes_active.svg"
	}, {
		key: "personnel",
		text: "人员",
		iconPath: "/static/tabbar/personnel.svg",
		selectedIconPath: "/static/tabbar/personnel_active.svg"
	}]);

	const switchTab = (item : { key : string }) => {
		uiStore.setActiveTab(item.key);
	};
</script>

<style scoped lang="scss">
	.custom-tab-bar {
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		height: calc(env(safe-area-inset-bottom) + 60px);
		padding-bottom: env(safe-area-inset-bottom);
		display: flex;
		justify-content: space-around;
		align-items: center;
		backdrop-filter: saturate(180%) blur(20px);
		background-color: rgba(255, 255, 255, 0.85);
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
		z-index: 98;
	}

	.tab-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 60px;
		flex: 1;
		position: relative;
		overflow: hidden;
	}

	.icon {
		width: 24px;
		height: 24px;
		margin-bottom: 4px;
	}

	.text {
		font-size: 10px;
		color: var(--text-secondary);
	}

	.text-active {
		color: var(--primary-color);
	}

	:deep(.ripple) {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>