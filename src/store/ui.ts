import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

// 定义 UI 相关的状态
export const useUiStore = defineStore('ui', () => {
	// 当前激活的 Tab，默认为 'production'
	const activeTab = ref('production');

	// 全局模态框的显示状态
	const showStoreModal = ref(false);
	const showUserMenu = ref(false);
	const showInviteModal = ref(false);
	const showTaskActionsModal = ref(false);
	// [核心新增] 为采购记录操作模态框添加全局状态
	const showProcurementActionsModal = ref(false);


	// [核心修改] isAnyModalOpen 现在也会追踪 showProcurementActionsModal 的状态
	const isAnyModalOpen = computed(() => showStoreModal.value || showUserMenu.value || showInviteModal.value || showTaskActionsModal.value || showProcurementActionsModal.value);

	/**
	 * 设置当前激活的 Tab
	 * @param tabKey Tab的唯一标识
	 */
	function setActiveTab(tabKey : string) {
		activeTab.value = tabKey;
	}

	// [核心修改] openModal 和 closeModal 现在也能处理 'procurementActions' 模态框
	function openModal(modalName : 'store' | 'userMenu' | 'invite' | 'taskActions' | 'procurementActions') {
		if (modalName === 'store') showStoreModal.value = true;
		if (modalName === 'userMenu') showUserMenu.value = true;
		if (modalName === 'invite') showInviteModal.value = true;
		if (modalName === 'taskActions') showTaskActionsModal.value = true;
		if (modalName === 'procurementActions') showProcurementActionsModal.value = true;
	}

	function closeModal(modalName : 'store' | 'userMenu' | 'invite' | 'taskActions' | 'procurementActions') {
		if (modalName === 'store') showStoreModal.value = false;
		if (modalName === 'userMenu') showUserMenu.value = false;
		if (modalName === 'invite') showInviteModal.value = false;
		if (modalName === 'taskActions') showTaskActionsModal.value = false;
		if (modalName === 'procurementActions') showProcurementActionsModal.value = false;
	}


	return {
		activeTab,
		setActiveTab,
		// 暴露状态和方法
		showStoreModal,
		showUserMenu,
		showInviteModal,
		showTaskActionsModal,
		showProcurementActionsModal, // 暴露新状态
		openModal,
		closeModal,
		isAnyModalOpen,
	};
});