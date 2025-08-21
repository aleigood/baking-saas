<template>
	<page-meta page-style="overflow: hidden; background-color: #fdf8f2;"></page-meta>
	<view class="page-wrapper">
		<DetailHeader :title="ingredient?.name || '加载中...'" />

		<DetailPageLayout>
			<view class="page-content page-content-with-fab" v-if="!isLoading && ingredient">
				<view class="tag-group">
					<span class="tag">品牌: {{ ingredient.activeSku?.brand || '未设置' }}</span>
					<span class="tag">单价: ¥{{ getIngredientPricePerKg(ingredient) }}/kg</span>
					<span class="tag">库存: {{ (ingredient.currentStockInGrams / 1000).toFixed(2) }} kg</span>
				</view>

				<view class="card">
					<AnimatedTabs v-model="detailChartTab" :tabs="chartTabs" />
					<LineChart v-if="detailChartTab === 'price'" :chart-data="costHistory" />
					<LineChart v-if="detailChartTab === 'usage'" :chart-data="usageHistory" unit-prefix=""
						unit-suffix="kg" />
				</view>

				<IngredientSkuList :ingredient="ingredient" :selected-sku-id="selectedSkuId" @select="handleSkuClick"
					@longpress-sku="handleSkuLongPressAction" @add="openAddSkuModal" />

				<IngredientProcurementList :selected-sku="selectedSku" @longpress="handleProcurementLongPress" />
			</view>
			<view class="loading-spinner" v-else>
				<text>加载中...</text>
			</view>
		</DetailPageLayout>

		<ExpandingFab :actions="fabActions" :no-tab-bar="true" />

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
			<!-- [新增] 采购日期选择器 -->
			<FormItem label="采购日期">
				<picker mode="date" :value="procurementForm.purchaseDate" @change="onNewProcurementDateChange">
					<view class="picker">{{ procurementForm.purchaseDate }}</view>
				</picker>
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
				<ListItem class="option-item" @click="handleActivateSkuOption" :bleed="true">
					<view class="main-info">
						<view class="name">设为使用中</view>
					</view>
				</ListItem>
				<ListItem class="option-item" @click="handleDeleteSkuOption" :bleed="true">
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

		<!-- [新增] 采购记录操作选项模态框 -->
		<AppModal :visible="uiStore.showProcurementActionsModal"
			@update:visible="uiStore.closeModal(MODAL_KEYS.PROCUREMENT_ACTIONS)" title="采购记录" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleEditProcurementOption" :bleed="true">
					<view class="main-info">
						<view class="name">修改采购记录</view>
					</view>
				</ListItem>
			</view>
		</AppModal>

		<!-- [新增] 编辑采购记录模态框 -->
		<AppModal v-model:visible="showEditProcurementModal" title="编辑采购记录">
			<!-- [新增] 采购商品信息展示 -->
			<FormItem label="采购商品">
				<input class="input-field" :value="editedProcurementSkuName" readonly disabled />
			</FormItem>
			<FormItem label="采购数量">
				<input class="input-field" :value="`${editProcurementForm.packagesPurchased} 包`" readonly disabled />
			</FormItem>
			<!-- [修改] 将单价输入改为总价输入 -->
			<FormItem label="采购总价 (元)">
				<input class="input-field" type="number" v-model.number="editProcurementForm.totalPrice"
					placeholder="输入总价" />
			</FormItem>
			<FormItem label="采购日期">
				<picker mode="date" :value="editProcurementForm.purchaseDate" @change="onEditProcurementDateChange">
					<view class="picker">{{ editProcurementForm.purchaseDate }}</view>
				</picker>
			</FormItem>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showEditProcurementModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleUpdateProcurement" :loading="isSubmitting">
					{{ isSubmitting ? '保存中...' : '确认保存' }}
				</AppButton>
			</view>
		</AppModal>

		<Toast />
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, reactive } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { useDataStore } from '@/store/data';
	import { useUiStore } from '@/store/ui';
	import { useToastStore } from '@/store/toast';
	import type { Ingredient, IngredientSKU, ProcurementRecord } from '@/types/api';
	// [修改] 引入新的 updateProcurement 接口，移除 deleteProcurement
	import { getIngredient, createSku, createProcurement, setActiveSku, updateIngredient, deleteSku, updateProcurement } from
		'@/api/ingredients';
	import { getIngredientCostHistory, getIngredientUsageHistory } from '@/api/costing';
	import AppModal from '@/components/AppModal.vue';
	import FormItem from '@/components/FormItem.vue';
	// [核心修改] 引入新的 ExpandingFab 组件
	import ExpandingFab from '@/components/ExpandingFab.vue';
	import LineChart from '@/components/LineChart.vue';
	import ListItem from '@/components/ListItem.vue';
	import IconButton from '@/components/IconButton.vue';
	import AppButton from '@/components/AppButton.vue';
	import AnimatedTabs from '@/components/AnimatedTabs.vue';
	import Toast from '@/components/Toast.vue';
	import IngredientSkuList from '@/components/IngredientSkuList.vue';
	import IngredientProcurementList from '@/components/IngredientProcurementList.vue';
	import DetailHeader from '@/components/DetailHeader.vue';
	import DetailPageLayout from '@/components/DetailPageLayout.vue';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import { formatChineseDate } from '@/utils/format';

	// [新增] 禁用属性继承，以解决多根节点组件的警告
	defineOptions({
		inheritAttrs: false
	});

	const dataStore = useDataStore();
	const uiStore = useUiStore();
	const toastStore = useToastStore();
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

	// [新增] 编辑采购记录模态框相关状态
	const showEditProcurementModal = ref(false);
	const editProcurementForm = reactive({
		id: '',
		packagesPurchased: 0,
		pricePerPackage: 0,
		purchaseDate: '',
		// [新增] 用于接收总价输入
		totalPrice: 0,
	});

	// [核心新增] 定义FAB按钮的动作
	const fabActions = ref([
		{ icon: '/static/icons/add.svg', text: '增加采购', action: () => openProcurementModal() },
		{ icon: '/static/icons/property.svg', text: '编辑属性', action: () => openEditModal() }
	]);

	onLoad(async (options) => {
		const ingredientId = options?.ingredientId;
		if (ingredientId) {
			await loadIngredientData(ingredientId);
		} else {
			toastStore.show({ message: '无效的原料ID', type: 'error' });
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


			if (ingredientData.activeSku?.id) {
				selectedSkuId.value = ingredientData.activeSku.id;
			} else if (ingredientData.skus.length > 0) {
				selectedSkuId.value = ingredientData.skus[0].id;
			}
		} catch (error) {
			console.error("Failed to load ingredient data:", error);
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

	const openAddSkuModal = () => {
		newSkuForm.value = { brand: '', specName: '', specWeightInGrams: 0 };
		showAddSkuModal.value = true;
	};

	const handleCreateSku = async () => {
		if (!ingredient.value) return;
		if (!newSkuForm.value.specName || !newSkuForm.value.specWeightInGrams) {
			toastStore.show({ message: '请填写规格名称和重量', type: 'error' });
			return;
		}
		isSubmitting.value = true;
		try {
			const skuRes = await createSku(ingredient.value.id, newSkuForm.value);
			const skuId = skuRes.id;

			if (ingredient.value.skus.length === 0) {
				await setActiveSku(ingredient.value.id, skuId);
			}

			toastStore.show({ message: '创建成功', type: 'success' });
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

	// [新增] 用于编辑模态框中显示SKU名称
	const editedProcurementSkuName = computed(() => {
		if (!selectedSku.value) return '加载中...';
		return `${selectedSku.value.brand || '无品牌'} (${selectedSku.value.specName})`;
	});

	const openProcurementModal = () => {
		if (!ingredient.value?.activeSku?.id) {
			toastStore.show({ message: '请先激活一个SKU才能进行采购', type: 'error' });
			return;
		}
		procurementForm.value = {
			skuId: ingredient.value.activeSku.id,
			packagesPurchased: 0,
			totalPrice: 0,
			purchaseDate: new Date().toISOString(),
		};
		showProcurementModal.value = true;
	};

	// [新增] 新增采购时，更新采购日期
	const onNewProcurementDateChange = (e : any) => {
		procurementForm.value.purchaseDate = e.detail.value;
	};

	const handleCreateProcurement = async () => {
		if (!procurementForm.value.skuId || procurementForm.value.packagesPurchased <= 0 || procurementForm.value.totalPrice <= 0) {
			toastStore.show({ message: '请填写所有有效的采购信息', type: 'error' });
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
			toastStore.show({ message: '入库成功', type: 'success' });
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
		if (sku.id === ingredient.value?.activeSku?.id) {
			return;
		}
		selectedSkuForAction.value = sku;
		showSkuOptionsModal.value = true;
	};

	const handleActivateSkuOption = () => {
		showSkuOptionsModal.value = false;
		if (selectedSkuForAction.value?.id !== ingredient.value?.activeSku?.id) {
			showActivateSkuConfirmModal.value = true;
		} else {
			toastStore.show({ message: '该规格已在使用中', type: 'info' });
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
			toastStore.show({ message: '删除成功', type: 'success' });
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
			toastStore.show({ message: '设置成功', type: 'success' });
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
		if (!ingredientForm.name || !ingredientForm.name.trim()) {
			toastStore.show({ message: '原料名称不能为空', type: 'error' });
			return;
		}
		if (!ingredient.value) return;
		isSubmitting.value = true;
		try {
			await updateIngredient(ingredient.value.id, {
				name: ingredientForm.name,
				type: ingredientForm.type,
				isFlour: ingredientForm.isFlour,
				waterContent: Number(ingredientForm.waterContent) || 0,
			});
			toastStore.show({ message: '保存成功', type: 'success' });
			showEditModal.value = false;
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			console.error("Failed to update ingredient properties:", error);
		} finally {
			isSubmitting.value = false;
		}
	};

	// [修改] 长按采购记录，打开操作选项模态框
	const handleProcurementLongPress = (record : ProcurementRecord) => {
		selectedProcurementForAction.value = record;
		uiStore.openModal(MODAL_KEYS.PROCUREMENT_ACTIONS);
	};

	// [新增] 从选项模态框中触发，打开编辑模态框
	const handleEditProcurementOption = () => {
		uiStore.closeModal(MODAL_KEYS.PROCUREMENT_ACTIONS);
		if (selectedProcurementForAction.value) {
			const record = selectedProcurementForAction.value;
			editProcurementForm.id = record.id;
			editProcurementForm.packagesPurchased = record.packagesPurchased;
			// [修改] 计算并填充总价
			editProcurementForm.totalPrice = Number(record.pricePerPackage) * record.packagesPurchased;
			editProcurementForm.purchaseDate = new Date(record.purchaseDate).toISOString().split('T')[0];
			showEditProcurementModal.value = true;
		}
	};

	// [新增] 处理编辑采购记录日期变化
	const onEditProcurementDateChange = (e : any) => {
		editProcurementForm.purchaseDate = e.detail.value;
	};

	// [新增] 提交采购记录更新
	const handleUpdateProcurement = async () => {
		if (!editProcurementForm.id || !ingredient.value) return;
		isSubmitting.value = true;
		try {
			// [修改] 从总价计算单价
			const pricePerPackage = editProcurementForm.totalPrice / editProcurementForm.packagesPurchased;
			if (isNaN(pricePerPackage) || pricePerPackage <= 0) {
				toastStore.show({ message: '请输入有效的采购总价', type: 'error' });
				isSubmitting.value = false;
				return;
			}

			const payload : { pricePerPackage ?: number; purchaseDate ?: string } = {
				pricePerPackage: Number(pricePerPackage.toFixed(2)), // 保留两位小数
				purchaseDate: editProcurementForm.purchaseDate
			};

			await updateProcurement(editProcurementForm.id, payload);
			toastStore.show({ message: '更新成功', type: 'success' });
			showEditProcurementModal.value = false;
			await loadIngredientData(ingredient.value.id);
			await dataStore.fetchIngredientsData();
		} catch (error) {
			console.error("Failed to update procurement:", error);
		} finally {
			isSubmitting.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [兼容性修复] 引入新增的 Mixin */
	@include list-item-option-style;

	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.header-icon {
		width: 24px;
		height: 24px;
	}

	.tag-group {
		margin-bottom: 20px;
		padding: 0px;
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
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
</style>