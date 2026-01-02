import {
  ChangeDetectorRef,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnInit,
  Output
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { CommentsWithAvatar, ReelsComment } from '../interfaces/comments.interface';
import { ReelsHelper } from '../helper/reels.helper';
import { MAX_SIZE_COMMENT } from '../interfaces/reels.interface';
import { CommentsService } from '../services/comments.service';

@Component({
  selector: 'app-reels-comments',
  templateUrl: './reels-comments.component.html',
  styleUrls: ['./reels-comments.component.scss'],
  standalone:false,
})
export class ReelsCommentsComponent  implements OnInit,OnChanges {
  @Input() videoId!: string;
  @Input() isOpen: boolean = false;
  @Output() closeModal = new EventEmitter<void>();
  newCommentText: string='';
  comments: CommentsWithAvatar[] = [];
  private readonly destroyRef = inject(DestroyRef);
  constructor(private commentsService: CommentsService,
              private cdr:ChangeDetectorRef,
              private auth: Auth,) { }

  ngOnChanges() {
    if (this.isOpen && this.videoId) {
      this.commentsService.loadComments(this.videoId).then(comments => {console.log(111,comments)});
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
    if (!this.newCommentText || !this.videoId) return;
    const user = this.auth.currentUser;
    if (!user) return;
    let sanitizedText = ReelsHelper.sanitizeText(this.newCommentText);
    if (sanitizedText.length === 0) return;
    if (sanitizedText.length > MAX_SIZE_COMMENT) {
      sanitizedText = sanitizedText.substring(0, MAX_SIZE_COMMENT);
    }
    this.commentsService.postComment(sanitizedText,this.videoId,user).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>{
      this.commentsService.loadComments(this.videoId).then();
      this.newCommentText = '';
    });
  }

  public dismiss(): void {
    this.closeModal.emit();
  }

}
