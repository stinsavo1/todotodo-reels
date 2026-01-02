import { Component, DestroyRef, inject, Input, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ModalController } from '@ionic/angular';
import { Reel } from '../interfaces/reels.interface';
import { UsersPreferencesService } from '../services/users-preferences.service';

@Component({
  selector: 'app-hide-detail-modal',
  templateUrl: './hide-detail-modal.component.html',
  styleUrls: ['./hide-detail-modal.component.scss'],
  standalone:false
})
export class HideDetailModalComponent  implements OnInit {
  @Input() video: Reel;
  public selectedType: 'video'|'author';
  private readonly destroyRef = inject(DestroyRef);
  constructor(private modalCtrl: ModalController,private usersPreferencesService:UsersPreferencesService) { }

  ngOnInit() {}

  onSelectionChange() {
      const targetId = this.selectedType === 'video' ? this.video.id : this.video.userId;
      this.usersPreferencesService.hideContent( this.selectedType,targetId).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(()=>{
        this.modalCtrl.dismiss({'isReady':true, id:targetId, type:this.selectedType}).then();
        this.selectedType = null;
      });

  }



  public close(): void {
    this.modalCtrl.dismiss().then();
  }
}
