import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'declension'
})
export class DeclensionPipe implements PipeTransform {

  transform(value: number, one: string, two: string, five: string): string {
    if (value === null || value === undefined) return '';

    if (value >= 1000) {
      return `${this.formatShort(value)} ${five}`;
    }

    const n = Math.abs(value) % 100;
    const n1 = n % 10;

    if (n > 10 && n < 20) return `${value} ${five}`;
    if (n1 > 1 && n1 < 5) return `${value} ${two}`;
    if (n1 === 1) return `${value} ${one}`;

    return `${value} ${five}`;
  }

  private formatShort(value: number): string {
    const suffixes = ['', 'K', 'M', 'B'];
    const suffixNum = Math.floor(("" + value).length / 3);
    let shortValue: any = (value / Math.pow(1000, suffixNum));

    if (shortValue < 10) {
      shortValue = shortValue.toFixed(1).replace(/\.0$/, '');
    } else {
      shortValue = Math.round(shortValue);
    }
    return shortValue + suffixes[suffixNum];
  }
}
