import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'filter',
    standalone: false
})
export class FilterPipe implements PipeTransform {
  transform(items: any[], field: string, value: any): any[] {
    if (!items || !field || value === undefined || value === null) {
      return items; // Возвращаем исходный массив, если данные отсутствуют или некорректны
    }

    return items.filter(item => {
      const fieldValue = item[field]; // Получаем значение поля объекта
      if (fieldValue === undefined || fieldValue === null) {
        return false; // Если поле отсутствует, исключаем элемент
      }

      // Проверяем совпадение значения (для строк делаем регистронезависимое сравнение)
      if (typeof fieldValue === 'string' && typeof value === 'string') {
        return fieldValue.toLowerCase().includes(value.toLowerCase());
      }

      // Для чисел или других типов данных проверяем строгое равенство
      return fieldValue === value;
    });
  }
}
