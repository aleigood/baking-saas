import { defineStore } from 'pinia';
import { ref } from 'vue';

type ToastType = 'success' | 'error' | 'info';

export const useToastStore = defineStore('toast', () => {
	const isVisible = ref(false);
	const message = ref('');
	const type = ref<ToastType>('info');
	// [修改] 明确指定 timer 的类型，以提高在 uni-app 环境中的兼容性
	let timer : ReturnType<typeof setTimeout> | null = null;

	function show(options : { message : string; type ?: ToastType; duration ?: number }) {
		// [修改] 每次显示前都确保旧的定时器被清除
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}

		message.value = options.message;
		type.value = options.type || 'info';
		isVisible.value = true;

		// [修改] 在定时器回调中直接修改状态，并清空timer引用
		timer = setTimeout(() => {
			isVisible.value = false;
			timer = null;
		}, options.duration || 2000);
	}

	function hide() {
		isVisible.value = false;
		// [新增] hide函数也应该能清除定时器，以备手动关闭时使用
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
	}

	return {
		isVisible,
		message,
		type,
		show,
		hide,
	};
});