<template>
	<view class="page-header">
		<view class="store-selector" @click="uiStore.openModal(MODAL_KEYS.STORE)">
			{{ dataStore.currentTenant?.name || '请选择店铺' }} &#9662;
		</view>
		<IconButton circle class="user-avatar" @click="uiStore.openModal(MODAL_KEYS.USER_OPTIONS)">
			{{ userStore.userInfo?.name?.[0] || '管' }}
		</IconButton>
	</view>
</template>

<script setup lang="ts">
	import { useUiStore } from '@/store/ui';
	import { useDataStore } from '@/store/data';
	import { useUserStore } from '@/store/user';
	import { MODAL_KEYS } from '@/constants/modalKeys';
	import IconButton from '@/components/IconButton.vue';

	const uiStore = useUiStore();
	const dataStore = useDataStore();
	const userStore = useUserStore();
</script>

<style scoped lang="scss">
	@import '@/styles/common.scss';
</style>