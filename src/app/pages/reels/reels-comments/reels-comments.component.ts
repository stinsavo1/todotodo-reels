import { Component, DestroyRef, EventEmitter, inject, Input, OnChanges, OnInit, Output } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '@angular/fire/auth';
import { collection, Firestore, onSnapshot, orderBy, query, where } from '@angular/fire/firestore';
import { CommentsWithAvatar, ReelsComment } from '../../../interfaces/comments.interface';
import { CommentsService } from '../../../services/comments.service';

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
  constructor(private commentsService: CommentsService) { }

  ngOnChanges() {
    if (this.isOpen && this.videoId) {
      this.commentsService.loadComments(this.videoId).then(comments => {console.log(111,comments)});
    }
  }

  ngOnInit() {
    this.commentsService.comments$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.comments=data;
      }
    })
  }

  public postComment(): void {
    this.newCommentText=this.newCommentText.trim();
    let sanitizedText = this.newCommentText
      .replace(/<[^>]*>/g, '')
      .trim();
    if (sanitizedText.length === 0) return;
    if (sanitizedText.length > 200) {
      sanitizedText = sanitizedText.substring(0, 200);
    }
    this.commentsService.postComment(sanitizedText,this.videoId).then(comments => {this.newCommentText=''});
  }

  public dismiss(): void {
    this.closeModal.emit();
  }
}
