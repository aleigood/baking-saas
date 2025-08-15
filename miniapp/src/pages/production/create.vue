<template>
	<view class="page-container">
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<h2 class="detail-title">新建生产任务</h2>
			</view>
		</view>
		<view class="page-content">
			<view class="loading-spinner" v-if="isLoading">
				<text>加载中...</text>
			</view>
			<template v-else>
				<view v-for="(group, groupName) in groupedProducts" :key="groupName" class="card product-group">
					<view class="group-title" @click="toggleGroup(groupName)">
						<span>{{ groupName }}</span>
						<span class="arrow" :class="{ collapsed: collapsedGroups.has(groupName) }">&#10094;</span>
					</view>
					<view v-show="!collapsedGroups.has(groupName)" class="product-list">
						<view v-for="product in group" :key="product.id" class="product-item">
							<view class="product-name">{{ product.name }}</view>
							<!-- [核心修改] 将步进器代码直接内置在模板中 -->
							<view class="quantity-control">
								<!-- 减号按钮 -->
								<view class="btn-stepper" @click="decreaseQuantity(product.id)">
									<image class="stepper-icon"
										src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a98467'%3E%3Cpath d='M19 13H5v-2h14v2z'/%3E%3C/svg%3E" />
								</view>
								<!-- 输入框 -->
								<input class="input-stepper" type="number"
									v-model.number="taskQuantities[product.id]" />
								<!-- 加号按钮 -->
								<view class="btn-stepper" @click="increaseQuantity(product.id)">
									<image class="stepper-icon"
										src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23a98467'%3E%3Cpath d='M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z'/%3E%3C/svg%3E" />
								</view>
							</view>
						</view>
					</view>
				</view>
				<AppButton type="primary" full-width :disabled="!hasTasksToCreate" @click="handleCreateTasks"
					:loading="isCreating">
					{{ isCreating ? '' : '创建任务' }}
				</AppButton>
			</template>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, reactive } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useDataStore } from '@/store/data';
	import { createTask } from '@/api/tasks';
	import AppButton from '@/components/AppButton.vue';
	// [核心修改] 移除对 StepperButton 的引用
	// import StepperButton from '@/components/StepperButton.vue';
	import type { ProductionTaskDto } from '@/types/api';

	const dataStore = useDataStore();
	const isLoading = ref(false);
	const isCreating = ref(false);
	const taskQuantities = reactive<Record<string, number>>({});
	const collapsedGroups = reactive(new Set<string>());

	onShow(async () => {
		isLoading.value = true;
		if (!dataStore.dataLoaded.recipes) {
			await dataStore.fetchRecipesData();
		}
		isLoading.value = false;
	});

	const groupedProducts = computed(() => {
		return dataStore.productList.reduce((groups, product) => {
			const groupName = product.type;
			if (!groups[groupName]) {
				groups[groupName] = [];
			}
			groups[groupName].push(product);
			if (taskQuantities[product.id] === undefined) {
				taskQuantities[product.id] = 0;
			}
			return groups;
		}, {} as Record<string, typeof dataStore.productList>);
	});

	const toggleGroup = (groupName : string) => {
		if (collapsedGroups.has(groupName)) {
			collapsedGroups.delete(groupName);
		} else {
			collapsedGroups.add(groupName);
		}
	};

	const hasTasksToCreate = computed(() => {
		return Object.values(taskQuantities).some(qty => qty > 0);
	});

	// [核心修改] 将加减数量的逻辑直接内置，不再依赖外部组件事件
	const increaseQuantity = (productId : string) => {
		taskQuantities[productId]++;
	};
	const decreaseQuantity = (productId : string) => {
		if (taskQuantities[productId] > 0) {
			taskQuantities[productId]--;
		}
	};

	const handleCreateTasks = async () => {
		const productsToCreate = Object.entries(taskQuantities)
			.filter(([, quantity]) => quantity > 0)
			.map(([productId, quantity]) => ({
				productId,
				quantity,
			}));

		if (productsToCreate.length === 0) {
			uni.showToast({ title: '请输入要生产的数量', icon: 'none' });
			return;
		}

		isCreating.value = true;
		uni.showLoading({ title: '正在生成任务...' });
		try {
			const payload = {
				plannedDate: new Date().toISOString(),
				products: productsToCreate,
			};
			await createTask(payload);
			uni.hideLoading();
			uni.showToast({ title: '任务创建成功', icon: 'success' });
			await dataStore.fetchProductionData();
			uni.navigateBack();
		} catch (error) {
			uni.hideLoading();
			console.error('Failed to create tasks:', error);
		} finally {
			isCreating.value = false;
		}
	};

	const navigateBack = () => {
		uni.navigateBack();
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.page-container {
		padding-bottom: 20px;
	}

	.product-group {
		margin-bottom: 20px;
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

	.product-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 12px 5px;
	}

	.product-name {
		font-size: 15px;
		flex: 1;
		margin-right: 10px;
	}

	.quantity-control {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	// [新增] 内置的步进器按钮样式
	.btn-stepper {
		width: 30px;
		height: 30px;
		padding: 0;
		background-color: #f3e9e3;
		border-radius: 50%;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.stepper-icon {
		width: 16px;
		height: 16px;
	}

	.input-stepper {
		width: 40px;
		height: 30px;
		text-align: center;
		border: none;
		background-color: var(--bg-color);
		font-size: 16px;
		border-radius: 8px;
		/* [新增] 为输入框添加圆角 */
	}
</style>