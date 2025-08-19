/**
 * 文件路径: /src/main.ts
 * 文件描述: [修改] 移除了 v-ripple 指令的全局注册。
 */
import { createSSRApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";
import { useUiStore } from './store/ui';

export function createApp() {
	const app = createSSRApp(App);
	const pinia = createPinia();
	app.use(pinia);

	useUiStore();

	return {
		app,
	};
}