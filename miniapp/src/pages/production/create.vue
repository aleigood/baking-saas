<template>
	<page-meta page-style="overflow: hidden; background-color: #fdf8f2;"></page-meta>
	<view class="page-wrapper">
		<DetailHeader title="新建生产任务" />
		<DetailPageLayout>
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
								<view class="quantity-control">
									<StepperButton @click="decreaseQuantity(product.id)">
										<image class="stepper-icon" src="/static/icons/remove.svg" />
									</StepperButton>
									<input class="input-stepper" type="number"
										v-model.number="taskQuantities[product.id]" />
									<StepperButton @click="increaseQuantity(product.id)">
										<image class="stepper-icon" src="/static/icons/add.svg" />
									</StepperButton>
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
		</DetailPageLayout>
		<Toast />
	</view>
</template>

<script setup lang="ts">
	import { ref, computed, reactive } from 'vue';
	import { onShow } from '@dcloudio/uni-app';
	import { useDataStore } from '@/store/data';
	import { useToastStore } from '@/store/toast';
	import { createTask } from '@/api/tasks';
	import AppButton from '@/components/AppButton.vue';
	import DetailHeader from '@/components/DetailHeader.vue';
	import StepperButton from '@/components/StepperButton.vue';
	// 3. 引入 DetailPageLayout
	import DetailPageLayout from '@/components/DetailPageLayout.vue';
	import type { ProductionTaskDto } from '@/types/api';
	import Toast from '@/components/Toast.vue';

	// [新增] 禁用属性继承，以解决多根节点组件的警告
	defineOptions({
		inheritAttrs: false
	});

	const dataStore = useDataStore();
	const isLoading = ref(false);
	const isCreating = ref(false);
	const taskQuantities = reactive<Record<string, number>>({});
	const collapsedGroups = reactive(new Set<string>());
	const toastStore = useToastStore();

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
			toastStore.show({ message: '请输入要生产的数量', type: 'error' });
			return;
		}

		isCreating.value = true;
		try {
			const payload = {
				plannedDate: new Date().toISOString(),
				products: productsToCreate,
			};
			// [修改] 接收新的接口返回数据
			const res = await createTask(payload);

			// [修改] 任务创建成功后，检查是否有库存警告信息
			if (res.warning) {
				// [新增] 如果有警告信息，则通过toast提示用户，持续3秒
				toastStore.show({ message: res.warning, type: 'error', duration: 3000 });
			} else {
				// [修改] 如果没有警告信息，显示常规的成功提示
				toastStore.show({ message: '任务已创建', type: 'success' });
			}

			await dataStore.fetchProductionData();

			// [修改] 延迟返回，确保用户能看到toast提示
			setTimeout(() => {
				uni.navigateBack();
			}, 500);

		} catch (error) {
			console.error('Failed to create tasks:', error);
		} finally {
			isCreating.value = false;
		}
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* 5. 添加 page-wrapper 样式 */
	.page-wrapper {
		display: flex;
		flex-direction: column;
		height: 100vh;
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
	}
</style>