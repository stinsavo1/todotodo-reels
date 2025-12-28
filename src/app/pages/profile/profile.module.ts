import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule,
    ImgEmptyModule,
    SharedModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
