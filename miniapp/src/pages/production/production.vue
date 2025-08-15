<template>
	<view>
		<view class="page-header">
			<view class="store-selector" @click="uiStore.openModal('store')">
				{{ dataStore.currentTenant?.name || '请选择店铺' }} &#9662;
			</view>
			<IconButton circle class="user-avatar" @click="uiStore.openModal('userOptions')">
				{{ userStore.userInfo?.name?.[0] || '管' }}
			</IconButton>
		</view>

		<view class="page-content page-content-with-tabbar-fab">
			<view class="summary-card">
				<div>
					<view class="value">{{ homeStats.pendingCount }}</view>
					<view class="label">待完成</view>
				</div>
				<div>
					<view class="value">{{ homeStats.completedThisWeekCount }}</view>
					<view class="label">本周已完成</view>
				</div>
			</view>

			<view class="card-title-wrapper">
				<span class="card-title">进行中的任务</span>
				<view class="header-actions">
					<IconButton v-if="hasCompletedTasks" @click="navigateToHistory">
						<image class="header-icon"
							src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238c5a3b'%3E%3Cpath d='M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.25 2.52.77-1.28-3.52-2.09V8H12z'/%3E%3C/svg%3E" />
					</IconButton>
					<IconButton @click="navigateToStats">
						<image class="header-icon"
							src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%238c5a3b'%3E%3Cpath d='M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6h-6z'/%3E%3C/svg%3E" />
					</IconButton>
				</view>
			</view>

			<view v-if="isInitialLoad" class="loading-spinner">
				<text>加载中...</text>
			</view>
			<view v-else-if="sortedTasks.length > 0">
				<ListItem v-for="task in sortedTasks" :key="task.id" @click="navigateToDetail(task)"
					@longpress="openTaskActions(task)" :vibrate-on-long-press="true" class="task-card"
					:class="getStatusClass(task.status)">
					<view class="task-info">
						<view class="title">{{ getTaskTitle(task) }}</view>
						<view class="details">{{ getTaskDetails(task) }}</view>
					</view>
					<view class="status-tag" :class="getStatusClass(task.status)">
						{{ getStatusText(task.status) }}
					</view>
				</ListItem>
			</view>
			<view v-else class="empty-state">
				<text>暂无进行中的任务</text>
			</view>
		</view>

		<AppFab @click="navigateToCreatePage" />

		<AppModal v-model:visible="showTaskOptions" title="制作任务" :no-header-line="true">
			<view class="options-list">
				<ListItem class="option-item" @click="handleCancelTaskFromModal">
					<view class="main-info">
						<view class="name">取消任务</view>
					</view>
				</ListItem>
			</view>
		</AppModal>
	</view>
</template>

<script setup lang="ts">
	import {
		ref,
		computed,
		reactive
	} from 'vue';
	import {
		onShow
	} from '@dcloudio/uni-app';
	import {
		useUserStore
	} from '@/store/user';
	import {
		useDataStore
	} from '@/store/data';
	import {
		useUiStore
	} from '@/store/ui';
	import AppModal from '@/components/AppModal.vue';
	import AppFab from '@/components/AppFab.vue';
	import ListItem from '@/components/ListItem.vue';
	import IconButton from '@/components/IconButton.vue';
	import AppButton from '@/components/AppButton.vue';
	import type {
		ProductionTaskDto
	} from '@/types/api';
	import {
		updateTaskStatus
	} from '@/api/tasks';
	import {
		getProductionHomeStats
	} from '@/api/stats';
	import {
		formatChineseDate
	} from '@/utils/format';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const uiStore = useUiStore();

	const isSubmitting = ref(false);
	const selectedTaskForAction = ref<ProductionTaskDto | null>(null);

	// [新增] 用于控制新选项对话框显示的状态变量
	const showTaskOptions = ref(false);

	const homeStats = reactive({
		pendingCount: 0,
		completedThisWeekCount: 0,
	});

	// [新增] 用于在页面数据首次加载时显示一个占位符的标志
	const isInitialLoad = ref(true);

	const fetchHomeStats = async () => {
		try {
			const stats = await getProductionHomeStats();
			homeStats.pendingCount = stats.pendingCount;
			homeStats.completedThisWeekCount = stats.completedThisWeekCount;
		} catch (error) {
			console.error('Failed to fetch home stats:', error);
			uni.showToast({
				title: '加载统计数据失败',
				icon: 'none'
			});
		}
	};

	onShow(async () => {
		// [重构] 移除主页面的全屏加载动画，改用异步加载数据
		// 同时检查数据是否已加载，如果未加载，设置 isInitialLoad 为 true
		if (!dataStore.dataLoaded.production) {
			isInitialLoad.value = true;
			await Promise.all([
				dataStore.fetchProductionData(),
				fetchHomeStats()
			]);
			isInitialLoad.value = false;
		} else {
			// 如果数据已加载，仍然需要更新统计信息
			await fetchHomeStats();
			// 如果数据已经加载过，直接将初始加载状态设置为 false
			isInitialLoad.value = false;
		}
	});

	// [核心修改] 重新组织任务列表的排序逻辑
	const sortedTasks = computed(() => {
		const activeTasks = dataStore.production.filter(
			task => task.status === 'PENDING' || task.status === 'IN_PROGRESS'
		);

		// 将任务分为进行中和待开始两组
		const inProgressTasks = activeTasks.filter(task => task.status === 'IN_PROGRESS');
		const pendingTasks = activeTasks.filter(task => task.status === 'PENDING');

		// 对两组任务分别按创建时间倒序排序
		inProgressTasks.sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());
		pendingTasks.sort((a, b) => new Date(b.plannedDate).getTime() - new Date(a.plannedDate).getTime());

		// 合并并返回排序后的任务列表
		return [...inProgressTasks, ...pendingTasks];
	});

	const hasCompletedTasks = computed(() => {
		return dataStore.production.some(task => task.status === 'COMPLETED');
	});

	const getTaskTitle = (task : ProductionTaskDto) => {
		if (!task.items || task.items.length === 0) {
			return '未知任务';
		}
		return task.items.map(item => `${item.product.name} x${item.quantity}`).join('、');
	};

	const getTotalQuantity = (task : ProductionTaskDto) => {
		if (!task.items) return 0;
		return task.items.reduce((sum, item) => sum + item.quantity, 0);
	};

	const getTaskDetails = (task : ProductionTaskDto) => {
		const formattedDate = formatChineseDate(task.plannedDate);
		const creator = userStore.userInfo?.name || userStore.userInfo?.phone || '创建人';
		const totalQuantity = getTotalQuantity(task);
		return `${formattedDate} - by ${creator} | 计划总数: ${totalQuantity}`;
	};

	const getStatusText = (status : ProductionTaskDto['status']) => {
		const map = {
			PENDING: '待开始',
			IN_PROGRESS: '进行中',
			COMPLETED: '已完成',
			CANCELLED: '已取消'
		};
		return map[status] || '未知';
	};

	const getStatusClass = (status : ProductionTaskDto['status']) => {
		const map = {
			PENDING: 'status-pending',
			IN_PROGRESS: 'status-inprogress',
			COMPLETED: 'status-completed',
			CANCELLED: 'status-cancelled'
		};
		return map[status] || '';
	};

	const navigateToDetail = (task : ProductionTaskDto) => {
		uni.navigateTo({
			url: `/pages/production/detail?taskId=${task.id}`
		});
	};

	const navigateToHistory = () => {
		uni.navigateTo({
			url: '/pages/production/history'
		});
	};

	// [核心新增] 跳转到统计页面的方法
	const navigateToStats = () => {
		uni.navigateTo({
			url: '/pages/production/stats'
		});
	};

	// [修改] 此方法现在用于打开新的选项对话框
	const openTaskActions = (task : ProductionTaskDto) => {
		selectedTaskForAction.value = task;
		showTaskOptions.value = true; // 触发新的对话框
	};

	const handleCancelTaskFromModal = async () => {
		if (!selectedTaskForAction.value) return;

		isSubmitting.value = true;
		try {
			await updateTaskStatus(selectedTaskForAction.value.id, 'CANCELLED');
			uni.showToast({
				title: '任务已取消',
				icon: 'success'
			});
			await dataStore.fetchProductionData();
		} catch (error) {
			console.error('Failed to cancel task:', error);
			uni.showToast({
				title: '操作失败，请重试',
				icon: 'none'
			});
		} finally {
			isSubmitting.value = false;
			showTaskOptions.value = false; // [修改] 关闭新的对话框
			selectedTaskForAction.value = null;
		}
	};

	const navigateToCreatePage = () => {
		uni.navigateTo({
			url: '/pages/production/create',
		});
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.summary-card {
		display: flex;
		justify-content: space-around;
		background: var(--card-bg);
		padding: 20px;
		border-radius: 20px;
		margin-bottom: 20px;
		text-align: center;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
	}

	.summary-card .value {
		font-size: 22px;
		font-weight: bold;
		color: var(--primary-color);
	}

	.summary-card .label {
		font-size: 14px;
		color: var(--text-secondary);
		margin-top: 5px;
	}

	.task-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		background: var(--card-bg);
		padding: 20px;
		border-radius: 20px;
		margin-bottom: 15px;
		cursor: pointer;
		box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
		border-left: 5px solid;
		border-bottom: none !important;
	}

	.task-card.status-pending {
		border-color: #d4a373;
	}

	.task-card.status-inprogress {
		border-color: #27ae60;
	}

	.task-info {
		flex: 1;
		margin-right: 15px;
	}

	.task-card .title {
		font-size: 16px;
		font-weight: 400;
		margin-bottom: 8px;
		word-break: break-all;
		overflow: hidden;
		text-overflow: ellipsis;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		line-height: 1.4;
	}

	.task-card .details {
		color: var(--text-secondary);
		font-size: 14px;
	}

	/* [核心新增] 新增 header-actions 容器样式 */
	.header-actions {
		display: flex;
		gap: 8px;
	}

	.header-icon {
		width: 24px;
		height: 24px;
	}

	.status-tag {
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 13px;
		color: white;
		font-weight: 500;
		white-space: nowrap;
	}

	.status-tag.status-pending {
		background-color: #d4a373;
	}

	.status-tag.status-inprogress {
		background-color: #27ae60;
	}

	.status-tag.status-completed {
		background-color: #a9c1de;
	}

	.status-tag.status-cancelled {
		background-color: #a8a8a8;
	}
</style>