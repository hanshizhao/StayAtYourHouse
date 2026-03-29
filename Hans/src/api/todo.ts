import type {
  DeferReminderInput,
  DeferralListResult,
  RenewRentalInput,
  TodoListResult,
  TodoType,
} from '@/api/model/todoModel';
import { TodoType as TodoTypeEnum } from '@/api/model/todoModel';
import { request } from '@/utils/request';

const Api = {
  List: '/api/todo/list',
  Defer: '/api/todo/rental-reminder',
  Renew: '/api/todo/rental-reminder',
  Deferrals: '/api/todo/rental-reminder',
};

/**
 * 将 TodoType 枚举转换为后端期望的字符串
 */
function todoTypeToString(type?: TodoType): string | undefined {
  if (type === undefined) return undefined;
  return type === TodoTypeEnum.Utility ? 'utility' : 'rental';
}

/**
 * 获取待办事项列表
 * @param type 待办类型筛选（可选）
 * @param page 页码
 * @param pageSize 每页数量
 */
export function getTodoList(type?: TodoType, page = 1, pageSize = 10) {
  return request.get<TodoListResult>({
    url: Api.List,
    params: { type: todoTypeToString(type), page, pageSize },
  });
}

/**
 * 宽限提醒（推迟催收）
 * @param reminderId 提醒ID
 * @param input 宽限输入
 */
export function deferReminder(reminderId: number, input: DeferReminderInput) {
  return request.post<void>({
    url: `${Api.Defer}/${reminderId}/defer`,
    data: input,
  });
}

/**
 * 续租处理
 * @param reminderId 提醒ID
 * @param input 续租输入
 */
/**
 * 续租处理
 * @param reminderId 提醒ID
 * @param input 续租输入
 * @returns 新租赁记录ID
 */
export function renewRental(reminderId: number, input: RenewRentalInput) {
  return request.post<number>({
    url: `${Api.Renew}/${reminderId}/renew`,
    data: input,
  });
}

/**
 * 获取宽限记录列表
 * @param reminderId 提醒ID
 */
export function getDeferrals(reminderId: number) {
  return request.get<DeferralListResult>({
    url: `${Api.Deferrals}/${reminderId}/deferrals`,
  });
}
