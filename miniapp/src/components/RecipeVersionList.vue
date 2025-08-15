<template>
	<!-- 专门用于显示配方版本列表的组件 -->
	<view class="card card-full-bleed-list">
		<view class="card-title-wrapper">
			<span class="card-title">配方版本</span>
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

	// 定义组件接收的属性
	defineProps({
		// 配方版本列表
		versions: {
			type: Array as PropType<RecipeVersion[]>,
			default: () => []
		},
		// 当前选中的版本ID
		selectedVersionId: {
			type: String as PropType<string | null>,
			default: null
		},
		// 是否有编辑权限
		canEdit: {
			type: Boolean,
			default: false
		}
	});

	// 定义组件可以向外触发的事件
	defineEmits(['select-version', 'create-version', 'longpress-version']);
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';

	// 版本列表项的样式
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

	.status-tag {
		padding: 4px 12px;
		border-radius: 15px;
		font-size: 13px;
		color: white;
		font-weight: 500;

		&.active {
			background-color: #5ac725;
		}
	}
</style>