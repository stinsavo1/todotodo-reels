import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class CardService {

  getCardType(cardNumber: string): string {
    const cardPatterns = [
      { type: 'MIR', pattern: /^(220[0-9]{12,15}|22[1-9][0-9]{12,15}|2[3-6][0-9]{13,16}|27[01][0-9]{12,15}|2720[0-9]{12,15})$/ }, // MIR: длина 16–19
      { type: 'Visa', pattern: /^4[0-9]{12,15}$/ }, // Visa: длина 16–19
      { type: 'Mastercard', pattern: /^(5[1-5][0-9]{14}|2[2-7][0-9]{14})$/ }, // Mastercard: длина ровно 16
    ];

    // Проверяем паттерны в порядке приоритетности
    for (const card of cardPatterns) {
      if (card.pattern.test(cardNumber)) {
        return card.type;
      }
    }

    return 'Unknown';
  }

  // Метод для проверки валидности карты с помощью алгоритма Луна
  isValidCardNumber(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;

    // Удаляем пробелы из номера карты
    cardNumber = cardNumber.replace(/\s/g, '');

    // Проверяем каждый символ справа налево
    for (let i = cardNumber.length - 1; i >= 0; i--) {
      let digit = parseInt(cardNumber.charAt(i), 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return (sum % 10) === 0;
  }
}
