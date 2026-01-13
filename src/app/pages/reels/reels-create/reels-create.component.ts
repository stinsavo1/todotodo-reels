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
import { ModalController, PopoverController } from '@ionic/angular';
import { ResizeService } from '../../../services/resize.service';
import { ReelsHelper } from '../helper/reels.helper';
import { MAX_SIZE_COMMENT, MAX_SIZE_FILE } from '../interfaces/reels.interface';
import { ReelsAdditionalActionsComponent } from '../reels-additional-actions/reels-additional-actions.component';
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
  @Input() isOpenCreateModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  public description: string | null = null;
  public uploadForm: FormGroup<UploadFormType>;
  isMuted: boolean = true;
  public wordCount: number = 0;
  private readonly destroyRef = inject(DestroyRef);
  showDescription = false;

  constructor(public videoService: VideoService,
              private modalCtrl:ModalController,
              public resizeService:ResizeService,
              private popoverCtrl:PopoverController,
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
    this.videoService.onPublish(cleanDescription).then(() => {
      this.modalCtrl.dismiss().then();
    });

  }

  uploadVideo(event: any) {
    const file: File = event.target.files[0];
    if (!file) return;
    this.uploadService.uploadVideo(event,this.auth.currentUser.uid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        console.log('finish',data);
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

  async addDescription() {
    this.showDescription=!this.showDescription;


  }
}
