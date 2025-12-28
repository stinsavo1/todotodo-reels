import {
  Component, ElementRef,
  EventEmitter,
  forwardRef,
  Input,
  Output, ViewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { UploadFileService } from 'src/app/services/upload-file.service';
import { CoreService } from 'src/app/services/core.service';

const CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => FormUpload2Component),
  multi: true,
};

@Component({
    selector: 'form-upload2',
    templateUrl: './form-upload2.component.html',
    styleUrls: ['./form-upload2.component.scss'],
    providers: [CUSTOM_INPUT_CONTROL_VALUE_ACCESSOR],
    standalone: false
})
export class FormUpload2Component {
  @Input() accept = 'image/*, application/pdf';
  @Input() count: number = 0; // Максимальное количество файлов
  @Input() isReadOnly: boolean = true; // Режим только для чтения
  @Input() photoFiles: Array<string> = []; // Для изображений
  @Input() fileList: Array<{ url: string; name: string; type?: string }> = []; // Для PDF файлов
  @ViewChild('file_uploading') fileInput: ElementRef | undefined;

  @Output() photoFilesChange = new EventEmitter<Array<string>>();
  @Output() fileListChange = new EventEmitter<Array<{ url: string; name: string; type?: string }>>();

  isLoadingImage: boolean = false; // Статус загрузки
  isAllowDownload: boolean = true; // Разрешение на загрузку файлов

  constructor(private uploadService: UploadFileService, private core: CoreService) {}

  ngOnInit() {
    // Убедитесь, что массивы инициализированы
    if (!this.photoFiles) {
      this.photoFiles = [];
    }
    if (!this.fileList) {
      this.fileList = [];
    }
    this.changeAllowDownload();
  }

  async addFiles(event: any) {
    const target = event.target || event.srcElement;
    this.isLoadingImage = true;

    const file = target.files[0];
    if (file) {

      // Проверка на максимальный размер
      if (!this.isFileSizeUnderLimit(file, 5)) {
        alert('Файл слишком большой. Максимум 5 МБ.');
        this.isLoadingImage = false;
        return;
      }

      try {
        let fileUrl: string;

        if (this.isAudioFile(file)) {
          fileUrl = await this.uploadService.savePdfToStorage(file); // или saveFileToStorage()
          this.fileList.push({ url: fileUrl, name: file.name, type: file.type });
          this.fileListChange.emit(this.fileList);

        } else if (this.isDocumentFile(file)) {
          fileUrl = await this.uploadService.savePdfToStorage(file);
          this.fileList.push({ url: fileUrl, name: file.name, type: file.type });
          this.fileListChange.emit(this.fileList);

        } else {
          // Остальное — как изображения
          fileUrl = await this.uploadService.saveFileToStorage(file);
          this.photoFiles.push(fileUrl);
          this.photoFilesChange.emit(this.photoFiles);
        }
      } catch (error) {
        console.error('Ошибка при загрузке файла:', error);
      }
    }

    this.isLoadingImage = false;
    this.changeAllowDownload();
  }

  private isFileSizeUnderLimit(file: File, maxSizeInMB: number): boolean {
    const sizeInMB = file.size / (1024 * 1024); // Байты в мегабайты
    return sizeInMB <= maxSizeInMB;
  }

  private isAudioFile(file: File): boolean {
    const audioMimes = [
      'audio/mpeg',
      'audio/mp3',
      'audio/wav',
      'audio/ogg',
      'audio/mp4',
      'audio/aac',
      'audio/flac'
    ];

    const fileNameParts = file.name.split('.');
    const ext = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : '';

    const mimeMatch = audioMimes.includes(file.type);
    const extensionMatch = ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext || '');

    return mimeMatch || extensionMatch;
  }

  private isDocumentFile(file: File): boolean {
    const documentMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain'
    ];

    const documentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

    const mimeTypeMatch = documentMimes.includes(file.type);

    const fileNameParts = file.name.split('.');
    const ext = fileNameParts.length > 1 ? fileNameParts.pop()?.toLowerCase() : '';

    const extensionMatch = ext && documentExtensions.includes(ext);

    return mimeTypeMatch || extensionMatch;
  }

  changeAllowDownload() {
    this.isAllowDownload = this.photoFiles.length + this.fileList.length < this.count;
  }

  removeImage(imageUrl: string) {
    const index = this.photoFiles.indexOf(imageUrl);
    if (index > -1) {
      this.photoFiles.splice(index, 1);
      this.uploadService.removeFileToStorage(imageUrl);
      this.photoFilesChange.emit(this.photoFiles);
    }
  }

  removePdf(pdf: { url: string; name: string }) {
    const index = this.fileList.indexOf(pdf);
    if (index > -1) {
      this.fileList.splice(index, 1);
      this.uploadService.removeFileToStorage(pdf.url);
      this.fileListChange.emit(this.fileList);
    }
  }

  openFullImage(file: string) {
    this.core.openFullImage(file, false, this.removeImage.bind(this));
  }

  addFilesFake(event: MouseEvent, el: HTMLInputElement) {
    el.click();
  }
}
