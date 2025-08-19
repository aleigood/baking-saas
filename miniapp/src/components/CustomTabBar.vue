<template>
	<view class="custom-tab-bar">
		<view v-for="item in list" :key="item.key" :id="'tab-item-' + item.key" class="tab-item ripple-container"
			@touchstart="handleTouchStart($event, item.key)" @click="switchTab(item)">
			<span v-for="ripple in ripples[item.key]" :key="ripple.id" class="ripple" :style="ripple.style"></span>
			<image class="icon" :src="uiStore.activeTab === item.key ? item.selectedIconPath : item.iconPath" />
			<view class="text" :class="{ 'text-active': uiStore.activeTab === item.key }">{{ item.text }}</view>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, getCurrentInstance, reactive } from 'vue';
	import { useUiStore } from '@/store/ui';

	const uiStore = useUiStore();
	const instance = getCurrentInstance();

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
		// [核心修改] 将 “人员” 修改为 “我的”
		text: "我的",
		iconPath: "/static/tabbar/personnel.svg",
		selectedIconPath: "/static/tabbar/personnel_active.svg"
	}]);

	// [新增] 为每个tab项维护独立的水波纹数组
	const ripples = reactive<Record<string, any[]>>({
		production: [],
		ingredients: [],
		recipes: [],
		personnel: [],
	});

	const handleTouchStart = (event : TouchEvent, key : string) => {
		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);
		// [修改] 使用动态ID来精确定位
		query.select(`#tab-item-${key}`).boundingClientRect(rect => {
			if (rect) {
				const x = touch.clientX - rect.left;
				const y = touch.clientY - rect.top;
				const size = Math.max(rect.width, rect.height) * 2;
				const newRipple = {
					id: Date.now(),
					style: {
						width: `${size}px`,
						height: `${size}px`,
						top: `${y - size / 2}px`,
						left: `${x - size / 2}px`,
					}
				};
				ripples[key].push(newRipple);
				setTimeout(() => {
					if (ripples[key].length > 0) ripples[key].shift();
				}, 600);
			}
		}).exec();
	};

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
		/* [删除] 移除固定的 height 计算，让 flex-item 的高度和 padding 自动撑开容器 */
		/* height: calc(env(safe-area-inset-bottom) + 60px); */
		/* [修改] 增加 constant() 以兼容旧版 iOS, 并只使用 padding 撑开安全区域 */
		padding-bottom: constant(safe-area-inset-bottom);
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
		z-index: 1;
	}

	.text {
		font-size: 11px;
		color: var(--text-secondary);
		z-index: 1;
	}

	.text-active {
		color: var(--primary-color);
	}

	.ripple {
		background-color: rgba(0, 0, 0, 0.1);
	}
</style>