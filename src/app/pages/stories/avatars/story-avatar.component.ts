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
  @Input() size = 56; // размер аватарки
  @Input() ringWidth = 4;
  @Input() gapDeg = 6; // угол gap между сегментами
  @Input() defaultColor = '#22307E';
  @Input() addStory = false;
  @Input() colors: string[] =  [
    '#22307e',
    '#243689',
    '#263c94',
    '#2a43a0',
    '#2c49ab',
    '#304fb6',
    '#3356c2',
    '#365ccc',
    '#3963d8',
    '#3c69e3'
  ];

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
        color: this.colors[0] || this.defaultColor
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
        color: this.colors[i % this.colors.length] || this.defaultColor
      });

      currentAngle = endAngle + gap;
    }
  }

  protected readonly open = open;
}
