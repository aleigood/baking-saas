import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 定义 UI 相关的状态
export const useUiStore = defineStore('ui', () => {
	// 当前激活的 Tab，默认为 'production'
	const activeTab = ref('production');

	// 全局模态框的显示状态
	const showStoreModal = ref(false);
	const showUserOptionsModal = ref(false); // [修改] 从 showUserMenu 重命名
	const showLogoutConfirmModal = ref(false); // [新增] 退出登录确认框状态
	const showInviteModal = ref(false);
	const showTaskActionsModal = ref(false);
	const showProcurementActionsModal = ref(false);


	// [修改] isAnyModalOpen 现在也会追踪新的模态框状态
	const isAnyModalOpen = computed(() => showStoreModal.value || showUserOptionsModal.value || showLogoutConfirmModal.value || showInviteModal.value || showTaskActionsModal.value || showProcurementActionsModal.value);

	/**
	 * 设置当前激活的 Tab
	 * @param tabKey Tab的唯一标识
	 */
	function setActiveTab(tabKey : string) {
		activeTab.value = tabKey;
	}

	// [修改] openModal 和 closeModal 现在也能处理 'userOptions' 和 'logoutConfirm' 模态框
	function openModal(modalName : 'store' | 'userOptions' | 'logoutConfirm' | 'invite' | 'taskActions' | 'procurementActions') {
		if (modalName === 'store') showStoreModal.value = true;
		if (modalName === 'userOptions') showUserOptionsModal.value = true;
		if (modalName === 'logoutConfirm') showLogoutConfirmModal.value = true;
		if (modalName === 'invite') showInviteModal.value = true;
		if (modalName === 'taskActions') showTaskActionsModal.value = true;
		if (modalName === 'procurementActions') showProcurementActionsModal.value = true;
	}

	function closeModal(modalName : 'store' | 'userOptions' | 'logoutConfirm' | 'invite' | 'taskActions' | 'procurementActions') {
		if (modalName === 'store') showStoreModal.value = false;
		if (modalName === 'userOptions') showUserOptionsModal.value = false;
		if (modalName === 'logoutConfirm') showLogoutConfirmModal.value = false;
		if (modalName === 'invite') showInviteModal.value = false;
		if (modalName === 'taskActions') showTaskActionsModal.value = false;
		if (modalName === 'procurementActions') showProcurementActionsModal.value = false;
	}


	return {
		activeTab,
		setActiveTab,
		// 暴露状态和方法
		showStoreModal,
		showUserOptionsModal,
		showLogoutConfirmModal,
		showInviteModal,
		showTaskActionsModal,
		showProcurementActionsModal,
		openModal,
		closeModal,
		isAnyModalOpen,
	};
});