import { Injectable } from '@angular/core'
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage'
import { AuthService } from './auth.service'

@Injectable({
  providedIn: 'root'
})
export class UploadFileService {
  constructor (private authService: AuthService) {}

  async saveFileToStorage (file: any): Promise<string> {
    const storageRef = ref(
      getStorage(),
      `/users/${this.authService.uid}/i${Date.now()}.jpg`
    )
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  async saveFileStoreToStorage (file: any): Promise<string> {
    const storageRef = ref(
      getStorage(),
      `/store/${this.authService.uid}/i${Date.now()}.jpg`
    )
    const snapshot = await uploadBytes(storageRef, file)
    return await getDownloadURL(snapshot.ref)
  }

  async savePdfToStorage(file: File): Promise<string> {
    const storageRef = ref(
      getStorage(),
      `/users/${this.authService.uid}/${file.name}`
    );
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  }

  async removeFileToStorage(fileUrl: string) {
    const storageRef = ref(getStorage(), fileUrl);
    try {
      await deleteObject(storageRef);
    } catch (error) {
    }
  }

  /**
   * Определяет, является ли файл изображением по MIME-типу или расширению.
   * Безопасно работает даже при отсутствии type или имени.
   */
  private isImageFile(file: File): boolean {
    // Сначала смотрим MIME-type — самый надёжный способ
    if (file.type) {
      return file.type.startsWith('image/');
    }

    // Если type пуст (иногда бывает), проверяем расширение
    const fileName = file.name.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    return imageExtensions.some(ext => fileName.endsWith(ext));
  }

  /**
   * Очищает имя файла: удаляет путь, оставляет только basename.
   * Защищает от path traversal (вроде "../../../etc/passwd").
   */
  private sanitizeFileName(name: string): string {
    if (!name) return 'unknown';

    // Удаляем всё, кроме последнего сегмента после / или \
    let clean = name.trim().replace(/[/\\]+/g, '/').split('/').pop() || name;

    // Удаляем null-байты и другие control-символы
    clean = clean.replace(/[\x00-\x1F\x7F]/g, '');

    // Ограничиваем длину (опционально, для безопасности и читаемости)
    if (clean.length > 255) {
      const extMatch = clean.match(/(\.[^.]+)$/);
      const ext = extMatch ? extMatch[0] : '';
      const namePart = clean.substring(0, 255 - ext.length - 10); // оставляем запас
      clean = `${namePart}…${ext}`;
    }

    return clean || 'unnamed';
  }

  /**
   * Загружает один файл и возвращает: url, isDocument, size, name.
   */
  private async uploadFileToOrder(
    file: File,
    orderId: string
  ): Promise<any> {
    if (!file) {
      throw new Error('File is undefined or null');
    }

    const storage = getStorage();
    const safeFileName = this.sanitizeFileName(file.name);
    const encodedFileName = encodeURIComponent(safeFileName); // для URL в Storage
    const filePath = `/orders/${orderId}/${encodedFileName}`;
    const storageRef = ref(storage, filePath);

    try {
      const snapshot = await uploadBytes(storageRef, file);
      const downloadUrl = await getDownloadURL(snapshot.ref);
      const isDocument = !this.isImageFile(file);

      return {
        url: downloadUrl,
        isDocument,
        size: file.size,
        name: safeFileName // ← человекочитаемое имя для отображения в UI
      };
    } catch (error) {
      console.error(`Failed to upload file "${file.name}" to order "${orderId}"`, error);
      throw new Error(
        `Upload failed for file "${file.name}": ${
          error instanceof Error ? error.message : 'unknown error'
        }`
      );
    }
  }

  /**
   * Загружает несколько файлов и возвращает массив { url, isDocument, size }.
   */
  public async saveOrderFilesToStorage(
    files: File[],
    orderId: string
  ): Promise<any[]> { // ← тип изменён
    if (!files.length) {
      return [];
    }

    if (!orderId?.trim()) {
      throw new Error('Invalid orderId: must be a non-empty string');
    }

    const uploadPromises = files.map(file => this.uploadFileToOrder(file, orderId));
    return await Promise.all(uploadPromises); // ← можно убрать промежуточную переменную
  }
}
