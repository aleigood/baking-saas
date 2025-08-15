import { defineConfig } from 'vite';
import uni from '@dcloudio/vite-plugin-uni';

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [uni()],
	css: {
		preprocessorOptions: {
			scss: {
				// [重构] 同时注入变量和通用样式
				additionalData: `@import "@/uni.scss"; @import "@/styles/common.scss";`
			}
		}
	}
});