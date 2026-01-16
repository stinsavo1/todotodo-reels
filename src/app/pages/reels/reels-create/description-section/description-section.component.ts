import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { MAX_SIZE_COMMENT } from '../../interfaces/reels.interface';

@Component({
  selector: 'app-description-section',
  templateUrl: './description-section.component.html',
  styleUrls: ['./description-section.component.scss'],
  standalone:false
})
export class DescriptionSectionComponent  implements OnInit {
  @Input({ required: true }) control!: FormControl<string>;
  wordCount = 0;
  private readonly destroyRef = inject(DestroyRef);
  protected readonly MAX_SIZE_COMMENT = MAX_SIZE_COMMENT;
  constructor() { }

  ngOnInit() {
    this.wordCount = this.control.value?.length ?? 0;
    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      this.wordCount = value?.length ?? 0;
    });
  }


}
