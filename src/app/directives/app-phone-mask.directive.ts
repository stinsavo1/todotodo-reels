import { Directive, HostListener, Injectable } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
    selector: '[appPhoneMask]',
    standalone: false
})
export class PhoneMaskDirective {

  constructor(private control: NgControl) {}

  @HostListener('ionInput', ['$event'])
  @HostListener('input', ['$event'])
  onIonInput(event: any): void {
    let value = event.target.value.replace(/\D/g, ''); // Удаляем все нецифровые символы

    // Если поле пустое, не добавляем +7, разрешаем стирание всех символов
    if (value.length === 0) {
      this.control.control?.setValue('', { emitEvent: false });
      return;
    }

    // Если первая цифра не 7, добавляем 7 автоматически
    if (!value.startsWith('7')) {
      value = '7' + value;
    }

    // Ограничиваем количество цифр до 11 (включая первую 7)
    value = value.substring(0, 11);

    // Форматирование: +7 (XXX) XXX-XX-XX
    let formattedValue = '+7';
    if (value.length > 1) {
      formattedValue += ` (${value.substring(1, 4)}`;
    }
    if (value.length >= 5) {
      formattedValue += `) ${value.substring(4, 7)}`;
    }
    if (value.length >= 8) {
      formattedValue += `-${value.substring(7, 9)}`;
    }
    if (value.length >= 10) {
      formattedValue += `-${value.substring(9, 11)}`;
    }

    // Обновляем модель ngModel
    this.control.control?.setValue(formattedValue, { emitEvent: false });
  }
}
