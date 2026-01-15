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
import { Auth } from '@angular/fire/auth';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { IonTextarea, ModalController, PopoverController } from '@ionic/angular';
import { take } from 'rxjs';
import { PlatformService } from '../../../services/my-service/mobile.service';
import { ResizeService } from '../../../services/resize.service';
import { ReelsHelper } from '../helper/reels.helper';
import { HideDetailModalComponent } from '../hide-detail-modal/hide-detail-modal.component';
import { MAX_SIZE_COMMENT, MAX_SIZE_FILE } from '../interfaces/reels.interface';
import { ReelsAdditionalActionsComponent } from '../reels-additional-actions/reels-additional-actions.component';
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
  @Input() isOpenCreateModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  public description: string | null = null;
  public uploadForm: FormGroup<UploadFormType>;
  isMuted: boolean = true;
  public wordCount: number = 0;
  private readonly destroyRef = inject(DestroyRef);
  showDescription = false;
  isMobile=false;

  constructor(public videoService: VideoService,
              private modalCtrl:ModalController,
              private toastService:ToastService,
              private platformService:PlatformService,
              private auth: Auth, public uploadService:UploadService) {

    this.uploadForm = new FormGroup<UploadFormType>({
      description: new FormControl('', [
        Validators.minLength(3),
        Validators.maxLength(MAX_SIZE_COMMENT)
      ]),
      file: new FormControl('', [Validators.required])
    });
  }

  ngOnInit() {
    this.uploadForm.controls.description.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((value) => {
      const newValue = value.trim() || '';
      this.wordCount = newValue ? newValue.length : 0;
    });
    this.isMobile=this.platformService.isMobile() || window.innerWidth<480;

  }

  ionViewDidEnter() {
    requestAnimationFrame(() => {
      this.fInput.nativeElement.click();
    });
  }

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
    console.log('publish');
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
    this.modalCtrl.dismiss(null,null,'createModal').then();
    this.isModalOpen = false;
    this.toastService.showIonicToast('Ваше видео отправлено. Публикация займет несколько минут').pipe(take(1)).subscribe();
    this.uploadService.processVideo(this.uploadService.uploadedVideo$.value.filePath).pipe( take(1)).subscribe({
      next: (data) => {
        this.videoService.onPublish(cleanDescription).then();
      },
      error:(err)=>{
        this.toastService.showIonicToast('Не удалось опубликовать ваше видео, повторите попытку').pipe(take(1)).subscribe();
      }
    })


  }

  uploadVideo(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;

    this.uploadService.uploadVideo(event).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.uploadService.uploadedVideo$.next({filePath:data.filePath,videoUrl:data.videoUrl});
        this.isModalOpen = true;
      },
      error: (err: any) => {
        console.error(err);
      }
    })



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
    if (window.innerWidth>1280) {
      this.showDescription=!this.showDescription;
    } else {
      this.isModalOpen = true
    }



  }



  public setFocus(): void {
    setTimeout(() => this.textarea.setFocus(), 100);
  }
}
