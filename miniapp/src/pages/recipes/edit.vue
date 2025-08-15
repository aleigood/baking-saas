<template>
	<view class="page-container">
		<!-- [重构] 使用 DetailHeader 组件 -->
		<DetailHeader :title="isEditing ? '创建新版本' : '新建配方'" />
		<view class="page-content">
			<view class="card">
				<FormItem label="配方家族名称">
					<input class="input-field" v-model="form.name" placeholder="例如：贝果" :disabled="isEditing" />
				</FormItem>
				<FormItem v-if="isEditing" label="版本说明">
					<input class="input-field" v-model="form.notes" placeholder="例如：夏季版本，减少水量" />
				</FormItem>
			</view>

			<view v-for="(dough, doughIndex) in form.doughs" :key="doughIndex" class="card">
				<view class="card-title-wrapper">
					<span class="card-title">面团 {{ doughIndex + 1 }}</span>
					<AppButton v-if="form.doughs.length > 1" type="danger" size="sm" @click="removeDough(doughIndex)">
						删除面团</AppButton>
				</view>
				<FormItem label="面团名称">
					<input class="input-field" v-model="dough.name" placeholder="例如：主面团" />
				</FormItem>
				<view v-for="(ing, ingIndex) in dough.ingredients" :key="ingIndex" class="ingredient-row">
					<input class="input-field" v-model="ing.name" placeholder="原料名" />
					<input class="input-field" type="number" v-model.number="ing.ratio" placeholder="比例%" />
					<AppButton type="danger" size="xs" @click="removeIngredient(doughIndex, ingIndex)">-</AppButton>
				</view>
				<AppButton type="dashed" full-width @click="addIngredient(doughIndex)">+ 添加原料</AppButton>
			</view>
			<AppButton type="dashed" full-width @click="addDough">+ 添加面团</AppButton>

			<view v-for="(product, prodIndex) in form.products" :key="prodIndex" class="card">
				<view class="card-title-wrapper">
					<span class="card-title">最终产品 {{ prodIndex + 1 }}</span>
					<AppButton v-if="form.products.length > 1" type="danger" size="sm"
						@click="removeProduct(prodIndex)">删除产品</AppButton>
				</view>
				<FormItem label="产品名称">
					<input class="input-field" v-model="product.name" placeholder="例如：原味贝果" />
				</FormItem>
				<FormItem label="产品克重 (g)">
					<input class="input-field" type="number" v-model.number="product.baseDoughWeight"
						placeholder="例如：100" />
				</FormItem>
			</view>
			<AppButton type="dashed" full-width @click="addProduct">+ 添加最终产品</AppButton>

			<AppButton type="primary" full-width @click="handleSubmit" :loading="isSubmitting">
				{{ isSubmitting ? '' : '保存配方' }}
			</AppButton>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref } from 'vue';
	import { onLoad, onUnload } from '@dcloudio/uni-app';
	import { createRecipe, createRecipeVersion, getRecipeFamily } from '@/api/recipes';
	import { useDataStore } from '@/store/data';
	import { useToastStore } from '@/store/toast';
	import FormItem from '@/components/FormItem.vue';
	import AppButton from '@/components/AppButton.vue';
	import DetailHeader from '@/components/DetailHeader.vue'; // [新增] 引入 DetailHeader 组件
	import type { RecipeVersion } from '@/types/api';

	const dataStore = useDataStore();
	const toastStore = useToastStore();
	const isSubmitting = ref(false);
	const isEditing = ref(false);
	const familyId = ref<string | null>(null);

	const form = ref({
		name: '',
		type: 'MAIN' as const,
		notes: '',
		doughs: [
			{
				name: '主面团',
				targetTemp: 26,
				lossRatio: 0,
				procedure: [],
				ingredients: [
					{ name: '高筋粉', ratio: 100 },
					{ name: '水', ratio: 60 },
					{ name: '酵母', ratio: 1 },
					{ name: '盐', ratio: 2 },
				],
			},
		],
		products: [
			{
				name: '原味',
				baseDoughWeight: 100,
				mixIn: [],
				fillings: [],
				toppings: [],
				procedure: [],
			},
		],
		procedure: [],
	});

	onLoad(async (options) => {
		if (options && options.familyId) {
			isEditing.value = true;
			familyId.value = options.familyId;
			uni.showLoading({ title: '加载配方中...' });
			try {
				const sourceVersionJson = uni.getStorageSync('source_recipe_version');
				if (sourceVersionJson) {
					const sourceVersion : RecipeVersion = JSON.parse(sourceVersionJson);
					const familyData = await getRecipeFamily(familyId.value);
					form.value.name = familyData.name;
					form.value.type = familyData.type;
					form.value.doughs = sourceVersion.doughs.map(d => ({
						name: d.name,
						targetTemp: 0,
						lossRatio: 0,
						procedure: [],
						ingredients: d.ingredients.map(i => ({
							name: i.name,
							ratio: i.ratio,
						})),
					}));
					form.value.products = sourceVersion.products.map(p => ({
						name: p.name,
						baseDoughWeight: p.baseDoughWeight,
						mixIn: [],
						fillings: [],
						toppings: [],
						procedure: [],
					}));
				} else {
					const familyData = await getRecipeFamily(familyId.value);
					const activeVersion = familyData.versions.find(v => v.isActive);
					if (activeVersion) {
						form.value.name = familyData.name;
						form.value.type = familyData.type;
					}
				}
			} catch (error) {
				console.error('Failed to load recipe for editing:', error);
			} finally {
				uni.hideLoading();
			}
		}
	});

	onUnload(() => {
		uni.removeStorageSync('source_recipe_version');
	});

	const addDough = () => {
		form.value.doughs.push({
			name: '',
			targetTemp: 0,
			lossRatio: 0,
			procedure: [],
			ingredients: [{ name: '', ratio: 0 }],
		});
	};

	const removeDough = (index : number) => {
		form.value.doughs.splice(index, 1);
	};

	const addIngredient = (doughIndex : number) => {
		form.value.doughs[doughIndex].ingredients.push({ name: '', ratio: 0 });
	};

	const removeIngredient = (doughIndex : number, ingIndex : number) => {
		form.value.doughs[doughIndex].ingredients.splice(ingIndex, 1);
	};

	const addProduct = () => {
		form.value.products.push({
			name: '',
			baseDoughWeight: 0,
			mixIn: [],
			fillings: [],
			toppings: [],
			procedure: [],
		});
	};

	const removeProduct = (index : number) => {
		form.value.products.splice(index, 1);
	};

	const handleSubmit = async () => {
		isSubmitting.value = true;
		try {
			const payload = {
				name: form.value.name,
				type: form.value.type,
				notes: form.value.notes,
				ingredients: form.value.doughs[0]?.ingredients || [],
				products: form.value.products.map(p => ({
					name: p.name,
					weight: p.baseDoughWeight,
					procedure: p.procedure,
					mixIn: p.mixIn,
					fillings: p.fillings,
					toppings: p.toppings,
				})),
				targetTemp: form.value.doughs[0]?.targetTemp,
				lossRatio: form.value.doughs[0]?.lossRatio,
				procedure: form.value.doughs[0]?.procedure,
			};

			if (isEditing.value && familyId.value) {
				await createRecipeVersion(familyId.value, payload);
			} else {
				await createRecipe(payload);
			}

			toastStore.show({ message: '配方保存成功', type: 'success' });
			await dataStore.fetchRecipesData();
			uni.navigateBack();
		} catch (error) {
			console.error("Failed to save recipe:", error);
		} finally {
			isSubmitting.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.page-container .fab {
		bottom: 20px;
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

		&[disabled] {
			background-color: #e9ecef;
			color: #6c757d;
		}
	}

	.ingredient-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;

		.input-field {
			flex: 1;
		}

		checkbox {
			transform: scale(0.8);
		}
	}
</style>