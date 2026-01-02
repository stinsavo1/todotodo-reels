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
import { MAX_SIZE_COMMENT, MAX_SIZE_FILE } from '../interfaces/reels.interface';
import { VideoService } from '../services/video.service';
import { ReelsHelper } from '../helper/reels.helper';

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

  constructor(public videoService: VideoService, private auth: Auth) {
    this.uploadForm = new FormGroup<UploadFormType>({
      description: new FormControl('', [
        Validators.required,
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
    })

  }

  togglePlay(event: Event,player: HTMLVideoElement) {
    console.log('togglePlay', player);
    event.stopPropagation();
    if (player.paused) {
      player.play().then();
    } else {
      player.pause();
    }
  }

  toggleMute(event: Event) {
    console.log('toggleMute', event);
    event.stopPropagation();
    this.isMuted = !this.isMuted;
  }

  public dismiss(): void {
    this.deleteVideo();
    this.closeModal.emit();
  }

  public createReels(): void {
    if (this.uploadForm.invalid) {
      const descErr = this.uploadForm.controls.description.errors;
      if (descErr['maxlength']) {
      this.videoService.errorMessages$.next(`Превышена максимальная длина ${MAX_SIZE_COMMENT}`);
      }
      console.error('Форма заполнена неверно',this.uploadForm);
      return;
    }
    const text = this.uploadForm.value.description;
    const cleanDescription = ReelsHelper.sanitizeText(text);
    this.videoService.onPublish(cleanDescription).then(() => {
      this.closeModal.emit();
    });

  }

  uploadVideo(event: any) {
    this.videoService.uploadVideo(event, this.auth.currentUser.uid).then();
  }

  public deleteVideo(): void {
    const uploadedVideoUrl = this.videoService.uploadedVideoUrl$.value;
    if (uploadedVideoUrl) {
      this.videoService.deleteFileFromStorage(uploadedVideoUrl).then();
      this.videoService.uploadedVideoUrl$.next(null);
    }
    if (this.fInput) {
      this.fInput.nativeElement.value = '';
    }
  }

  public updateProgress(videoPlayer: HTMLVideoElement): void {
    console.log('videoPlayer', videoPlayer);
  }

  seekVideo(event: any, player: HTMLVideoElement) {
    console.log('seekVideo', player);
    const seekTime = event.target.value;
    player.currentTime = seekTime;
  }

  protected readonly MAX_SIZE_COMMENT = MAX_SIZE_COMMENT;
  protected readonly MAX_SIZE_FILE = MAX_SIZE_FILE;
}
