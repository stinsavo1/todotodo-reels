import {
  Component,
  DestroyRef,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonTextarea, ModalController } from '@ionic/angular';
import { take } from 'rxjs';
import { PlatformService } from '../../../services/my-service/mobile.service';
import { ReelsHelper } from '../helper/reels.helper';
import { MAX_SIZE_COMMENT } from '../interfaces/reels.interface';
import { ToastService } from '../services/toast.service';
import { UploadService } from '../services/upload.service';
import { VideoService } from '../services/video.service';

interface UploadFormType {
  description: FormControl<string>,
  file: FormControl<string>,
}

@Component({
  selector: 'app-reels-create',
  templateUrl: './reels-create.component.html',
  styleUrls: ['./reels-create.component.scss'],
  standalone: false
})
export class ReelsCreateComponent implements OnInit {
  @ViewChild('fInput') fInput: ElementRef;
  @ViewChild('textarea') textarea: IonTextarea;
  @Input() file: any = null;
  @Output() closeModal = new EventEmitter<void>();
  description: string | null = null;
  uploadForm: FormGroup<UploadFormType>;
  isMuted: boolean = true;
  wordCount: number = 0;
  showDescription = false;
  isMobile = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(public videoService: VideoService,
              private modalCtrl: ModalController,
              private toastService: ToastService,
              private platformService: PlatformService,
              public uploadService: UploadService) {

    this.uploadForm = new FormGroup<UploadFormType>({
      description: new FormControl('', [
        Validators.minLength(3),
        Validators.maxLength(MAX_SIZE_COMMENT)
      ]),
      file: new FormControl('', [])
    });
  }

  ngOnInit() {
    if (this.file) {
      this.uploadForm.controls.file.setValue(this.file);
      this.uploadVideo(this.file);
    } else {
      this.uploadForm.controls.file.setValidators([Validators.required]);
      this.uploadForm.controls.file.updateValueAndValidity();
    }
    this.uploadForm.controls.description.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const newValue = value.trim() || '';
      this.wordCount = newValue ? newValue.length : 0;
    });
    this.isMobile = this.platformService.isMobile() || window.innerWidth < 480;

  }

  // ionViewDidEnter() {
  //   requestAnimationFrame(() => {
  //     this.fInput.nativeElement.click();
  //   });
  // }

  togglePlay(event: Event, player: HTMLVideoElement) {
    event.stopPropagation();
    if (player.paused) {
      player.play().then();
    } else {
      player.pause();
    }
  }

  toggleMute(event: Event) {
    event.stopPropagation();
    this.isMuted = !this.isMuted;
  }

  public dismiss(): void {
    this.deleteVideo();
    this.modalCtrl.dismiss().then();
  }

  public createReels(): void {
    if (this.uploadForm.invalid) {
      const descErr = this.uploadForm.controls.description.errors;
      if (descErr['maxlength']) {
        this.uploadService.errorMessages$.next(`Превышена максимальная длина ${MAX_SIZE_COMMENT}`);
      }
      console.error('Форма заполнена неверно', this.uploadForm);
      return;
    }
    const text = this.uploadForm.value.description;
    const cleanDescription = ReelsHelper.sanitizeText(text);
    this.modalCtrl.dismiss(null, null, 'createModal').then();
    this.isModalOpen = false;
    const value = this.uploadService.uploadedVideo$.value;
    this.toastService.showIonicToast('Ваше видео отправлено. Публикация займет несколько минут').pipe(take(1)).subscribe();
    this.uploadService.processVideo(value.filePath, value.thumbPath, value.reelId).pipe(take(1)).subscribe({
      next: () => {
        this.videoService.onPublish(cleanDescription).then();
      },
      error: () => {
        this.toastService.showIonicToast('Не удалось опубликовать ваше видео, повторите попытку').pipe(take(1)).subscribe();
      }
    });

  }

  uploadVideo(event: any) {
    const file = event.target.files[0];
    this.uploadService.errorMessages$.next(null);
    if (!file) return;
    if (!this.file) {
      this.uploadForm.controls.file.setValue(file);
    }
    this.uploadService.uploadVideo(event).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.uploadService.uploadedVideo$.next({ ...data });
        if (this.isMobile) {

          this.isModalOpen = true;
        } else this.showDescription = true;
      },
      error: (err: any) => {
        console.error(err);
      }
    });

  }

  public deleteVideo(): void {
    const uploadedVideoUrl = this.uploadService.uploadedVideo$.value;
    if (uploadedVideoUrl) {
      this.uploadService.deleteFileFromStorage(uploadedVideoUrl).then();
      this.uploadService.uploadedVideo$.next(null);
    }
    if (this.fInput) {
      this.fInput.nativeElement.value = '';
    }
  }

  seekVideo(event: any, player: HTMLVideoElement) {
    const seekTime = event.target.value;
    player.currentTime = seekTime;
  }

  protected readonly MAX_SIZE_COMMENT = MAX_SIZE_COMMENT;
  protected readonly Math = Math;
  public isModalOpen = false;

  async addDescription() {
    if (window.innerWidth > 1280) {
      this.showDescription = !this.showDescription;
    } else {
      this.isModalOpen = true;
    }

  }

  public setFocus(): void {
    setTimeout(() => this.textarea.setFocus(), 100);
  }
}
