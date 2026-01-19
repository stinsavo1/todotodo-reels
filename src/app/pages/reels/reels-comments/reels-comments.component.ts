import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { ModalController } from '@ionic/angular';
import { finalize, take } from 'rxjs';
import { ResizeService } from '../../../services/resize.service';
import { ReelsHelper } from '../helper/reels.helper';
import { CommentsWithAvatar } from '../interfaces/comments.interface';
import { MAX_SIZE_COMMENT, Reel } from '../interfaces/reels.interface';
import { CommentsService } from '../services/comments.service';
import { SwiperService } from '../services/swiper.service';

@Component({
  selector: 'app-reels-comments',
  templateUrl: './reels-comments.component.html',
  styleUrls: ['./reels-comments.component.scss'],
  standalone: false,
})
export class ReelsCommentsComponent implements OnInit, OnChanges {
  @Input() reel!: Reel;
  @Input() userId!: string;
  @Input() activeIndex!: number;
  newCommentText: string = '';
  comments: CommentsWithAvatar[] = [];
  disableButton = false;
  editMode = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private commentsService: CommentsService,
              private cdr: ChangeDetectorRef,
              private modalCtrl: ModalController,
              private swiperService: SwiperService,
              public resizeService: ResizeService,
  ) {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['reel']) {
      this.reel = changes['reel'].currentValue;
      this.cdr.markForCheck();
    }

  }

  ngOnInit() {
    this.commentsService.comments$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.comments = [...data];
        this.cdr.markForCheck();
      }
    });
  }

  public postComment(): void {
    this.newCommentText = this.newCommentText.trim();
    if (!this.newCommentText || !this.reel) return;
    if (!this.userId) return;
    this.disableButton = true;
    this.commentsService.postComment(this.checkAndFixComment(this.newCommentText), this.reel, this.userId).pipe(finalize(() => this.disableButton = false), takeUntilDestroyed(this.destroyRef)).subscribe((data) => {
      if (data.reelId) {
        const count = this.reel.commentsCount;
        this.reel.commentsCount =count+1;
      }
      this.commentsService.loadComments(this.reel.id).then();
      this.newCommentText = '';
    });
  }

  public dismiss(): void {
    this.modalCtrl.dismiss(true).then();
  }

  public saveEdit(index:number, comment:CommentsWithAvatar): void {
    this.disableButton = true;
    this.editMode = false;
    this.commentsService.updateComment(comment.id,comment.text).pipe(take(1)).subscribe({
      next: () => {
        this.disableButton=false;
      }
    })

  }

  public deleteComment(comment: CommentsWithAvatar,index:number): void {
    this.disableButton = true;
    this.commentsService.deleteComment(comment.id, this.reel.id).pipe(take(1)).subscribe({
      next: () => {
        this.comments.splice(index,1);
        this.disableButton = false;
        const count = this.reel.commentsCount;
        this.reel.commentsCount =Math.max(count - 1, 0);
      }
    })
  }

  private checkAndFixComment(comment:string):string {
    const sanitizedText = ReelsHelper.sanitizeText(comment);
    if (sanitizedText.length === 0) return '';
    if (sanitizedText.length > MAX_SIZE_COMMENT) {
     return sanitizedText.substring(0, MAX_SIZE_COMMENT);
    }
    return  sanitizedText
  }


}
