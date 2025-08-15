<template>
	<view class="page-container">
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<h2 class="detail-title">{{ selectedMember?.name || selectedMember?.phone || '加载中...' }}</h2>
			</view>
		</view>
		<view class="page-content" v-if="!isLoading && selectedMember">
			<view class="card">
				<view class="card-title">人员信息</view>
				<FormItem label="姓名">
					<input class="input-field" type="text" :value="selectedMember.name || '未设置'" readonly />
				</FormItem>
				<FormItem label="手机号">
					<input class="input-field" type="text" :value="selectedMember.phone" readonly />
				</FormItem>
				<FormItem label="加入日期">
					<!-- [核心修改] 使用统一的日期格式化函数 -->
					<input class="input-field" type="text" :value="formatChineseDate(selectedMember.joinDate)"
						readonly />
				</FormItem>
				<FormItem label="角色">
					<picker mode="selector" :range="availableRolesDisplay" @change="onRoleChange"
						:disabled="!canEditRole">
						<view class="picker" :class="{ disabled: !canEditRole }">{{
                    editableMemberRoleDisplay
                  }}</view>
					</picker>
				</FormItem>
				<!-- [核心修改] 替换为 AppButton 组件 -->
				<AppButton type="primary" full-width @click="handleUpdateMemberRole"
					:disabled="!canEditRole || isSubmitting" :loading="isSubmitting">
					{{ isSubmitting ? '' : '保存修改' }}
				</AppButton>
				<AppButton type="danger" full-width @click="handleRemoveMember"
					:disabled="!canRemoveMember || isSubmitting">
					移除员工
				</AppButton>
			</view>
		</view>
		<view class="loading-spinner" v-else>
			<text>加载中...</text>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import type { Member, Role } from '@/types/api';
	import { updateMember, removeMember } from '@/api/members';
	import FormItem from '@/components/FormItem.vue';
	import AppButton from '@/components/AppButton.vue'; // [核心新增]
	import { formatChineseDate } from '@/utils/format'; // [核心新增] 引入格式化函数

	const userStore = useUserStore();
	const dataStore = useDataStore();

	const isLoading = ref(true);
	const isSubmitting = ref(false);
	const selectedMember = ref<Member | null>(null);
	const editableMemberRole = ref<Role>('MEMBER');

	onLoad(async (options) => {
		const memberId = options?.memberId;
		if (memberId) {
			const memberFromStore = dataStore.members.find(m => m.id === memberId);
			if (memberFromStore) {
				selectedMember.value = JSON.parse(JSON.stringify(memberFromStore));
				editableMemberRole.value = selectedMember.value.role;
			}
		}
		isLoading.value = false;
	});

	const roleMap : Record<Role, string> = {
		OWNER: '店主',
		ADMIN: '管理员',
		MEMBER: '员工',
		SUPER_ADMIN: '超级管理员'
	};

	const getRoleName = (role : Role) => {
		return roleMap[role] || role;
	};

	const editableMemberRoleDisplay = computed(() => getRoleName(editableMemberRole.value));

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canEditRole = computed(() => {
		if (!currentUserRoleInTenant.value ||
			!selectedMember.value ||
			selectedMember.value.id === userStore.userInfo?.id
		) {
			return false;
		}
		if (currentUserRoleInTenant.value === 'OWNER') {
			return selectedMember.value.role !== 'OWNER';
		}
		if (currentUserRoleInTenant.value === 'ADMIN') {
			return selectedMember.value.role === 'MEMBER';
		}
		return false;
	});

	const canRemoveMember = computed(() => {
		if (!currentUserRoleInTenant.value ||
			!selectedMember.value ||
			selectedMember.value.id === userStore.userInfo?.id
		) {
			return false;
		}
		return currentUserRoleInTenant.value === 'OWNER' && selectedMember.value.role !== 'OWNER';
	});

	const availableRoles = computed(() => {
		if (currentUserRoleInTenant.value === 'OWNER') {
			return ['ADMIN', 'MEMBER'];
		}
		return [];
	});

	const availableRolesDisplay = computed(() => {
		return availableRoles.value.map(role => getRoleName(role as Role));
	});

	const onRoleChange = (e : any) => {
		editableMemberRole.value = availableRoles.value[e.detail.value] as Role;
	};

	const handleUpdateMemberRole = async () => {
		if (!selectedMember.value || !canEditRole.value) return;

		isSubmitting.value = true;
		try {
			await updateMember(selectedMember.value.id, { role: editableMemberRole.value });
			uni.showToast({ title: '角色更新成功', icon: 'success' });
			await dataStore.fetchMembersData();
			uni.navigateBack();
		} catch (error : any) {
			console.error('Failed to update role:', error);
		} finally {
			isSubmitting.value = false;
		}
	};

	const handleRemoveMember = () => {
		if (!selectedMember.value || !canRemoveMember.value) return;

		uni.showModal({
			title: '确认移除',
			content: `确定要从本店铺移除 "${selectedMember.value!.name || selectedMember.value!.phone}" 吗？`,
			success: async (res) => {
				if (res.confirm) {
					isSubmitting.value = true;
					try {
						await removeMember(selectedMember.value!.id);
						uni.showToast({ title: '移除成功', icon: 'success' });
						await dataStore.fetchMembersData();
						uni.navigateBack();
					} catch (error : any) {
						console.error('Failed to remove member:', error);
					} finally {
						isSubmitting.value = false;
					}
				}
			},
		});
	};

	const navigateBack = () => {
		uni.navigateBack();
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.input-field,
	.picker {
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

	.picker.disabled {
		background-color: #e9ecef;
		color: #6c757d;
	}
</style>