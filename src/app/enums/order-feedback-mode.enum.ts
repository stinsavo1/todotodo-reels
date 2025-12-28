export enum OrderFeedbackModeEnum {
  RECOMMENDATION = 'recommendation',
  COMPLAINT = 'complaint'
}
export const FeedbackModeMap: Map<OrderFeedbackModeEnum, string> = new Map([
  [OrderFeedbackModeEnum.RECOMMENDATION, 'Рекомендация'],
  [OrderFeedbackModeEnum.COMPLAINT, 'Претензия']
]);
