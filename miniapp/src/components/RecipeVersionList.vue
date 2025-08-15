<template>
	<view class="card card-full-bleed-list">
		<view class="card-title-wrapper">
			<!-- [修改] 将标题和标签放在一个容器中，以实现紧邻效果 -->
			<view class="title-with-tag">
				<span class="card-title">配方版本</span>
				<span v-if="isDiscontinued" class="status-tag discontinued">已停用</span>
			</view>
		</view>
		<template v-if="versions.length > 0">
			<ListItem v-for="version in versions" :key="version.id"
				:class="{ 'item-selected': selectedVersionId === version.id }" @click="$emit('select-version', version)"
				@longpress="$emit('longpress-version', version)" :vibrate-on-long-press="canEdit && !version.isActive">
				<view class="main-info">
					<view class="name">{{ version.notes || `版本 ${version.version}` }}
						(v{{ version.version }})</view>
					<view class="desc">创建于:
						{{ formatChineseDate(version.createdAt) }}
					</view>
				</view>
				<view class="side-info">
					<view v-if="version.isActive" class="status-tag active">使用中</view>
				</view>
			</ListItem>
		</template>
		<view v-else class="empty-state" style="padding: 20px 0;">
			暂无版本信息
		</view>
		<AppButton v-if="canEdit" type="text-link" @click="$emit('create-version')">+ 创建新版本</AppButton>
	</view>
</template>

<script setup lang="ts">
	import type { PropType } from 'vue';
	import type { RecipeVersion } from '@/types/api';
	import { formatChineseDate } from '@/utils/format';
	import ListItem from '@/components/ListItem.vue';
	import AppButton from '@/components/AppButton.vue';

	defineProps({
		versions: {
			type: Array as PropType<RecipeVersion[]>,
			default: () => []
		},
		selectedVersionId: {
			type: String as PropType<string | null>,
			default: null
		},
		canEdit: {
			type: Boolean,
			default: false
		},
		isDiscontinued: {
			type: Boolean,
			default: false
		}
	});

	defineEmits(['select-version', 'create-version', 'longpress-version']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	.list-item {
		position: relative;
		cursor: pointer;
		transition: background-color 0.2s ease;
	}

	.list-item.item-selected {
		background-color: transparent;
	}

	.list-item.item-selected::before {
		content: '';
		position: absolute;
		left: 0;
		top: 50%;
		transform: translateY(-50%);
		width: 4px;
		height: 50%;
		background-color: var(--primary-color);
		border-radius: 0 4px 4px 0;
	}

	.card-full-bleed-list {
		padding-left: 0;
		padding-right: 0;
	}

	.card-full-bleed-list .card-title-wrapper {
		padding-left: 20px;
		padding-right: 20px;
	}

	.card-full-bleed-list .list-item {
		padding-left: 20px;
		padding-right: 20px;
	}

	/* [新增] 标题和标签的容器样式 */
	.title-with-tag {
		display: flex;
		align-items: center;
		gap: 10px;
		/* 标题和标签之间的间距 */
	}

	.title-with-tag .card-title {
		margin-bottom: 0;
		/* 移除标题的下边距 */
	}

	.status-tag {
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 13px;
		color: white;
		font-weight: 500;

		&.active {
			background-color: #5ac725;
		}

		&.discontinued {
			background-color: #fee2e2;
			color: #991b1b;
		}
	}
</style>