export enum OrderStatusEnum {
  // Новый заказ, если кто-то написал то в заявки на работу.
  NEW_ORDER = 'NEW_ORDER',
  // Заказ отдан, в статусе в работе
  CONFIRM = 'CONFIRM',
  // Отказали до начал работы,
  REJECTION_WITHOUT_START = 'REJECTION_WITHOUT_START',
  // Отправлено предложение
  SEND_OFFER = 'SEND_OFFER',

  // Когда уже в работе
  // Заказчик отметил как выполнен
  CONFIRM_CUSTOMER = 'CONFIRM_CUSTOMER',
  // Клиент отметил как выполнен
  CONFIRM_EXECUTOR = 'CONFIRM_EXECUTOR',
  // Кто-то отказался от заказа идет в архив
  REJECTION = 'REJECTION',
  // Если обе стороны нажали выполнить
  COMPLETED = 'COMPLETED',
  // Заказ передан другому
  TRANSFERRED = 'TRANSFERRED',

  PRIVATE_FACTORY = 'PRIVATE_FACTORY',
  PRIVATE_AGENCY = 'PRIVATE_AGENCY',
  PRIVATE_STORE = 'PRIVATE_STORE',
  PRIVATE_SERVICES = 'PRIVATE_SERVICES',
  BUY = 'BUY'
}
