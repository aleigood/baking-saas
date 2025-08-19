<script setup lang="ts">
	import { onLaunch } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useSystemStore } from '@/store/system'; // [新增] 引入 system store

	onLaunch(async () => {
		console.log('App Launch');
		const userStore = useUserStore();
		const dataStore = useDataStore();
		const systemStore = useSystemStore();

		systemStore.initSystemInfo();

		if (userStore.token) {
			try {
				// [核心修改] 等待用户信息和店铺信息都获取成功
				await userStore.fetchUserInfo();
				await dataStore.fetchTenants();

				// [核心修改] 确认用户信息有效后，再跳转到主页
				if (userStore.userInfo) {
					uni.reLaunch({
						url: '/pages/main/main',
					});
				} else {
					// 如果有token但获取不到用户信息，说明token无效，强制登出
					userStore.logout();
				}
			} catch (error) {
				// 捕获到任何错误（如网络问题、token过期等），都跳转到登录页
				console.error("App Launch: Auth failed, redirecting to login.", error);
				uni.reLaunch({
					url: '/pages/login/login',
				});
			}
		} else {
			// 没有token，直接去登录
			uni.reLaunch({
				url: '/pages/login/login',
			});
		}
	});
</script>

<style lang="scss">
	@import '@/uni.scss';

	page {
		background-color: var(--bg-color);
		color: var(--text-primary);
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans',
			sans-serif;
	}

	::-webkit-scrollbar {
		width: 0;
		height: 0;
		color: transparent;
		display: none;
	}
</style>