import { NgModule } from '@angular/core';
import { SharedModule } from '../../../components/shared.module';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ProfileStoreDetailComponent } from "./profile-store-detail.component";
import { ProfileStoreDetailRoutingModule } from "./profile-store-detail-routing.module";

@NgModule({
  imports: [
    ProfileStoreDetailRoutingModule,
    SharedModule,
    IonicModule,
    AsyncPipe,
    IonicModule,
    NgForOf,
    NgIf
  ],
  declarations: [ProfileStoreDetailComponent]
})
export class ProfileStoreDetailModule {}
