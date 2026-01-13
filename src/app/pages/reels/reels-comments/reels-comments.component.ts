import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output, SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { ModalController } from '@ionic/angular';
import { finalize } from 'rxjs';
import { ResizeService } from '../../../services/resize.service';
import { CommentsWithAvatar, ReelsComment } from '../interfaces/comments.interface';
import { ReelsHelper } from '../helper/reels.helper';
import { MAX_SIZE_COMMENT, Reel } from '../interfaces/reels.interface';
import { CommentsService } from '../services/comments.service';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-reels-comments',
  templateUrl: './reels-comments.component.html',
  styleUrls: ['./reels-comments.component.scss'],
  standalone:false,
})
export class ReelsCommentsComponent  implements OnInit,OnChanges {
  @Input() reel!: Reel;
  @Input() activeIndex!: number;
  newCommentText: string='';
  comments: CommentsWithAvatar[] = [];
  disableButton = false;
  private readonly destroyRef = inject(DestroyRef);
  constructor(private commentsService: CommentsService,
              private cdr:ChangeDetectorRef,
              private auth: Auth,
              private modalCtrl:ModalController,
              public resizeService: ResizeService,
              private videoService:VideoService
              ) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reel']) {
      this.reel=changes['reel'].currentValue
      this.cdr.markForCheck();
    }

  }

  ngOnInit() {
    this.commentsService.comments$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.comments=[...data];
        this.cdr.markForCheck();
      }
    })
  }

  public postComment(): void {
    this.newCommentText=this.newCommentText.trim();
    if (!this.newCommentText || !this.reel) return;
    const user = this.auth.currentUser;
    if (!user) return;
    let sanitizedText = ReelsHelper.sanitizeText(this.newCommentText);
    if (sanitizedText.length === 0) return;
    if (sanitizedText.length > MAX_SIZE_COMMENT) {
      sanitizedText = sanitizedText.substring(0, MAX_SIZE_COMMENT);
    }
    this.disableButton=true;
    this.commentsService.postComment(sanitizedText,this.reel,user).pipe(finalize(()=>this.disableButton=false),takeUntilDestroyed(this.destroyRef)).subscribe((data)=>{
      if (data.reelId) {
        const currentReels = { ...this.videoService.currentReel$.value };
        currentReels.commentsCount = (currentReels.commentsCount || 0) + 1;
        this.videoService.currentReel$.next(currentReels);
        this.videoService.updateReels(currentReels,this.activeIndex);
        this.videoService.videoListUpdated$.next(true);
      }
      this.commentsService.loadComments(this.reel.id).then();
      this.newCommentText = '';
    });
  }

  public dismiss(): void {
    this.modalCtrl.dismiss(true).then();
  }

}
