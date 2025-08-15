<template>
	<view class="page-container">
		<!-- 页面头部 -->
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<h2 class="detail-title">{{ ingredient?.name || '加载中...' }}</h2>
				<IconButton @click="openEditModal">
					<image class="header-icon" src="/static/icons/property.svg" />
				</IconButton>
			</view>
		</view>

		<view class="page-content page-content-with-fab" v-if="!isLoading && ingredient">
			<view class="detail-page">
				<!-- 1. 核心信息区 -->
				<view class="tag-group">
					<span class="tag">品牌: {{ ingredient.activeSku?.brand || '未设置' }}</span>
					<span class="tag">单价: ¥{{ getIngredientPricePerKg(ingredient) }}/kg</span>
					<span class="tag">库存: {{ (ingredient.currentStockInGrams / 1000).toFixed(2) }} kg</span>
				</view>

				<!-- 2. 数据洞察区 -->
				<view class="card">
					<AnimatedTabs v-model="detailChartTab" :tabs="chartTabs" />
					<LineChart v-if="detailChartTab === 'price'" :chart-data="costHistory" />
					<LineChart v-if="detailChartTab === 'usage'" :chart-data="usageHistory" unit-prefix=""
						unit-suffix="kg" />
				</view>

				<!-- 3. [修改] 使用 IngredientSkuList 组件 -->
				<IngredientSkuList :ingredient="ingredient" :selected-sku-id="selectedSkuId" @select="handleSkuClick"
					@longpress="handleSkuLongPressAction" @add="openAddSkuModal" />

				<!-- 4. [修改] 使用 IngredientProcurementList 组件 -->
				<IngredientProcurementList :selected-sku="selectedSku" @longpress="handleProcurementLongPress" />
			</view>
		</view>
		<view class="loading-spinner" v-else>
			<text>加载中...</text>
		</view>

		<AppFab @click="openProcurementModal" class="fab-no-tab-bar" />

		<AppModal v-model:visible="showEditModal" title="编辑原料属性">
			<FormItem label="原料名称">
				<input class="input-field" v-model="ingredientForm.name" placeholder="输入原料名称" />
			</FormItem>
			<FormItem label="原料类型">
				<picker mode="selector" :range="availableTypes.map(t => t.label)" @change="onTypeChange">
					<view class="picker">{{ currentTypeLabel }}</view>
				</picker>
			</FormItem>
			<view class="form-row">
				<label class="form-row-label">是否为面粉</label>
				<switch :checked="ingredientForm.isFlour" @change="onIsFlourChange" color="#8c5a3b" />
			</view>
			<view class="form-row">
				<label class="form-row-label">含水量 (%)</label>
				<input class="input-field" type="number" v-model.number="ingredientForm.waterContent"
					placeholder="输入百分比, 如 80" />
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showEditModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleUpdateIngredient" :loading="isSubmitting">
					{{ isSubmitting ? '保存中...' : '确认保存' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showAddSkuModal" title="新增品牌规格">
			<FormItem label="品牌">
				<input class="input-field" v-model="newSkuForm.brand" placeholder="例如：王后" />
			</FormItem>
			<FormItem label="规格名称">
				<input class="input-field" v-model="newSkuForm.specName" placeholder="例如：1kg袋装" />
			</FormItem>
			<FormItem label="规格重量 (g)">
				<input class="input-field" type="number" v-model.number="newSkuForm.specWeightInGrams"
					placeholder="例如：1000" />
			</FormItem>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showAddSkuModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleCreateSku" :loading="isSubmitting">
					{{ isSubmitting ? '创建中...' : '确认创建' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showProcurementModal" title="新增采购">
			<FormItem label="采购商品">
				<input class="input-field" :value="activeSkuName" readonly disabled />
			</FormItem>
			<FormItem label="采购包数">
				<input class="input-field" type="number" v-model.number="procurementForm.packagesPurchased"
					placeholder="例如：10" />
			</FormItem>
			<FormItem label="采购总价 (元)">
				<input class="input-field" type="number" v-model.number="procurementForm.totalPrice"
					placeholder="例如：255" />
			</FormItem>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showProcurementModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleCreateProcurement" :loading="isSubmitting">
					{{ isSubmitting ? '入库中...' : '确认入库' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showSkuOptionsModal" title="品牌与规格" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleActivateSkuOption">
					<view class="main-info">
						<view class="name">设为使用中</view>
					</view>
				</ListItem>
				<ListItem class="option-item" @click="handleDeleteSkuOption">
					<view class="main-info">
						<view class="name">删除此品牌</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal v-model:visible="showActivateSkuConfirmModal" title="设为使用中">
			<view class="modal-prompt-text">
				要将此规格设为当前使用的吗？
			</view>
			<view class="modal-warning-text">
				后续的采购和成本计算将默认使用此规格。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showActivateSkuConfirmModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleActivateFromModal" :loading="isSubmitting">
					{{ isSubmitting ? '设置中...' : '确认设置' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showDeleteSkuConfirmModal" title="确认删除">
			<view class="modal-prompt-text">
				确定要删除这个品牌规格吗？
			</view>
			<view class="modal-warning-text">
				存在采购记录的品牌规格无法删除，此操作不可撤销。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showDeleteSkuConfirmModal = false">取消</AppButton>
				<AppButton type="danger" @click="handleConfirmDeleteSku" :loading="isSubmitting">
					{{ isSubmitting ? '删除中...' : '确认删除' }}
				</AppButton>
			</view>
		</AppModal>

		<AppModal v-model:visible="showProcurementOptionsModal" title="采购记录" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleDeleteProcurementOption">
					<view class="main-info">
						<view class="name">删除采购记录</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<AppModal v-model:visible="uiStore.showProcurementActionsModal" title="确认删除">
			<view class="modal-prompt-text">
				确定要删除这条采购记录吗？
			</view>
			<view class="modal-warning-text">
				请注意：删除此条采购记录将会相应减少该原料的库存量。此操作不可撤销。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="uiStore.closeModal('procurementActions')">取消</AppButton>
				<AppButton type="danger" @click="handleDeleteProcurement" :loading="isSubmitting">
					{{ isSubmitting ? '删除中...' : '确认删除' }}
				</AppButton>
			</view>
		</AppModal>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, reactive } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import type { Ingredient, IngredientSKU, ProcurementRecord } from '@/types/api';
	import { getIngredient, createSku, createProcurement, setActiveSku, updateIngredient, deleteProcurement, deleteSku } from
		'@/api/ingredients';
	import { getIngredientCostHistory, getIngredientUsageHistory } from '@/api/costing';
	import AppModal from '@/components/AppModal.vue';
	import FormItem from '@/components/FormItem.vue';
	import AppFab from '@/components/AppFab.vue';
	import LineChart from '@/components/LineChart.vue';
	import ListItem from '@/components/ListItem.vue';
	import IconButton from '@/components/IconButton.vue';
	import AppButton from '@/components/AppButton.vue';
	import AnimatedTabs from '@/components/AnimatedTabs.vue';
	import { formatChineseDate } from '@/utils/format';
	// [新增] 引入新组件
	import IngredientSkuList from '@/components/IngredientSkuList.vue';
	import IngredientProcurementList from '@/components/IngredientProcurementList.vue';

	const dataStore = useDataStore();
	const uiStore = useUiStore();
	const isLoading = ref(true);
	const isSubmitting = ref(false);
	const ingredient = ref<Ingredient | null>(null);
	const detailChartTab = ref<'price' | 'usage'>('price');
	const chartTabs = ref([
		{ key: 'price', label: '价格走势' },
		{ key: 'usage', label: '用量走势' },
	]);
	const showAddSkuModal = ref(false);
	const newSkuForm = ref({
		brand: '',
		specName: '',
		specWeightInGrams: 0,
	});
	const showProcurementModal = ref(false);
	const procurementForm = ref({
		skuId: '',
		packagesPurchased: 0,
		totalPrice: 0,
		purchaseDate: new Date().toISOString(),
	});

	const costHistory = ref<{ cost : number }[]>([]);
	const usageHistory = ref<{ cost : number }[]>([]);
	const showActivateSkuConfirmModal = ref(false);
	const showSkuOptionsModal = ref(false);
	const showDeleteSkuConfirmModal = ref(false);
	const showProcurementOptionsModal = ref(false);
	const selectedSkuForAction = ref<IngredientSKU | null>(null);
	const selectedSkuId = ref<string | null>(null);
	const selectedProcurementForAction = ref<ProcurementRecord | null>(null);

	const showEditModal = ref(false);

	const ingredientForm = reactive({
		name: '',
		type: 'STANDARD' as 'STANDARD' | 'UNTRACKED',
		isFlour: false,
		waterContent: 0,
	});

	onLoad(async (options) => {
		const ingredientId = options?.ingredientId;
		if (ingredientId) {
			await loadIngredientData(ingredientId);
		} else {
			uni.showToast({ title: '无效的原料ID', icon: 'none' });
			isLoading.value = false;
		}
	});

	const loadIngredientData = async (id : string) => {
		isLoading.value = true;
		try {
			const [ingredientData, historyData, usageData] = await Promise.all([
				getIngredient(id),
				getIngredientCostHistory(id),
				getIngredientUsageHistory(id).then(data => data.map(item => ({ cost: item.cost / 1000 })))
			]);
			ingredient.value = ingredientData;
			costHistory.value = historyData;
			usageHistory.value = usageData;

			ingredientForm.name = ingredientData.name;
			ingredientForm.type = ingredientData.type;
			ingredientForm.isFlour = ingredientData.isFlour;
			ingredientForm.waterContent = ingredientData.waterContent;


			if (ingredientData.activeSkuId) {
				selectedSkuId.value = ingredientData.activeSkuId;
			} else if (ingredientData.skus.length > 0) {
				selectedSkuId.value = ingredientData.skus[0].id;
			}
		} catch (error) {
			console.error("Failed to load ingredient data:", error);
			uni.showToast({ title: '数据加载失败', icon: 'none' });
		} finally {
			isLoading.value = false;
		}
	};

	const openEditModal = () => {
		if (ingredient.value) {
			ingredientForm.name = ingredient.value.name;
			ingredientForm.type = ingredient.value.type;
			ingredientForm.isFlour = ingredient.value.isFlour;
			ingredientForm.waterContent = ingredient.value.waterContent;
		}
		showEditModal.value = true;
	};


	const availableTypes = ref([
		{ label: '标准原料 (追踪库存)', value: 'STANDARD' },
		{ label: '非追踪原料 (不计库存)', value: 'UNTRACKED' },
	]);

	const currentTypeLabel = computed(() => {
		return availableTypes.value.find(t => t.value === ingredientForm.type)?.label || '未知类型';
	});

	const onTypeChange = (e : any) => {
		ingredientForm.type = availableTypes.value[e.detail.value].value as 'STANDARD' | 'UNTRACKED';
	};


	const getIngredientPricePerKg = (ing : Ingredient | null) => {
		if (!ing || !ing.activeSku || !ing.currentPricePerPackage || !ing.activeSku.specWeightInGrams) {
			return '0.00';
		}
		return ((Number(ing.currentPricePerPackage) / ing.activeSku.specWeightInGrams) * 1000).toFixed(2);
	};

	const navigateBack = () => {
		uni.navigateBack();
	};

	const openAddSkuModal = () => {
		newSkuForm.value = { brand: '', specName: '', specWeightInGrams: 0 };
		showAddSkuModal.value = true;
	};

	const handleCreateSku = async () => {
		if (!ingredient.value) return;
		if (!newSkuForm.value.specName || !newSkuForm.value.specWeightInGrams) {
			uni.showToast({ title: '请填写规格名称和重量', icon: 'none' });
			return;
		}
		isSubmitting.value = true;
		try {
			const skuRes = await createSku(ingredient.value.id, newSkuForm.value);
			const skuId = skuRes.id;

			if (ingredient.value.skus.length === 0) {
				await setActiveSku(ingredient.value.id, skuId);
			}

			uni.showToast({ title: '创建成功', icon: 'success' });
			showAddSkuModal.value = false;
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} finally {
			isSubmitting.value = false;
		}
	};

	const activeSkuName = computed(() => {
		if (!ingredient.value?.activeSku) return '无激活SKU';
		const sku = ingredient.value.activeSku;
		return `${sku.brand || '无品牌'} (${sku.specName})`;
	});

	const openProcurementModal = () => {
		if (!ingredient.value?.activeSkuId) {
			uni.showToast({ title: '请先激活一个SKU才能进行采购', icon: 'none' });
			return;
		}
		procurementForm.value = {
			skuId: ingredient.value.activeSkuId,
			packagesPurchased: 0,
			totalPrice: 0,
			purchaseDate: new Date().toISOString(),
		};
		showProcurementModal.value = true;
	};

	const handleCreateProcurement = async () => {
		if (!procurementForm.value.skuId || procurementForm.value.packagesPurchased <= 0 || procurementForm.value.totalPrice <= 0) {
			uni.showToast({ title: '请填写所有有效的采购信息', icon: 'none' });
			return;
		}
		isSubmitting.value = true;
		try {
			const pricePerPackage = procurementForm.value.totalPrice / procurementForm.value.packagesPurchased;

			await createProcurement({
				skuId: procurementForm.value.skuId,
				packagesPurchased: procurementForm.value.packagesPurchased,
				pricePerPackage: pricePerPackage,
				purchaseDate: procurementForm.value.purchaseDate,
			});
			uni.showToast({ title: '入库成功', icon: 'success' });
			showProcurementModal.value = false;
			await loadIngredientData(ingredient.value!.id);
			await dataStore.fetchIngredientsData();
		} finally {
			isSubmitting.value = false;
		}
	};

	const handleSkuClick = (sku : IngredientSKU) => {
		selectedSkuId.value = sku.id;
	};

	const handleSkuLongPressAction = (sku : IngredientSKU) => {
		if (sku.id === ingredient.value?.activeSkuId) {
			return;
		}
		selectedSkuForAction.value = sku;
		showSkuOptionsModal.value = true;
	};

	const handleActivateSkuOption = () => {
		showSkuOptionsModal.value = false;
		if (selectedSkuForAction.value?.id !== ingredient.value?.activeSkuId) {
			showActivateSkuConfirmModal.value = true;
		} else {
			uni.showToast({ title: '该规格已在使用中', icon: 'none' });
		}
	};

	const handleDeleteSkuOption = () => {
		showSkuOptionsModal.value = false;
		showDeleteSkuConfirmModal.value = true;
	};

	const handleConfirmDeleteSku = async () => {
		if (!selectedSkuForAction.value || !ingredient.value) return;
		isSubmitting.value = true;
		try {
			await deleteSku(selectedSkuForAction.value.id);
			uni.showToast({ title: '删除成功', icon: 'success' });
			showDeleteSkuConfirmModal.value = false;
			selectedSkuForAction.value = null;
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			showDeleteSkuConfirmModal.value = false;
		} finally {
			isSubmitting.value = false;
		}
	};

	const handleActivateFromModal = async () => {
		if (!selectedSkuForAction.value || !ingredient.value) return;
		const sku = selectedSkuForAction.value;
		isSubmitting.value = true;
		try {
			await setActiveSku(ingredient.value.id, sku.id);
			uni.showToast({ title: '设置成功', icon: 'success' });
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			console.error('Failed to activate SKU:', error);
		} finally {
			isSubmitting.value = false;
			showActivateSkuConfirmModal.value = false;
		}
	};

	const selectedSku = computed(() => {
		if (!ingredient.value || !selectedSkuId.value) return null;
		return ingredient.value.skus.find(s => s.id === selectedSkuId.value) || null;
	});

	const onIsFlourChange = (e : any) => {
		ingredientForm.isFlour = e.detail.value;
	};

	const handleUpdateIngredient = async () => {
		if (!ingredient.value) return;
		isSubmitting.value = true;
		try {
			await updateIngredient(ingredient.value.id, {
				name: ingredientForm.name,
				type: ingredientForm.type,
				isFlour: ingredientForm.isFlour,
				waterContent: Number(ingredientForm.waterContent) || 0,
			});
			uni.showToast({ title: '保存成功', icon: 'success' });
			showEditModal.value = false;
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			console.error("Failed to update ingredient properties:", error);
			uni.showToast({ title: '保存失败', icon: 'none' });
		} finally {
			isSubmitting.value = false;
		}
	};

	const handleProcurementLongPress = (record : ProcurementRecord) => {
		selectedProcurementForAction.value = record;
		showProcurementOptionsModal.value = true;
	};

	const handleDeleteProcurementOption = () => {
		showProcurementOptionsModal.value = false;
		uiStore.openModal('procurementActions');
	};

	const handleDeleteProcurement = async () => {
		if (!selectedProcurementForAction.value || !ingredient.value) return;
		isSubmitting.value = true;
		try {
			await deleteProcurement(selectedProcurementForAction.value.id);
			uni.showToast({ title: '删除成功', icon: 'success' });
			uiStore.closeModal('procurementActions');
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			uiStore.closeModal('procurementActions');
		} finally {
			isSubmitting.value = false;
			selectedProcurementForAction.value = null;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.header-icon {
		width: 24px;
		height: 24px;
	}

	.detail-page .tag-group {
		margin-bottom: 20px;
		padding: 0 5px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.picker,
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
		text-align: left;
	}

	.input-field[disabled] {
		background-color: #e9ecef;
		color: #6c757d;
	}

	.form-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 0;
	}

	.form-row-label {
		font-size: 15px;
		color: var(--text-primary);
	}

	.form-row .input-field {
		width: 120px;
		text-align: right;
	}

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