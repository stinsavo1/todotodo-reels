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
  constructor(private modalCtrl:ModalController) { }

  ngOnInit() {
    this.wordCount = this.control.value?.length ?? 0;

    this.control.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(value => {
      console.log('value',value);
      this.wordCount = value?.length ?? 0;
    });
  }

  protected readonly MAX_SIZE_COMMENT = MAX_SIZE_COMMENT;

  // async onFocus() {
  //   if (window.innerWidth>1280) {
  //     return
  //   }
  //   const modal = await this.modalCtrl.getTop();
  //   await modal?.setCurrentBreakpoint(1);
  // }
}
