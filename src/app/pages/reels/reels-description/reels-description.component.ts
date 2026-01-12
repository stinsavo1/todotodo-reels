import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { Reel } from '../interfaces/reels.interface';
import { VideoService } from '../services/video.service';

@Component({
  selector: 'app-reels-description',
  templateUrl: './reels-description.component.html',
  styleUrls: ['./reels-description.component.scss'],
  standalone: false
})
export class ReelsDescriptionComponent implements OnInit, OnChanges {
  @ViewChild('descText', { static: false }) set content(content: ElementRef) {
    if (content) {
      this.descElement = content;
      setTimeout(() => this.checkTextTruncated(), 50);
    }
  }

  @Input() reel: Reel;
  @Output() isExpended = new EventEmitter<boolean>();
  isDescriptionExpanded = false;
  descElement: ElementRef | undefined = undefined;
  isTruncated: boolean = false;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['reel']) {
      this.reel = changes['reel'].currentValue;
      this.checkTextTruncated();
    }
  }

  ngOnInit() {

  }

  toggleDescription(event: Event) {
    event.stopPropagation();
    if (this.isTruncated) {
      this.isDescriptionExpanded = !this.isDescriptionExpanded;
      this.isExpended.emit(this.isDescriptionExpanded);
    }
  }

  private checkTextTruncated() {

    if (!this.descElement) return;

    requestAnimationFrame(() => {
      const el = this.descElement.nativeElement;
      this.isTruncated = el.scrollHeight > el.clientHeight;
    });
  }

}
