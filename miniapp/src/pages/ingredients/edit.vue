<template>
	<view class="page-container">
		<!-- [修改] 统一使用 page-header 作为顶部容器 -->
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<!-- [重构] 动态标题 -->
				<h2 class="detail-title">新建原料</h2>
			</view>
		</view>
		<view class="page-content">
			<!-- 原料品类信息 -->
			<view class="card">
				<view class="card-title">原料品类</view>
				<!-- [核心重构] 使用 FormItem 组件 -->
				<FormItem label="原料名称">
					<input class="input-field" v-model="ingredientForm.name" placeholder="例如：高筋粉" />
				</FormItem>
			</view>

			<!-- SKU 信息 -->
			<view class="card">
				<view class="card-title">首个SKU（具体商品）</view>
				<FormItem label="品牌">
					<input class="input-field" v-model="skuForm.brand" placeholder="例如：王后" />
				</FormItem>
				<FormItem label="规格名称">
					<input class="input-field" v-model="skuForm.specName" placeholder="例如：1kg袋装" />
				</FormItem>
				<FormItem label="规格重量 (g)">
					<input class="input-field" type="number" v-model.number="skuForm.specWeightInGrams"
						placeholder="例如：1000" />
				</FormItem>
			</view>

			<!-- 首次采购记录 -->
			<view class="card">
				<view class="card-title">首次采购入库</view>
				<FormItem label="采购包数">
					<input class="input-field" type="number" v-model.number="procurementForm.packagesPurchased"
						placeholder="例如：10" />
				</FormItem>
				<!-- [核心修改] 将“每包单价”改为“采购总价” -->
				<FormItem label="采购总价 (元)">
					<input class="input-field" type="number" v-model.number="procurementForm.totalPrice"
						placeholder="例如：255" />
				</FormItem>
			</view>

			<!-- [修改] 使用新的统一按钮样式 -->
			<button class="btn btn-primary btn-full-width" @click="handleSubmit" :loading="isSubmitting">
				{{ isSubmitting ? '保存中...' : '保存并入库' }}
			</button>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { createIngredient, createSku, createProcurement, setActiveSku } from '@/api/ingredients';
	import { useDataStore } from '@/store/data';
	import FormItem from '@/components/FormItem.vue'; // [核心重构] 引入可复用组件

	const dataStore = useDataStore();
	const isSubmitting = ref(false);

	const ingredientForm = ref({
		name: '',
		type: 'STANDARD' as 'STANDARD' | 'UNTRACKED',
	});

	const skuForm = ref({
		brand: '',
		specName: '',
		specWeightInGrams: 0,
	});

	// [核心修改] 将 pricePerPackage 替换为 totalPrice
	const procurementForm = ref({
		packagesPurchased: 0,
		totalPrice: 0,
	});

	const navigateBack = () => {
		uni.navigateBack();
	};

	const handleSubmit = async () => {
		// [核心修改] 更新表单校验逻辑
		if (!ingredientForm.value.name || !skuForm.value.specName || skuForm.value.specWeightInGrams <= 0 || procurementForm.value.packagesPurchased <= 0 || procurementForm.value.totalPrice <= 0) {
			uni.showToast({ title: '请填写所有必填项', icon: 'none' });
			return;
		}

		isSubmitting.value = true;
		try {
			// 步骤1: 创建原料品类
			const ingredientRes = await createIngredient(ingredientForm.value);
			const ingredientId = ingredientRes.id;

			// 步骤2: 创建SKU
			const skuRes = await createSku(ingredientId, skuForm.value);
			const skuId = skuRes.id;

			// [新增] 步骤2.5: 将新创建的SKU设为激活状态
			await setActiveSku(ingredientId, skuId);

			// [核心修改] 在提交前计算每包单价
			const pricePerPackage = procurementForm.value.totalPrice / procurementForm.value.packagesPurchased;

			// 步骤3: 创建采购记录
			await createProcurement({
				skuId,
				packagesPurchased: procurementForm.value.packagesPurchased,
				pricePerPackage: pricePerPackage, // 传递计算后的单价
				purchaseDate: new Date().toISOString(), // 附带采购日期
			});

			uni.showToast({ title: '原料创建并入库成功', icon: 'success' });

			// 刷新列表数据并返回
			await dataStore.fetchIngredientsData();
			uni.navigateBack();
		} catch (error) {
			console.error("Failed to create ingredient:", error);
			uni.showToast({ title: '创建失败，请重试', icon: 'none' });
		} finally {
			isSubmitting.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [修改] page-header 现在由 common.scss 控制，移除这里的局部样式 */

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

	/* [修改] 移除旧的、分散的按钮样式，它们现在由 common.scss 全局控制 */
</style>