import { defineStore } from 'pinia';
import { ref } from 'vue';

// [新增] 定义一个常量来表示非微信小程序和非H5平台的默认导航栏高度
const DEFAULT_NAV_BAR_HEIGHT = 64;

export const useSystemStore = defineStore('system', () => {
	// 状态栏高度
	const statusBarHeight = ref(0);
	// [修改] navBarHeight 现在代表内容区域的实际高度，即胶囊按钮的高度
	const navBarHeight = ref(0);
	// [新增] headerHeight 代表整个自定义导航栏的总高度
	const headerHeight = ref(0);
	// [新增] navBarContentTop 代表内容区域距离屏幕顶部的距离
	const navBarContentTop = ref(0);
	// 胶囊按钮布局信息
	const menuButtonPosition = ref<UniApp.GetMenuButtonBoundingClientRectRes | null>(null);

	/**
	 * 初始化系统信息
	 * @description 在 App.vue 中调用，获取并设置状态栏、导航栏高度等关键布局信息
	 */
	const initSystemInfo = () => {
		try {
			// [核心修改] 使用 uni.getWindowInfo() 替代已废弃的 uni.getSystemInfoSync()
			// uni.getWindowInfo() 是一个更现代、更专注的 API，专门用于获取窗口信息，可以消除废弃API的警告
			const windowInfo = uni.getWindowInfo();
			statusBarHeight.value = windowInfo.statusBarHeight || 0;

			// #ifdef MP-WEIXIN
			const menuButtonInfo = uni.getMenuButtonBoundingClientRect();
			menuButtonPosition.value = menuButtonInfo;

			// [核心修改] 应用新的导航栏高度计算算法
			// 1. 导航栏内容区的高度 = 胶囊按钮高度
			navBarHeight.value = menuButtonInfo.height;
			// 2. 内容区距离屏幕顶部的距离 = 胶囊按钮顶部位置
			navBarContentTop.value = menuButtonInfo.top;
			// 3. 整个自定义导航栏的总高度 = 胶囊按钮底部位置 + 28px 的额外边距 (可以按需调整)
			headerHeight.value = menuButtonInfo.bottom + 28;
			// #endif

			// #ifdef H5
			// [核心修复] 针对H5平台（浏览器）进行特别处理
			// H5环境没有真实的物理状态栏和胶囊按钮，uni.getWindowInfo().statusBarHeight 可能为0
			// 因此我们设定一个视觉上舒适的固定高度
			statusBarHeight.value = 20; // 为H5设定一个虚拟的状态栏高度
			navBarHeight.value = DEFAULT_NAV_BAR_HEIGHT; // 设定一个标准的导航栏内容区高度
			navBarContentTop.value = statusBarHeight.value; // 内容区紧随虚拟状态栏
			headerHeight.value = navBarHeight.value + statusBarHeight.value; // 计算总高度
			// #endif

			// #ifndef MP-WEIXIN || H5
			// [核心修复] 为其他非微信小程序、非H5的平台提供一个默认的导航栏高度计算逻辑
			navBarHeight.value = DEFAULT_NAV_BAR_HEIGHT;
			headerHeight.value = (windowInfo.statusBarHeight || 0) + DEFAULT_NAV_BAR_HEIGHT;
			navBarContentTop.value = windowInfo.statusBarHeight || 0;
			// #endif

		} catch (e) {
			console.error('获取系统信息失败', e);
			// 在异常情况下提供一个备用值
			statusBarHeight.value = 20;
			navBarHeight.value = DEFAULT_NAV_BAR_HEIGHT;
			headerHeight.value = 20 + DEFAULT_NAV_BAR_HEIGHT;
			navBarContentTop.value = 20;
		}
	};

	return {
		statusBarHeight,
		navBarHeight,
		headerHeight,
		navBarContentTop,
		menuButtonPosition,
		initSystemInfo,
	};
});