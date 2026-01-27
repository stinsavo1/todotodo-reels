import {Component, Input, OnChanges, SimpleChanges} from '@angular/core';
import { IonAvatar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import {NavController} from "@ionic/angular";

@Component({
  selector: 'app-story-avatar',
  templateUrl: './story-avatar.component.html',
  imports: [CommonModule, IonAvatar],
  styleUrls: ['./story-avatar.component.scss']
})
export class StoryAvatarComponent implements OnChanges {
  @Input() avatarUrl?: string;
  @Input() storyCount = 1;
  @Input() gapDeg = 6;
  @Input() defaultColor = '#0077FF';
  @Input() addStory = false;

  public size = 66;
  public ringWidth = 3;

  segments: { path: string; color: string }[] = [];

  constructor(private navCtrl: NavController) {}

  // радиус кольца вокруг аватарки
  get radius() {
    const gap = 4; // px между аватаркой и кольцом
    return this.size / 2 + this.ringWidth / 2 + gap;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['storyCount'] || changes['gapDeg'] || changes['size']) {
      this.updateSegments();
    }
  }

  public async openCamera() {
    this.navCtrl.navigateForward('/new-story')
  }

  private updateSegments(): void {
    this.segments = [];

    if (this.storyCount <= 0) return;

    if (this.storyCount === 1) {
      // Одна история — полный круг
      this.segments.push({
        path: '', // для <circle> path не нужен
        color: this.defaultColor
      });
      return;
    }

    // Для двух и более историй — сегменты с gap
    const totalDegrees = 360;
    const gap = this.gapDeg;
    const totalGap = this.storyCount * gap;
    const segmentDegrees = (totalDegrees - totalGap) / this.storyCount;

    if (segmentDegrees <= 0) {
      console.warn('Слишком большой gapDeg для такого количества историй');
      return;
    }

    let currentAngle = -90 + gap / 2; // старт сверху, gap/2

    for (let i = 0; i < this.storyCount; i++) {
      const startAngle = currentAngle;
      const endAngle = startAngle + segmentDegrees;

      const startX = 50 + this.radius * Math.cos((startAngle * Math.PI) / 180);
      const startY = 50 + this.radius * Math.sin((startAngle * Math.PI) / 180);
      const endX = 50 + this.radius * Math.cos((endAngle * Math.PI) / 180);
      const endY = 50 + this.radius * Math.sin((endAngle * Math.PI) / 180);

      const largeArcFlag = segmentDegrees > 180 ? 1 : 0;
      const pathData = `M ${startX} ${startY} A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${endX} ${endY}`;

      this.segments.push({
        path: pathData,
        color: this.defaultColor
      });

      currentAngle = endAngle + gap;
    }
  }
}
