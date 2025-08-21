<template>
	<page-meta page-style="overflow: hidden; background-color: #fdf8f2;"></page-meta>
	<view class="page-wrapper">
		<DetailHeader title="新建原料" />
		<DetailPageLayout>
			<view class="page-content">
				<view class="card">
					<view class="card-title">原料品类</view>
					<FormItem label="原料名称">
						<input class="input-field" v-model="ingredientForm.name" placeholder="例如：高筋粉" />
					</FormItem>
				</view>

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

				<view class="card">
					<view class="card-title">首次采购入库</view>
					<FormItem label="采购包数">
						<input class="input-field" type="number" v-model.number="procurementForm.packagesPurchased"
							placeholder="例如：10" />
					</FormItem>
					<FormItem label="采购总价 (元)">
						<input class="input-field" type="number" v-model.number="procurementForm.totalPrice"
							placeholder="例如：255" />
					</FormItem>
				</view>

				<AppButton type="primary" full-width @click="handleSubmit" :loading="isSubmitting">
					{{ isSubmitting ? '保存中...' : '保存并入库' }}
				</AppButton>
			</view>
		</DetailPageLayout>
		<Toast />
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { createIngredient, createSku, createProcurement, setActiveSku } from '@/api/ingredients';
	import { useDataStore } from '@/store/data';
	import { useToastStore } from '@/store/toast';
	import FormItem from '@/components/FormItem.vue';
	import AppButton from '@/components/AppButton.vue';
	import Toast from '@/components/Toast.vue';
	import DetailHeader from '@/components/DetailHeader.vue';
	import DetailPageLayout from '@/components/DetailPageLayout.vue';

	// [新增] 禁用属性继承，以解决多根节点组件的警告
	defineOptions({
		inheritAttrs: false
	});

	const dataStore = useDataStore();
	const toastStore = useToastStore();
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

	const procurementForm = ref({
		packagesPurchased: 0,
		totalPrice: 0,
	});

	const handleSubmit = async () => {
		if (!ingredientForm.value.name || !skuForm.value.specName || skuForm.value.specWeightInGrams <= 0 || procurementForm.value.packagesPurchased <= 0 || procurementForm.value.totalPrice <= 0) {
			toastStore.show({ message: '请填写所有必填项', type: 'error' });
			return;
		}

		isSubmitting.value = true;
		try {
			const ingredientRes = await createIngredient(ingredientForm.value);
			const ingredientId = ingredientRes.id;

			const skuRes = await createSku(ingredientId, skuForm.value);
			const skuId = skuRes.id;

			await setActiveSku(ingredientId, skuId);

			const pricePerPackage = procurementForm.value.totalPrice / procurementForm.value.packagesPurchased;

			await createProcurement({
				skuId,
				packagesPurchased: procurementForm.value.packagesPurchased,
				pricePerPackage: pricePerPackage,
				purchaseDate: new Date().toISOString(),
			});

			toastStore.show({ message: '原料创建并入库成功', type: 'success' });

			await dataStore.fetchIngredientsData();
			uni.navigateBack();
		} catch (error) {
			console.error("Failed to create ingredient:", error);
		} finally {
			isSubmitting.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
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