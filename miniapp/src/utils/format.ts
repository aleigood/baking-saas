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
 * [核心新增] 格式化数字，移除末尾多余的零
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