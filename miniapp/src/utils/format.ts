/**
 * 文件路径: src/utils/format.ts
 * 文件描述: 提供统一的格式化函数。
 */

/**
 * 格式化日期为 "YYYY/M/D" 的格式
 * @param dateInput - 可以是日期字符串或Date对象
 * @returns 格式化后的中文字符串，如果输入无效则返回空字符串
 */
export function formatChineseDate(dateInput : string | Date | null | undefined) : string {
	if (!dateInput) {
		return '';
	}
	try {
		const date = new Date(dateInput);
		// 验证日期是否有效
		if (isNaN(date.getTime())) {
			return '';
		}
		const year = date.getFullYear();
		const month = date.getMonth() + 1;
		const day = date.getDate();
		return `${year}/${month}/${day}`;
	} catch (error) {
		console.error('Invalid date input for formatChineseDate:', dateInput);
		return '';
	}
}

/**
 * 格式化日期时间，只返回 "HH:mm" 格式的时间部分
 * @param dateInput - 可以是日期字符串或Date对象
 * @returns 格式化后的时间字符串，如果输入无效则返回空字符串
 */
export function formatTime(dateInput : string | Date | null | undefined) : string {
	if (!dateInput) {
		return '';
	}
	try {
		const date = new Date(dateInput);
		if (isNaN(date.getTime())) {
			return '';
		}
		const hours = String(date.getHours()).padStart(2, '0');
		const minutes = String(date.getMinutes()).padStart(2, '0');
		return `${hours}:${minutes}`;
	} catch (error) {
		console.error('Invalid date input for formatTime:', dateInput);
		return '';
	}
}

/**
 * [新增] 智能格式化事件时间
 * @description 比较两个日期，如果它们是同一天，则只返回事件时间的时和分；否则，返回事件时间的月、日、时和分。
 * @param primaryDateInput - 主要参考日期 (如 plannedDate)
 * @param eventDateInput - 要格式化的事件日期 (如 updatedAt)
 * @returns 格式化后的时间或日期时间字符串
 */
export function formatEventTime(primaryDateInput : string | Date, eventDateInput : string | Date) : string {
	try {
		const primaryDate = new Date(primaryDateInput);
		const eventDate = new Date(eventDateInput);

		if (isNaN(primaryDate.getTime()) || isNaN(eventDate.getTime())) {
			return '';
		}

		const isSameDay =
			primaryDate.getFullYear() === eventDate.getFullYear() &&
			primaryDate.getMonth() === eventDate.getMonth() &&
			primaryDate.getDate() === eventDate.getDate();

		const hours = String(eventDate.getHours()).padStart(2, '0');
		const minutes = String(eventDate.getMinutes()).padStart(2, '0');

		if (isSameDay) {
			return `${hours}:${minutes}`;
		} else {
			const month = eventDate.getMonth() + 1;
			const day = eventDate.getDate();
			return `${month}/${day} ${hours}:${minutes}`;
		}
	} catch (error) {
		console.error('Error in formatEventTime:', error);
		return '';
	}
}


/**
 * 格式化数字，移除末尾多余的零
 * @param num - 需要格式化的数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num : number | string | null | undefined) : string {
	if (num === null || num === undefined) {
		return '0';
	}
	const number = Number(num);
	if (isNaN(number)) {
		return '0';
	}
	// 使用 Number() 构造函数和 toFixed() 来处理浮点数精度问题并移除末尾的零
	return String(Number(number.toFixed(2)));
}