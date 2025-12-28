import { Injectable } from '@angular/core';
import { Storage, ref, deleteObject } from '@angular/fire/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {

  constructor(private storage: Storage) { }

  /**
   * Удаление файла из Firebase Storage по его URL.
   * @param fileUrl - URL файла, который нужно удалить.
   */
  async deleteFileByUrl(fileUrl: string): Promise<void> {
    try {
      // Извлекаем путь к файлу из URL
      const filePath = this.getFilePathFromUrl(fileUrl);

      const fileRef = ref(this.storage, filePath);

      await deleteObject(fileRef);
      console.log('Файл успешно удален:', fileUrl);
    } catch (error) {
      console.error('Ошибка при удалении файла:', error);
    }
  }

  /**
   * Извлечение пути к файлу из полного URL.
   * @param fileUrl - Полный URL файла.
   * @returns Путь к файлу в Firebase Storage.
   */
  private getFilePathFromUrl(fileUrl: string): string {
    // Разбираем URL, чтобы извлечь путь
    const urlParts = fileUrl.split('%2F');
    const fileName = urlParts.pop()?.split('?')[0];
    const folderPath = urlParts.join('/').split('/o/')[1];

    return `${folderPath}/${fileName}`;
  }
}
