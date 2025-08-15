<template>
	<view>
		<!-- [重构] 使用 MainHeader 组件 -->
		<MainHeader />
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

		<AppFab v-if="canInvite" @click="uiStore.openModal(MODAL_KEYS.INVITE)" />

	</view>
</template>

<script setup lang="ts">
	import { computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import MainHeader from '@/components/MainHeader.vue'; // [新增]
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue';
	import type { Role } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore();


	onShow(async () => {
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