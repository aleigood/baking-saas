<template>
	<view class="page-container">
		<!-- [修改] 统一使用 page-header 作为顶部容器 -->
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<!-- [重构] 动态标题 -->
				<h2 class="detail-title">{{ isEditing ? '创建新版本' : '新建配方' }}</h2>
			</view>
		</view>
		<view class="page-content">
			<view class="card">
				<FormItem label="配方家族名称">
					<!-- [重构] 如果是创建新版本，名称不可编辑 -->
					<input class="input-field" v-model="form.name" placeholder="例如：贝果" :disabled="isEditing" />
				</FormItem>
				<!-- [新增] 版本说明输入框，仅在创建新版本时显示 -->
				<FormItem v-if="isEditing" label="版本说明">
					<input class="input-field" v-model="form.notes" placeholder="例如：夏季版本，减少水量" />
				</FormItem>
			</view>

			<!-- 面团部分 -->
			<view v-for="(dough, doughIndex) in form.doughs" :key="doughIndex" class="card">
				<view class="card-title-wrapper">
					<span class="card-title">面团 {{ doughIndex + 1 }}</span>
					<!-- [核心修改] 替换为 AppButton 组件 -->
					<AppButton v-if="form.doughs.length > 1" type="danger" size="sm" @click="removeDough(doughIndex)">
						删除面团</AppButton>
				</view>
				<FormItem label="面团名称">
					<input class="input-field" v-model="dough.name" placeholder="例如：主面团" />
				</FormItem>
				<!-- 面团原料 -->
				<view v-for="(ing, ingIndex) in dough.ingredients" :key="ingIndex" class="ingredient-row">
					<input class="input-field" v-model="ing.name" placeholder="原料名" />
					<input class="input-field" type="number" v-model.number="ing.ratio" placeholder="比例%" />
					<!-- [核心修改] 替换为 AppButton 组件 -->
					<AppButton type="danger" size="xs" @click="removeIngredient(doughIndex, ingIndex)">-</AppButton>
				</view>
				<!-- [核心修改] 替换为 AppButton 组件 -->
				<AppButton type="dashed" full-width @click="addIngredient(doughIndex)">+ 添加原料</AppButton>
			</view>
			<!-- [核心修改] 替换为 AppButton 组件 -->
			<AppButton type="dashed" full-width @click="addDough">+ 添加面团</AppButton>

			<!-- 最终产品部分 -->
			<view v-for="(product, prodIndex) in form.products" :key="prodIndex" class="card">
				<view class="card-title-wrapper">
					<span class="card-title">最终产品 {{ prodIndex + 1 }}</span>
					<!-- [核心修改] 替换为 AppButton 组件 -->
					<AppButton v-if="form.products.length > 1" type="danger" size="sm"
						@click="removeProduct(prodIndex)">删除产品</AppButton>
				</view>
				<FormItem label="产品名称">
					<input class="input-field" v-model="product.name" placeholder="例如：原味贝果" />
				</FormItem>
				<FormItem label="产品克重 (g)">
					<!-- [修改] v-model 绑定到 product.baseDoughWeight -->
					<input class="input-field" type="number" v-model.number="product.baseDoughWeight"
						placeholder="例如：100" />
				</FormItem>
			</view>
			<!-- [核心修改] 替换为 AppButton 组件 -->
			<AppButton type="dashed" full-width @click="addProduct">+ 添加最终产品</AppButton>

			<!-- [核心修改] 替换为 AppButton 组件 -->
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
	import FormItem from '@/components/FormItem.vue';
	import AppButton from '@/components/AppButton.vue'; // [核心新增] 引入 AppButton
	import type { RecipeVersion } from '@/types/api';

	const dataStore = useDataStore();
	const isSubmitting = ref(false);
	const isEditing = ref(false);
	const familyId = ref<string | null>(null);

	const form = ref({
		name: '',
		type: 'MAIN' as const,
		notes: '', // [新增] 版本说明字段
		doughs: [
			{
				name: '主面团',
				targetTemp: 26,
				lossRatio: 0,
				procedure: [],
				// [核心修正] 移除 isFlour 和 waterContent
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
						// [核心修正] 移除 isFlour
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
				uni.showToast({ title: '加载配方失败', icon: 'none' });
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
			// [核心修正] 移除 isFlour 和 waterContent
			ingredients: [{ name: '', ratio: 0 }],
		});
	};

	const removeDough = (index : number) => {
		form.value.doughs.splice(index, 1);
	};

	const addIngredient = (doughIndex : number) => {
		// [核心修正] 移除 isFlour 和 waterContent
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

	const navigateBack = () => {
		uni.navigateBack();
	};

	const handleSubmit = async () => {
		isSubmitting.value = true;
		try {
			// [核心修正] 根据后端接口，将 payload 中的 doughs 字段转换成扁平的 ingredients 字段
			// (Core Fix: Convert the 'doughs' field in the payload to a flat 'ingredients' field to match the backend API)
			const payload = {
				name: form.value.name,
				type: form.value.type,
				notes: form.value.notes,
				// 假设我们总是使用第一个面团的原料列表
				// (Assuming we always use the ingredient list from the first dough)
				ingredients: form.value.doughs[0]?.ingredients || [],
				products: form.value.products.map(p => ({
					name: p.name,
					weight: p.baseDoughWeight,
					procedure: p.procedure,
					mixIn: p.mixIn,
					fillings: p.fillings,
					toppings: p.toppings,
				})),
				// 同样，使用第一个面团的其它属性
				// (Similarly, use other properties from the first dough)
				targetTemp: form.value.doughs[0]?.targetTemp,
				lossRatio: form.value.doughs[0]?.lossRatio,
				procedure: form.value.doughs[0]?.procedure,
			};

			if (isEditing.value && familyId.value) {
				await createRecipeVersion(familyId.value, payload);
			} else {
				await createRecipe(payload);
			}

			uni.showToast({ title: '配方保存成功', icon: 'success' });
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

	/* [新增] 调整 FAB 按钮在没有 TabBar 的页面上的位置 */
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