/**
 * 文件路径: /src/main.ts
 * 文件描述: [修改] 全局注册 v-ripple 指令。
 */
import { createSSRApp } from "vue";
import { createPinia } from 'pinia';
import App from "./App.vue";
import { useUiStore } from './store/ui';
import vRipple from './directives/vRipple'; // [新增] 引入 v-ripple 指令

export function createApp() {
	const app = createSSRApp(App);
	const pinia = createPinia();
	app.use(pinia);

	app.directive('ripple', vRipple); // [新增] 全局注册指令

	useUiStore();

	return {
		app,
	};
}