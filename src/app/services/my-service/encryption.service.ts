import { Injectable } from '@angular/core';
import { getFunctions, httpsCallable } from 'firebase/functions';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private key: CryptoKey | null = null;

  /**
   * Импорт ключа шифрования из Secret Manager
   */
  async importKey(): Promise<CryptoKey> {
    if (!this.key) {
      // Получаем функцию Cloud Functions для получения секрета
      const functions = getFunctions();
      const getEncryptionKey = httpsCallable(functions, 'getEncryptionKey');

      try {
        // Вызываем функцию для получения ключа
        const result = await getEncryptionKey();
        // @ts-ignore
        const encryptionKeyBase64 = result.data.encryptionKey;

        // Декодируем Base64-строку в Uint8Array
        const encoder = new TextEncoder();
        const keyBuffer = encoder.encode(atob(encryptionKeyBase64));

        // Импортируем ключ в формат CryptoKey
        this.key = await window.crypto.subtle.importKey(
          'raw',
          keyBuffer,
          { name: 'AES-CBC' },
          true, // Можно экспортировать ключ
          ['encrypt', 'decrypt']
        );
      } catch (error) {
        console.error('Ошибка при импорте ключа:', error);
        throw new Error('Не удалось импортировать ключ шифрования');
      }
    }
    return this.key;
  }

  /**
   * Шифрование данных
   * @param plaintext - Исходный текст
   * @returns Объект с зашифрованными данными и IV
   */
  async encrypt(plaintext: string): Promise<{ encryptedData: string; iv: string }> {
    const key = await this.importKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(plaintext);

    // Генерация случайного IV
    const iv = window.crypto.getRandomValues(new Uint8Array(16));

    // Шифрование
    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv,
      },
      key,
      data
    );

    // Конвертация в Base64
    const encryptedArray = new Uint8Array(encryptedData);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return { encryptedData: encryptedBase64, iv: ivBase64 };
  }

  /**
   * Дешифрование данных
   * @param encryptedData - Зашифрованный текст
   * @param iv - Вектор инициализации
   * @returns Расшифрованный текст
   */
  async decrypt(encryptedData: string, iv: string): Promise<string> {
    const key = await this.importKey();

    // Декодирование из Base64
    const encryptedArray = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const ivArray = Uint8Array.from(atob(iv), (c) => c.charCodeAt(0));

    // Дешифрование
    const decryptedData = await window.crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: ivArray,
      },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedData);
  }
}
