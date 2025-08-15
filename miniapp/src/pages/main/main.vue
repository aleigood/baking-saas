<template>
	<view class="page-container page-with-custom-tabbar">
		<ProductionPage v-show="uiStore.activeTab === 'production'" />
		<IngredientsPage v-show="uiStore.activeTab === 'ingredients'" />
		<RecipesPage v-show="uiStore.activeTab === 'recipes'" />
		<PersonnelPage v-show="uiStore.activeTab === 'personnel'" />

		<CustomTabBar />

		<AppModal :visible="uiStore.showStoreModal" @update:visible="uiStore.closeModal(MODAL_KEYS.STORE)" title="选择门店"
			:no-header-line="true">
			<view class="options-list">
				<ListItem v-for="tenant in dataStore.tenants" :key="tenant.id" @click="handleSelectTenant(tenant.id)"
					class="option-item">
					<view class="main-info">
						<view class="name">{{ tenant.name }}</view>
					</view>
					<view class="side-info" v-if="dataStore.currentTenant?.id === tenant.id">
						<view class="value checkmark-icon">✓</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showUserOptionsModal" @update:visible="uiStore.closeModal(MODAL_KEYS.USER_OPTIONS)"
			title="账户操作" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleOpenLogoutConfirm">
					<view class="main-info">
						<view class="name">退出登录</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal :visible="uiStore.showLogoutConfirmModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.LOGOUT_CONFIRM)" title="退出登录">
			<view class="modal-prompt-text">
				您确定要退出登录吗？
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal(MODAL_KEYS.LOGOUT_CONFIRM)">取消</AppButton>
				<AppButton type="danger" @click="handleLogout">确认退出</AppButton>
			</view>
		</AppModal>

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

		<Toast />
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { useUiStore } from '@/store/ui';
	import { useDataStore } from '@/store/data';
	import { useUserStore } from '@/store/user';
	import { useToastStore } from '@/store/toast';
	import { createInvitation } from '@/api/invitations';
	import { MODAL_KEYS } from '@/constants/modalKeys';

	import CustomTabBar from '@/components/CustomTabBar.vue';
	import AppModal from '@/components/AppModal.vue';
	import FormItem from '@/components/FormItem.vue';
	import ListItem from '@/components/ListItem.vue';
	import AppButton from '@/components/AppButton.vue';
	import Toast from '@/components/Toast.vue';

	// 引入四个页面级组件
	import ProductionPage from '@/pages/production/production.vue';
	import IngredientsPage from '@/pages/ingredients/ingredients.vue';
	import RecipesPage from '@/pages/recipes/recipes.vue';
	import PersonnelPage from '@/pages/personnel/personnel.vue';

	const uiStore = useUiStore();
	const dataStore = useDataStore();
	const userStore = useUserStore();
	const toastStore = useToastStore();

	const isCreatingInvite = ref(false);
	const inviteePhone = ref('');

	const handleSelectTenant = async (tenantId : string) => {
		if (dataStore.currentTenantId === tenantId) {
			uiStore.closeModal(MODAL_KEYS.STORE);
			return;
		}
		await dataStore.selectTenant(tenantId);
		uiStore.closeModal(MODAL_KEYS.STORE);
		if (uiStore.activeTab === 'production') await dataStore.fetchProductionData();
		if (uiStore.activeTab === 'ingredients') await dataStore.fetchIngredientsData();
		if (uiStore.activeTab === 'recipes') await dataStore.fetchRecipesData();
		if (uiStore.activeTab === 'personnel') await dataStore.fetchMembersData();
	};

	const handleLogout = () => {
		userStore.logout();
		uiStore.closeModal(MODAL_KEYS.LOGOUT_CONFIRM);
	};

	const handleOpenLogoutConfirm = () => {
		uiStore.closeModal(MODAL_KEYS.USER_OPTIONS);
		uiStore.openModal(MODAL_KEYS.LOGOUT_CONFIRM);
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

	.modal-prompt-text {
		font-size: 16px;
		color: var(--text-primary);
		text-align: center;
		margin-bottom: 25px;
	}

	.options-list {
		.option-item {
			text-align: left;

			:deep(.main-info) {
				justify-content: flex-start;
			}

			:deep(.desc) {
				display: block;
			}

			.checkmark-icon {
				color: var(--primary-color);
				font-weight: bold;
				font-size: 18px;
			}
		}
	}
</style>