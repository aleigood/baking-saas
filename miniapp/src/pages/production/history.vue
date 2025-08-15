<template>
	<view class="page-container">
		<view class="page-header">
			<view class="detail-header">
				<view class="back-btn" @click="navigateBack">&#10094;</view>
				<h2 class="detail-title">制作历史</h2>
			</view>
		</view>
		<view class="page-content">
			<!-- [MODIFIED] 修改加载状态判断逻辑，仅在首次加载时显示骨架屏 -->
			<view class="loading-spinner" v-if="isLoading && !dataStore.dataLoaded.historicalTasks">
				<text>加载中...</text>
			</view>
			<template v-else>
				<!-- [REFACTORED] 直接使用从 store 获取并排序后的 groupedTasks 进行渲染 -->
				<view v-if="Object.keys(sortedGroupedTasks).length > 0">
					<view v-for="(tasks, date) in sortedGroupedTasks" :key="date" class="task-group">
						<view class="date-header">{{ date }}</view>
						<ListItem v-for="task in tasks" :key="task.id" class="task-card"
							:class="getStatusClass(task.status)" @click="navigateToDetail(task)">
							<view class="task-info">
								<view class="title">{{ getTaskTitle(task) }}</view>
								<view class="details">{{ getTaskDetails(task) }}</view>
							</view>
							<view class="status-tag" :class="getStatusClass(task.status)">
								{{ getStatusText(task.status) }}
							</view>
						</ListItem>
					</view>
				</view>
				<view v-else class="empty-state">
					<text>暂无历史任务</text>
				</view>
				<!-- [MODIFIED] 加载更多和没有更多的提示 -->
				<view class="load-more-container">
					<view v-if="isLoadingMore" class="loading-spinner">加载中...</view>
					<view v-if="!dataStore.historicalTasksMeta.hasMore && !isLoading" class="no-more-tasks">没有更多了</view>
				</view>
			</template>
		</view>
	</view>
</template>

<script setup lang="ts">
	import { ref, computed } from 'vue';
	import { onShow, onReachBottom } from '@dcloudio/uni-app';
	import { useUserStore } from '@/store/user';
	import { useDataStore } from '@/store/data';
	import type { ProductionTaskDto } from '@/types/api';
	import ListItem from '@/components/ListItem.vue';
	import { formatChineseDate } from '@/utils/format';

	const userStore = useUserStore();
	const dataStore = useDataStore();
	const isLoading = ref(false);
	const isLoadingMore = ref(false);

	onShow(async () => {
		// 只有在数据未加载时才显示全屏loading
		if (!dataStore.dataLoaded.historicalTasks) {
			isLoading.value = true;
			await dataStore.fetchHistoricalTasks(false); // 首次加载
			isLoading.value = false;
		}
	});

	// [MODIFIED] 页面滚动到底部时触发加载更多
	onReachBottom(async () => {
		if (dataStore.historicalTasksMeta.hasMore && !isLoadingMore.value) {
			isLoadingMore.value = true;
			await dataStore.fetchHistoricalTasks(true); // 加载更多
			isLoadingMore.value = false;
		}
	});

	// [ADDED] 对从 store 中获取的已分组数据进行排序
	const sortedGroupedTasks = computed(() => {
		const tasksByDate = dataStore.historicalTasks;
		// 获取所有日期键并进行排序
		const sortedDates = Object.keys(tasksByDate).sort((a, b) => {
			// 将 "M月d日 星期X" 格式转回日期对象进行比较
			// 注意：这依赖于一个稳定的年份，如果跨年需要更复杂的逻辑
			const dateA = new Date(new Date().getFullYear(), parseInt(a.split('月')[0]) - 1, parseInt(a.split('月')[1].split('日')[0]));
			const dateB = new Date(new Date().getFullYear(), parseInt(b.split('月')[0]) - 1, parseInt(b.split('月')[1].split('日')[0]));
			return dateB.getTime() - dateA.getTime();
		});

		// 根据排序后的日期键创建一个新的有序对象
		const sortedGroups : Record<string, ProductionTaskDto[]> = {};
		for (const key of sortedDates) {
			sortedGroups[key] = tasksByDate[key];
		}
		return sortedGroups;
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
		return `${formattedDate} - by ${creator} | 总数: ${totalQuantity}`;
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

	const navigateBack = () => {
		uni.navigateBack();
	};
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	/* 日期分组样式 */
	.task-group {
		margin-bottom: 20px;
	}

	.date-header {
		font-size: 16px;
		font-weight: 600;
		color: var(--text-primary);
		padding: 0 5px 15px;
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
		/* 移除 ListItem 自带的 border-bottom */
		border-bottom: none !important;
	}

	.task-card.status-completed {
		border-color: #a9c1de;
	}

	.task-card.status-cancelled {
		border-color: #a8a8a8;
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

	.status-tag {
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 13px;
		color: white;
		font-weight: 500;
		white-space: nowrap;
	}

	.status-tag.status-completed {
		background-color: #a9c1de;
	}

	.status-tag.status-cancelled {
		background-color: #a8a8a8;
	}

	/* 加载更多提示样式 */
	.load-more-container {
		padding: 15px;
		text-align: center;
		color: #999;
		font-size: 14px;
	}
</style>