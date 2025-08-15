<template>
	<view class="page-container">
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<h2 class="detail-title">任务详情</h2>
			</view>
		</view>
		<view class="page-content" v-if="!isLoading && task">
			<!-- [核心修改] 将详情信息用标签形式展示在页面顶部 -->
			<view class="detail-page">
				<view class="tag-group">
					<span class="tag">日期: {{ formattedDate }}</span>
					<span class="tag">创建人: {{ creatorName }}</span>
					<span class="tag">计划总数: {{ totalQuantity }}</span>
				</view>

				<view class="task-summary-card">
					<view class="product-grid-title">产品列表</view>
					<!-- [核心修改] 按配方大类对产品进行分组展示 -->
					<view v-for="group in groupedProducts" :key="group.familyName" class="product-group">
						<view class="product-group-title">{{ group.familyName }}</view>
						<view class="product-grid">
							<view v-for="product in group.products" :key="product.id" class="product-grid-item">
								{{ product.name }} x{{ product.quantity }}
							</view>
						</view>
					</view>
				</view>

				<view v-for="(recipeCard) in recipeCards" :key="recipeCard.recipeName" class="card">
					<view class="group-title" @click="toggleCard(recipeCard.recipeName)">
						<span>{{ recipeCard.recipeName }}</span>
						<span class="arrow"
							:class="{ collapsed: openCardName !== recipeCard.recipeName }">&#10094;</span>
					</view>
					<view v-show="openCardName === recipeCard.recipeName" class="product-list">
						<view v-for="ingredient in recipeCard.ingredients" :key="ingredient.name"
							class="ingredient-item">
							<view class="product-name">{{ ingredient.name }}</view>
							<view class="quantity">{{ ingredient.amount.toFixed(1) }} g</view>
						</view>
					</view>
				</view>

				<!-- [核心修改] 点击按钮现在会打开确认模态框 -->
				<button class="btn btn-primary btn-full-width" @click="openCompleteTaskModal">
					完成任务
				</button>
			</view>
		</view>
		<view class="loading-spinner" v-else>
			<text>加载中...</text>
		</view>

		<!-- [核心新增] 完成任务的确认模态框 -->
		<AppModal v-model:visible="showCompleteTaskModal" title="确认完成任务">
			<view class="modal-prompt-text">
				您确定要完成这个任务吗？
			</view>
			<view class="modal-warning-text">
				完成后，将根据配方用量自动扣减原料库存。
			</view>
			<view class="modal-actions">
				<AppButton type="secondary" @click="showCompleteTaskModal = false">取消</AppButton>
				<AppButton type="primary" @click="handleConfirmCompleteTask" :loading="isSubmitting">
					{{ isSubmitting ? '完成中...' : '确认完成' }}
				</AppButton>
			</view>
		</AppModal>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onLoad } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import type { ProductionTaskDto } from '@/types/api';
	import { getTask, updateTaskStatus, completeTask } from '@/api/tasks';
	import AppModal from '@/components/AppModal.vue';
	import AppButton from '@/components/AppButton.vue'; // [核心新增]

	const userStore = useUserStore();
	const dataStore = useDataStore();

	const isLoading = ref(true);
	const isSubmitting = ref(false); // [核心新增]
	const task = ref<ProductionTaskDto | null>(null);
	const openCardName = ref('');
	const showCompleteTaskModal = ref(false); // [核心新增]

	onLoad(async (options) => {
		const taskId = options?.taskId;
		if (!taskId) {
			uni.showToast({ title: '无效的任务ID', icon: 'none' });
			uni.navigateBack();
			return;
		}

		try {
			task.value = await getTask(taskId);

			if (task.value?.status === 'PENDING') {
				await updateTaskStatus(taskId, 'IN_PROGRESS');
				dataStore.fetchProductionData();
			}

			if (recipeCards.value.length > 0) {
				openCardName.value = recipeCards.value[0].recipeName;
			}

		} catch (error) {
			console.error('Failed to load task details:', error);
			uni.showToast({ title: '加载失败', icon: 'none' });
		} finally {
			isLoading.value = false;
		}
	});

	const groupedProducts = computed(() => {
		if (!task.value || !task.value.items) {
			return [];
		}

		const groups = new Map<string, {
			id : string;
			name : string;
			quantity : number
		}[]>();

		task.value.items.forEach(item => {
			const familyName = item.product.recipeVersion.family.name;
			if (!groups.has(familyName)) {
				groups.set(familyName, []);
			}
			groups.get(familyName)!.push({
				id: item.product.id,
				name: item.product.name,
				quantity: item.quantity
			});
		});

		return Array.from(groups.entries()).map(([familyName, products]) => ({
			familyName,
			products
		}));
	});

	const recipeCards = computed(() => {
		if (!task.value) return [];

		const recipeConsumptions = new Map<string, Map<string, number>>();

		task.value.items.forEach(item => {
			const product = item.product;
			if (!product || !product.recipeVersion || !product.recipeVersion.doughs) return;

			const recipeName = product.recipeVersion.family.name;
			if (!recipeConsumptions.has(recipeName)) {
				recipeConsumptions.set(recipeName, new Map<string, number>());
			}
			const ingredientsMap = recipeConsumptions.get(recipeName)!;

			product.recipeVersion.doughs.forEach(dough => {
				let totalFlourRatio = 0;
				dough.ingredients.forEach(ing => {
					if (ing.isFlour) {
						totalFlourRatio += ing.ratio;
					}
				});
				if (totalFlourRatio === 0) totalFlourRatio = 100;

				const weightPerRatioPoint = product.baseDoughWeight / totalFlourRatio;

				dough.ingredients.forEach(ingredient => {
					const weight = weightPerRatioPoint * ingredient.ratio * item.quantity;
					const currentWeight = ingredientsMap.get(ingredient.name) || 0;
					ingredientsMap.set(ingredient.name, currentWeight + weight);
				});
			});
		});

		return Array.from(recipeConsumptions.entries()).map(([recipeName, ingredientsMap]) => ({
			recipeName,
			ingredients: Array.from(ingredientsMap.entries()).map(([name, amount]) => ({
				name,
				amount,
			})),
		}));
	});

	const toggleCard = (recipeName : string) => {
		if (openCardName.value === recipeName) {
			openCardName.value = '';
		} else {
			openCardName.value = recipeName;
		}
	};

	// [核心新增] 打开确认模态框
	const openCompleteTaskModal = () => {
		showCompleteTaskModal.value = true;
	};

	// [核心修改] 将原有的完成任务逻辑移到这里
	const handleConfirmCompleteTask = async () => {
		if (!task.value) return;
		isSubmitting.value = true;
		try {
			await completeTask(task.value.id, { notes: '' });
			uni.showToast({ title: '任务已完成', icon: 'success' });
			await dataStore.fetchProductionData();
			uni.navigateBack();
		} catch (error) {
			console.error('Failed to complete task:', error);
		} finally {
			isSubmitting.value = false;
			showCompleteTaskModal.value = false;
		}
	};

	const getTotalQuantity = (task : ProductionTaskDto) => {
		if (!task.items) return 0;
		return task.items.reduce((sum, item) => sum + item.quantity, 0);
	};

	const formattedDate = computed(() => {
		if (!task.value) return '';
		const date = new Date(task.value.plannedDate);
		return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`;
	});

	const creatorName = computed(() => {
		if (!task.value) return '';
		return userStore.userInfo?.name || userStore.userInfo?.phone || '创建人';
	});

	const totalQuantity = computed(() => {
		if (!task.value) return 0;
		return getTotalQuantity(task.value);
	});

	const navigateBack = () => {
		uni.navigateBack();
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.detail-page .tag-group {
		margin-bottom: 20px;
		padding: 0 5px;
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.task-summary-card {
		background: var(--card-bg);
		padding: 20px;
		border-radius: 20px;
		margin-bottom: 20px;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	}

	.product-grid-title {
		font-size: 18px;
		font-weight: 600;
		margin-bottom: 12px;
		color: var(--text-primary);
		padding-bottom: 12px;
		border-bottom: 1px solid var(--border-color);
	}

	.product-group {
		margin-bottom: 15px;

		&:last-child {
			margin-bottom: 0;
		}
	}

	.product-group-title {
		font-size: 15px;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.product-grid {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr;
		gap: 8px 12px;
	}

	.product-grid-item {
		font-size: 14px;
		color: var(--text-secondary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}


	.details {
		color: var(--text-secondary);
		font-size: 14px;
	}

	.group-title {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		padding: 0 5px 15px 5px;
		border-bottom: 1px solid var(--border-color);
	}

	.arrow {
		font-size: 14px;
		color: var(--text-secondary);
		transform: rotate(90deg);
		transition: transform 0.3s ease;
	}

	.arrow.collapsed {
		transform: rotate(-90deg);
	}

	.product-list {
		padding-top: 10px;
	}

	.ingredient-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 5px;
		font-size: 15px;
	}

	.quantity {
		color: var(--text-primary);
		font-weight: 500;
	}

	/* [核心新增] 与其他模态框统一的样式 */
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