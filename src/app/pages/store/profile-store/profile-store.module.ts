import { NgModule } from '@angular/core';
import { SharedModule } from '../../../components/shared.module';
import { ProfileStoreComponent } from './profile-store.component';
import { ProfileStoreRoutingModule } from './profile-store-routing.module';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    ProfileStoreRoutingModule,
    SharedModule,
    AsyncPipe,
    IonicModule,
    NgForOf,
    NgIf
  ],
  declarations: [ProfileStoreComponent]
})
export class ProfileStoreModule {}
