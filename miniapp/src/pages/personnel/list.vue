<template>
	<page-meta page-style="overflow: hidden; background-color: #fdf8f2;"></page-meta>
	<view class="page-wrapper">
		<DetailHeader title="人员管理" />
		<DetailPageLayout>
			<view class="page-content no-horizontal-padding page-content-with-fab">
				<template v-if="dataStore.members.length > 0">
					<ListItem v-for="(member, index) in dataStore.members" :key="member.id"
						@click="navigateToDetail(member.id)" :bleed="true"
						:divider="index < dataStore.members.length - 1">
						<view class="member-details">
							<view class="member-avatar">
								{{ member.name?.[0] || '员' }}
							</view>
							<view class="main-info">
								<view class="name">{{ member.name || member.phone }}</view>
								<view class="desc">加入于: {{ formatChineseDate(member.joinDate) }}</view>
							</view>
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
		</DetailPageLayout>

		<AppFab v-if="canManagePersonnel" @click="openInviteModal" :no-tab-bar="true" />

		<AppModal :visible="uiStore.showInviteModal" @update:visible="uiStore.closeModal(MODAL_KEYS.INVITE)"
			title="邀请新成员">
			<FormItem label="被邀请人手机号">
				<input class="input-field" type="tel" v-model="inviteePhone" placeholder="请输入手机号" />
			</FormItem>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.INVITE)">
					取消
				</AppButton>
				<AppButton type="primary" @click="handleInvite" :disabled="isCreatingInvite"
					:loading="isCreatingInvite">
					{{ isCreatingInvite ? '' : '确认邀请' }}
				</AppButton>
			</view>
		</AppModal>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import { useUserStore } from '@/store/user';
	import { useToastStore } from '@/store/toast';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import { createInvitation } from '@/api/invitations';
	import DetailHeader from '@/components/DetailHeader.vue';
	import DetailPageLayout from '@/components/DetailPageLayout.vue';
	import ListItem from '@/components/ListItem.vue';
	import AppFab from '@/components/AppFab.vue';
	import AppModal from '@/components/AppModal.vue';
	import FormItem from '@/components/FormItem.vue';
	import AppButton from '@/components/AppButton.vue';
	import type { Role } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';

	const dataStore = useDataStore();
	const uiStore = useUiStore();
	const userStore = useUserStore();
	const toastStore = useToastStore();

	const isCreatingInvite = ref(false);
	const inviteePhone = ref('');

	onShow(async () => {
		if (!dataStore.dataLoaded.members) {
			await dataStore.fetchMembersData();
		}
	});

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canManagePersonnel = computed(() => {
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

	const openInviteModal = () => {
		uiStore.openModal(MODAL_KEYS.INVITE);
	};

	const handleInvite = async () => {
		if (!inviteePhone.value) {
			toastStore.show({ message: '请输入手机号', type: 'error' });
			return;
		}
		isCreatingInvite.value = true;
		try {
			await createInvitation(inviteePhone.value);
			toastStore.show({ message: '邀请已发送', type: 'success' });
			uiStore.closeModal(MODAL_KEYS.INVITE);
			inviteePhone.value = '';
		} catch (error) {
			console.error('Failed to create invitation:', error);
		} finally {
			isCreatingInvite.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';
	@include list-item-content-style;

	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	/* [布局修复] 新增 .member-details 容器样式，使其内部元素紧凑排列 */
	.member-details {
		display: flex;
		align-items: center;
		flex: 1;
		/* 占据左侧所有可用空间 */
	}

	.member-avatar {
		width: 42px;
		height: 42px;
		border-radius: 50%;
		background-color: var(--primary-color);
		color: white;
		display: flex;
		justify-content: center;
		align-items: center;
		font-size: 18px;
		font-weight: bold;
		margin-right: 15px;
		flex-shrink: 0;
	}

	.input-field {
		width: 100%;
		height: 44px;
		line-height: 44px;
		padding: 0 12px;
		border: 1px solid var(--border-color);
		border-radius: 10px;
		font-size: 14px;
		background-color: #f8f9fa;
		box-sizing: border-box;
	}
</style>