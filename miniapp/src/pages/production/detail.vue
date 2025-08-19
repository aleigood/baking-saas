<template>
	<!-- [新增] 1. 添加 page-meta 禁止页面级滚动并设置背景色 -->
	<page-meta page-style="overflow: hidden; background-color: #fdf8f2;"></page-meta>
	<!-- [修改] 2. 将根节点改为 page-wrapper 以应用 flex 布局 -->
	<view class="page-wrapper">
		<DetailHeader title="任务详情" />
		<!-- [修改] 3. 使用 DetailPageLayout 组件包裹滚动内容 -->
		<DetailPageLayout>
			<view class="page-content" v-if="!isLoading && task">
				<view class="detail-page">
					<view class="tag-group">
						<span class="tag">日期: {{ formattedDate }}</span>
						<span class="tag">创建人: {{ creatorName }}</span>
						<span class="tag">计划总数: {{ totalQuantity }}</span>
					</view>

					<view class="task-summary-card">
						<view class="product-grid-title">产品列表</view>
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

					<AppButton type="primary" full-width @click="openCompleteTaskModal">
						完成任务
					</AppButton>
				</view>
			</view>
			<view class="loading-spinner" v-else>
				<text>加载中...</text>
			</view>
		</DetailPageLayout>

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
	import { useToastStore } from '@/store/toast';
	import type { ProductionTaskDto } from '@/types/api';
	import { getTask, updateTaskStatus, completeTask } from '@/api/tasks';
	import AppModal from '@/components/AppModal.vue';
	import AppButton from '@/components/AppButton.vue';
	import DetailHeader from '@/components/DetailHeader.vue';
	import DetailPageLayout from '@/components/DetailPageLayout.vue'; // [新增] 引入新的布局组件

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const toastStore = useToastStore();

	const isLoading = ref(true);
	const isSubmitting = ref(false);
	const task = ref<ProductionTaskDto | null>(null);
	const openCardName = ref('');
	const showCompleteTaskModal = ref(false);

	onLoad(async (options) => {
		const taskId = options?.taskId;
		if (!taskId) {
			toastStore.show({ message: '无效的任务ID', type: 'error' });
			uni.navigateBack();
			return;
		}

		try {
			task.value = await getTask(taskId);

			if (task.value?.status === 'PENDING') {
				await updateTaskStatus(taskId, 'IN_PROGRESS');
				await dataStore.fetchProductionData(); // [修改] 确保状态更新后刷新数据
			}

			if (recipeCards.value.length > 0) {
				openCardName.value = recipeCards.value[0].recipeName;
			}

		} catch (error) {
			console.error('Failed to load task details:', error);
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

	const openCompleteTaskModal = () => {
		showCompleteTaskModal.value = true;
	};

	const handleConfirmCompleteTask = async () => {
		if (!task.value) return;
		isSubmitting.value = true;
		try {
			await completeTask(task.value.id, { notes: '' });
			toastStore.show({ message: '任务已完成', type: 'success' });
			await dataStore.fetchProductionData();
			uni.navigateBack();
		} catch (error) {
			// [修改] 增加异常捕获
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
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* [新增] 4. 为页面根元素设置 flex 布局 */
	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
	}

	.detail-page .tag-group {
		margin-bottom: 20px;
		padding: 0px;
		display: flex;
		flex-wrap: wrap;
		gap: 5px;
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