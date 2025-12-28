
// YYYY-MM-DD
export function formatDate(dateInput: string): string {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date input');
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export const toMoscowDate = (date: any) => {
  const offset = 3; // для UTC+3
  return new Date(date.getTime() + offset * 60 * 60 * 1000);
};

export function removeEmpty(obj: any): any {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

export function removeEmptyAll(obj: any): any {
  return Object.entries(obj)
    .filter(([_, v]) => v != null)
    .filter(([_, v]) => v !== '')
    .filter(([_, v]: [string, any]) => v?.length !== 0)
    .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {});
}

export function getMoscowTime(): string {
  const now = new Date();

  // Получаем UTC время в миллисекундах
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);

  // Создаём новый объект для времени по UTC+3 (Москва)
  const moscowTime = new Date(utcTime + (3 * 3600000)); // +3 часа к UTC

  const day = String(moscowTime.getDate()).padStart(2, '0');
  const month = String(moscowTime.getMonth() + 1).padStart(2, '0'); // Месяцы с 0
  const year = moscowTime.getFullYear();
  const hours = String(moscowTime.getHours()).padStart(2, '0');
  const minutes = String(moscowTime.getMinutes()).padStart(2, '0');

  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

export function normalizeAndValidatePhone(phone: any) {
  const wordToDigit = {
    "ноль": "0",
    "один": "1",
    "два": "2",
    "три": "3",
    "четыре": "4",
    "пять": "5",
    "шесть": "6",
    "семь": "7",
    "восемь": "8",
    "девять": "9",
    "десять": "10",
    "одиннадцать": "11",
    "двенадцать": "12",
    "тринадцать": "13",
    "четырнадцать": "14",
    "пятнадцать": "15",
    "шестнадцать": "16",
    "семнадцать": "17",
    "восемнадцать": "18",
    "девятнадцать": "19",
    "двадцать": "20",
    "тридцать": "30",
    "сорок": "40",
    "пятьдесят": "50",
    "шестьдесят": "60",
    "семьдесят": "70",
    "восемьдесят": "80",
    "девяносто": "90",
    "сто": "100",
    "двести": "200",
    "триста": "300",
    "четыреста": "400",
    "пятьсот": "500",
    "шестьсот": "600",
    "семьсот": "700",
    "восемьсот": "800",
    "девятьсот": "900"
  };

  // Удаляем все символы, кроме букв и цифр
  let cleanedPhone = phone.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');

  // Заменяем слова на цифры
  for (const [word, digit] of Object.entries(wordToDigit)) {
    cleanedPhone = cleanedPhone.replace(new RegExp(word, 'g'), digit);
  }

  // Удаляем все символы, кроме цифр
  let normalizedPhone = cleanedPhone.replace(/[^0-9]/g, '');

  // Если длина номера 10 цифр, добавляем код страны (7 или 8)
  if (normalizedPhone.length === 10) {
    normalizedPhone = '7' + normalizedPhone; // или '8', если нужно
  }

  // Проверяем, что номер имеет длину 11 цифр и начинается с 7 или 8
  if (/^[78]\d{10}$/.test(normalizedPhone)) {
    return normalizedPhone; // Возвращаем нормализованный номер
  }

  return null; // Некорректный номер
}

export function findAndValidatePhone(text: string): string | null {
  const phoneMatches = text.match(/[78]\d{10}/g);

  if (!phoneMatches) return null;

  for (const match of phoneMatches) {
    const normalized = normalizeAndValidatePhone(match);
    if (normalized) return normalized;
  }

  return null;
}

export function isSocialLink(url: string) {
  const vkRegex = /^(https?:\/\/)?(www\.)?(vk\.com|vkontakte\.ru)\/.+/i;
  const telegramRegex = /^(https?:\/\/)?(www\.)?(t\.me|telegram\.org)\/.+/i;
  const whatsappRegex = /^(https?:\/\/)?(www\.)?(wa\.me|api\.whatsapp\.com)\/.+/i;
  const viberRegex = /^(https?:\/\/)?(www\.)?(viber\.com|chats\.viber\.com)\/.+/i;

  // Проверяем, соответствует ли URL одной из платформ
  if (vkRegex.test(url)) {
    return "Это ссылка на ВКонтакте";
  } else if (telegramRegex.test(url)) {
    return "Это ссылка на Telegram";
  } else if (whatsappRegex.test(url)) {
    return "Это ссылка на WhatsApp";
  } else if (viberRegex.test(url)) {
    return "Это ссылка на Viber";
  } else {
    return null;
  }
}
