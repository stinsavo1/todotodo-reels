import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
    name: 'phoneMask',
    standalone: false
})
export class PhoneMaskPipe implements PipeTransform {
  transform(value: string): string {
    if (!value) return '';

    const cleaned = value.replace(/\D/g, '');

    const match = cleaned.match(/^(7|8)?(\d{3})(\d{3})(\d{2})(\d{2})$/);
    if (match) {
      return `+7 (${match[2]}) ${match[3]}-${match[4]}-${match[5]}`;
    }
    return value; // Возвращаем оригинал, если не удалось отформатировать
  }
}
