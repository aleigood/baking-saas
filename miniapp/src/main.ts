/**
 * 文件路径: /src/main.ts
 * 文件描述: Vue应用的入口文件。我们需要在这里引入并使用Pinia。
 */
import { createSSRApp } from "vue";
import { createPinia } from 'pinia'; // 引入 createPinia
import App from "./App.vue";
import { useUiStore } from './store/ui'; // [核心新增] 引入 uiStore

export function createApp() {
	const app = createSSRApp(App);
	const pinia = createPinia(); // [核心修改] 创建 pinia 实例
	app.use(pinia); // 使用 Pinia

	// [核心新增] 在应用创建时初始化 store，虽然 Pinia 会自动处理，但显式调用可以确保在需要时已存在
	useUiStore();

	return {
		app,
	};
}