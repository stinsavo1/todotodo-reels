import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'shortName',
    standalone: false
})
export class ShortNamePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) {
      return ''; // Возвращаем пустую строку, если значение отсутствует
    }

    const parts = value.split(' '); // Разделяем строку на слова
    return `${parts[0]} ${parts[1] || ''}`.trim(); // Возвращаем только первые два слова
  }
}
