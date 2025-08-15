import { defineStore } from 'pinia';
import { ref } from 'vue';

type ToastType = 'success' | 'error' | 'info';

export const useToastStore = defineStore('toast', () => {
	const isVisible = ref(false);
	const message = ref('');
	const type = ref<ToastType>('info');
	let timer : ReturnType<typeof setTimeout> | null = null;

	function show(options : { message : string; type ?: ToastType; duration ?: number }) {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}

		message.value = options.message;
		type.value = options.type || 'info';
		isVisible.value = true;

		timer = setTimeout(() => {
			hide();
		}, options.duration || 2000);
	}

	function hide() {
		isVisible.value = false;
	}

	return {
		isVisible,
		message,
		type,
		show,
		hide,
	};
});