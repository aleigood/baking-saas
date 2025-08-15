<template>
	<!-- [核心修改] 移除了动态绑定的 :style 属性 -->
	<view class="custom-tab-bar">
		<view v-for="(item, index) in list" :key="item.key" class="tab-item ripple-container"
			@touchstart="handleTouchStart($event, item, index)" @touchmove="handleTouchMove"
			@touchend="handleTouchEnd(item)">
			<image class="icon" :src="uiStore.activeTab === item.key ? item.selectedIconPath : item.iconPath" />
			<view class="text" :class="{ 'text-active': uiStore.activeTab === item.key }">{{ item.text }}</view>
			<span v-for="ripple in ripples[item.key]" :key="ripple.id" class="ripple" :style="ripple.style"></span>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, reactive, getCurrentInstance } from 'vue';
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
		text: "人员",
		iconPath: "/static/tabbar/personnel.svg",
		selectedIconPath: "/static/tabbar/personnel_active.svg"
	}]);

	const ripples = reactive<Record<string, any[]>>({
		production: [],
		ingredients: [],
		recipes: [],
		personnel: [],
	});
	const touchMoved = ref(false);
	let currentTouchItemKey : string | null = null;

	const handleTouchStart = (event : any, item : { key : string }, index : number) => {
		touchMoved.value = false;
		currentTouchItemKey = item.key;

		const touch = event.touches[0];
		const query = uni.createSelectorQuery().in(instance);

		query.selectAll('.tab-item').boundingClientRect(rects => {
			if (Array.isArray(rects) && rects[index]) {
				const rect = rects[index];
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

				if (!ripples[item.key]) {
					ripples[item.key] = [];
				}
				ripples[item.key].push(newRipple);

				setTimeout(() => {
					if (ripples[item.key] && ripples[item.key].length > 0) {
						ripples[item.key].shift();
					}
				}, 600);
			}
		}).exec();
	};

	const handleTouchMove = () => {
		touchMoved.value = true;
	};

	const handleTouchEnd = (item : { key : string }) => {
		if (!touchMoved.value && currentTouchItemKey === item.key) {
			switchTab(item);
		}
		currentTouchItemKey = null;
	};

	const switchTab = (item) => {
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
		/* [核心修改] 添加毛玻璃效果和背景色，与顶部栏统一 */
		backdrop-filter: saturate(180%) blur(20px);
		background-color: rgba(255, 255, 255, 0.85);
		/* [核心修改] 调整边框和阴影以适应毛玻璃效果 */
		border-top: 1px solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
		/* [主要修改] 遵循新的全局层级规范，将 z-index 固定为 98 */
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

	.ripple {
		position: absolute;
		border-radius: 50%;
		background-color: rgba(0, 0, 0, 0.1);
		transform: scale(0);
		animation: ripple-animation 0.6s linear;
		pointer-events: none;
	}

	@keyframes ripple-animation {
		to {
			transform: scale(4);
			opacity: 0;
		}
	}
</style>