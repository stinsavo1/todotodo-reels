import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'declination',
  standalone: true
})
/**
 * Пайп для склонения числительных
 * @param {number | string} number Число, для которого будет расчитано окончание
 * @param {string} words Слово и варианты окончаний для 1|2|1 (1 комментарий, 2 комментария, 100 комментариев)
 * @return {string} Cлово с правильным окончанием
 */
export class DeclinationPipe implements PipeTransform {
  transform(value: number | string, words: string[], withValue: boolean = true): string {
    value = +value;
    const label =
      ' ' +
      words[value % 100 > 4 && value % 100 < 20 ? 2 : [2, 0, 1, 1, 1, 2][value % 10 < 5 ? Math.abs(value) % 10 : 5]];
    return withValue ? value + label : label;
  }
}
