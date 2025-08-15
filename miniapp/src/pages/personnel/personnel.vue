<template>
	<view>
		<view class="page-header">
			<view class="store-selector" @click="uiStore.openModal('store')">{{ dataStore.currentTenant?.name }} &#9662;
			</view>
			<IconButton circle class="user-avatar" @click="uiStore.openModal('userOptions')">
				{{ userStore.userInfo?.name?.[0] || '管' }}
			</IconButton>
		</view>
		<view class="page-content page-content-with-tabbar-fab">
			<template v-if="dataStore.members.length > 0">
				<ListItem v-for="member in dataStore.members" :key="member.id" @click="navigateToDetail(member.id)">
					<view class="main-info">
						<view class="name">{{ member.name || member.phone }}</view>
						<view class="desc">加入于: {{ formatChineseDate(member.joinDate) }}</view>
					</view>
					<view class="side-info">
						<view class="value">{{ getRoleName(member.role) }}</view>
					</view>
				</ListItem>
			</template>
			<view v-else class="empty-state">
				<text>暂无人员信息</text>
			</view>
		</view>

		<AppFab v-if="canInvite" @click="uiStore.openModal('invite')" />

	</view>
</template>

<script setup lang="ts">
	import IconButton from '@/components/IconButton.vue'; // 引入 IconButton 组件
	import { ref, computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui'; // [核心新增]
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue'; // 导入 ListItem 组件
	import type { Role } from '@/types/api';
	import { formatChineseDate } from '@/utils/format'; // [核心新增] 引入格式化函数

	// [核心修改] 移除 isLoading 状态，改为在 onShow 钩子中直接加载数据
	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore(); // [核心新增]


	onShow(async () => {
		// [重构] 仅当数据未加载时才去获取，不再使用全屏 loading
		if (!dataStore.dataLoaded.members) {
			await dataStore.fetchMembersData();
		}
	});

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canInvite = computed(() => {
		return currentUserRoleInTenant.value === 'OWNER' || currentUserRoleInTenant.value === 'ADMIN';
	});

	const getRoleName = (role : Role) => {
		const roleMap = {
			OWNER: '店主',
			ADMIN: '管理员',
			MEMBER: '员工',
			SUPER_ADMIN: '超级管理员'
		};
		return roleMap[role] || role;
	};

	const navigateToDetail = (memberId : string) => {
		uni.navigateTo({
			url: `/pages/personnel/detail?memberId=${memberId}`,
		});
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';
</style>