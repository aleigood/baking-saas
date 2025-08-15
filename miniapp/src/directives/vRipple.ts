/**
 * 文件路径: src/directives/vRipple.ts
 * 文件描述: [新增] 创建一个 Vue 自定义指令来处理水波纹效果。
 */
import type { Directive, DirectiveBinding } from 'vue';

interface RippleHTMLElement extends HTMLElement {
	_ripple ?: {
		enabled : boolean;
		handler : (e : PointerEvent) => void;
	};
}

const rippleHandler = (e : PointerEvent) => {
	const el = e.currentTarget as RippleHTMLElement;
	if (!el || !el._ripple?.enabled) {
		return;
	}

	const rect = el.getBoundingClientRect();
	const ripple = document.createElement('span');
	const size = Math.max(rect.width, rect.height) * 2;

	ripple.style.width = `${size}px`;
	ripple.style.height = `${size}px`;
	ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
	ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
	ripple.className = 'ripple';

	el.appendChild(ripple);

	setTimeout(() => {
		ripple.remove();
	}, 600);
};

const vRipple : Directive<RippleHTMLElement> = {
	mounted(el : RippleHTMLElement, binding : DirectiveBinding) {
		el._ripple = {
			enabled: binding.value !== false,
			handler: rippleHandler,
		};

		// 确保父元素有必要的样式
		const style = window.getComputedStyle(el);
		if (style.position === 'static') {
			el.style.position = 'relative';
		}
		el.style.overflow = 'hidden';

		el.addEventListener('pointerdown', el._ripple.handler);
	},

	updated(el : RippleHTMLElement, binding : DirectiveBinding) {
		if (el._ripple) {
			el._ripple.enabled = binding.value !== false;
		}
	},

	unmounted(el : RippleHTMLElement) {
		if (el._ripple) {
			el.removeEventListener('pointerdown', el._ripple.handler);
			delete el._ripple;
		}
	},
};

export default vRipple;