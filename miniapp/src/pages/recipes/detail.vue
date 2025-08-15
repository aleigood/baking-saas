<template>
	<view class="page-container">
		<DetailHeader :title="recipeFamily?.name || '加载中...'" />
		<view class="page-content" v-if="!isLoading && recipeFamily">
			<view class="detail-page">
				<!-- [修改] 传入配方状态 -->
				<RecipeVersionList :versions="recipeVersions" :selected-version-id="displayedVersionId"
					:can-edit="canEditRecipe" :is-discontinued="recipeFamily.deletedAt !== null"
					@select-version="handleVersionClick" @create-version="handleCreateVersion"
					@longpress-version="handleVersionLongPressAction" />

				<MainRecipeDetail v-if="recipeFamily.type === 'MAIN'" :version="displayedVersion" />
				<SimpleRecipeDetail v-else :version="displayedVersion" />
			</view>
		</view>
		<view class="loading-spinner" v-else>
			<text>加载中...</text>
		</view>

		<AppModal v-model:visible="showVersionOptionsModal" title="配方版本" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleActivateVersionOption">
					<view class="main-info">
						<view class="name">设为使用中</view>
					</view>
				</ListItem>
				<ListItem class="option-item" @click="handleDeleteVersionOption">
					<view class="main-info">
						<view class="name">删除配方版本</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal v-model:visible="showActivateVersionConfirmModal" title="设为使用中">
			<view class="modal-prompt-text">
				要将这个版本设为当前使用的配方吗？
			</view>
			<view class="modal-warning-text">
				后续创建生产任务时将默认使用此版本配方。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showActivateVersionConfirmModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleConfirmActivateVersion" :loading="isSubmitting">
					{{ isSubmitting ? '设置中...' : '确认设置' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showDeleteVersionConfirmModal" title="确认删除">
			<view class="modal-prompt-text">
				确定要删除这个配方版本吗？
			</view>
			<view class="modal-warning-text">
				已被生产任务使用的配方无法删除，此操作不可撤销。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showDeleteVersionConfirmModal = false">取消</AppButton>
				<AppButton type="danger" @click="handleConfirmDeleteVersion" :loading="isSubmitting">
					{{ isSubmitting ? '删除中...' : '确认删除' }}
				</AppButton>
			</view>
		</AppModal>

		<Toast />
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onLoad, onShow } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import { useToastStore } from '@/store/toast';
	import type { RecipeFamily, RecipeVersion } from '@/types/api';
	import { getRecipeFamily, activateRecipeVersion, deleteRecipeVersion } from '@/api/recipes';

	import RecipeVersionList from '@/components/RecipeVersionList.vue';
	import MainRecipeDetail from '@/components/MainRecipeDetail.vue';
	import SimpleRecipeDetail from '@/components/SimpleRecipeDetail.vue';
	import AppModal from '@/components/AppModal.vue';
	import AppButton from '@/components/AppButton.vue';
	import ListItem from '@/components/ListItem.vue';
	import Toast from '@/components/Toast.vue';
	import DetailHeader from '@/components/DetailHeader.vue';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const toastStore = useToastStore();
	const isLoading = ref(true);
	const isSubmitting = ref(false);
	const recipeFamily = ref<RecipeFamily | null>(null);
	const recipeVersions = ref<RecipeVersion[]>([]);

	const familyId = ref<string | null>(null);
	const displayedVersionId = ref<string | null>(null);
	const showActivateVersionConfirmModal = ref(false);
	const showVersionOptionsModal = ref(false);
	const showDeleteVersionConfirmModal = ref(false);
	const selectedVersionForAction = ref<RecipeVersion | null>(null);

	onLoad(async (options) => {
		if (options?.familyId) {
			familyId.value = options.familyId;
			await loadRecipeData(familyId.value);
		}
	});

	onShow(async () => {
		if (familyId.value && !isLoading.value) {
			await dataStore.fetchIngredientsData();
			await loadRecipeData(familyId.value);
		}
	});

	const loadRecipeData = async (id : string) => {
		isLoading.value = true;
		try {
			const fullFamilyData = await getRecipeFamily(id);
			recipeFamily.value = fullFamilyData;
			recipeVersions.value = fullFamilyData.versions.sort((a, b) => b.version - a.version);

			const currentActiveVersion = recipeVersions.value.find(v => v.isActive);
			let versionToShow = currentActiveVersion || (recipeVersions.value.length > 0 ? recipeVersions.value[0] : null);

			if (versionToShow) {
				if (!displayedVersionId.value || !recipeVersions.value.some(v => v.id === displayedVersionId.value)) {
					displayedVersionId.value = versionToShow.id;
				}
			} else {
				displayedVersionId.value = null;
			}
		} catch (error) {
			console.error('Failed to fetch recipe details:', error);
			toastStore.show({ message: '获取配方详情失败', type: 'error' });
		} finally {
			isLoading.value = false;
		}
	};

	const displayedVersion = computed(() => {
		return recipeVersions.value.find(v => v.id === displayedVersionId.value) || null;
	});

	const currentUserRoleInTenant = computed(
		() => userStore.userInfo?.tenants.find(t => t.tenant.id === dataStore.currentTenantId)?.role
	);

	const canEditRecipe = computed(() => {
		return currentUserRoleInTenant.value === 'OWNER' || currentUserRoleInTenant.value === 'ADMIN';
	});

	const navigateToEditPage = (familyId : string | null) => {
		if (!familyId) return;
		if (displayedVersion.value) {
			uni.setStorageSync('source_recipe_version', JSON.stringify(displayedVersion.value));
		}
		uni.navigateTo({
			url: `/pages/recipes/edit?familyId=${familyId}`
		});
	};

	const handleCreateVersion = () => {
		if (recipeFamily.value) navigateToEditPage(recipeFamily.value.id);
	};

	const handleVersionClick = (versionToDisplay : RecipeVersion) => {
		displayedVersionId.value = versionToDisplay.id;
	};

	const handleVersionLongPressAction = (version : RecipeVersion) => {
		if (!canEditRecipe.value || version.isActive || !recipeFamily.value) return;
		selectedVersionForAction.value = version;
		showVersionOptionsModal.value = true;
	};

	const handleActivateVersionOption = () => {
		showVersionOptionsModal.value = false;
		showActivateVersionConfirmModal.value = true;
	};

	const handleDeleteVersionOption = () => {
		showVersionOptionsModal.value = false;
		showDeleteVersionConfirmModal.value = true;
	};

	const handleConfirmActivateVersion = () => {
		if (selectedVersionForAction.value) {
			activateVersionAction(selectedVersionForAction.value);
		}
	};

	const activateVersionAction = async (versionToActivate : RecipeVersion) => {
		if (!recipeFamily.value) return;
		isSubmitting.value = true;
		try {
			await activateRecipeVersion(recipeFamily.value.id, versionToActivate.id);
			toastStore.show({ message: '设置成功', type: 'success' });
			await loadRecipeData(recipeFamily.value.id);
			dataStore.fetchRecipesData();
		} catch (error) {
			console.error('Failed to activate version:', error);
		} finally {
			isSubmitting.value = false;
			showActivateVersionConfirmModal.value = false;
		}
	};

	const handleConfirmDeleteVersion = async () => {
		if (!selectedVersionForAction.value || !familyId.value) return;
		isSubmitting.value = true;
		try {
			await deleteRecipeVersion(familyId.value, selectedVersionForAction.value.id);
			toastStore.show({ message: '删除成功', type: 'success' });
			showDeleteVersionConfirmModal.value = false;
			selectedVersionForAction.value = null;
			await loadRecipeData(familyId.value);
			await dataStore.fetchRecipesData();
		} catch (error) {
			showDeleteVersionConfirmModal.value = false;
		} finally {
			isSubmitting.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.detail-page {}

	.modal-prompt-text {
		font-size: 16px;
		color: var(--text-primary);
		text-align: center;
		margin-bottom: 10px;
	}

	.modal-warning-text {
		font-size: 13px;
		color: var(--text-secondary);
		text-align: center;
		margin-bottom: 20px;
		line-height: 1.5;
	}
</style>