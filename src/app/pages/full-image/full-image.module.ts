import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { FullImagePageRoutingModule } from './full-image-routing.module';

import { FullImagePage } from './full-image.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FullImagePageRoutingModule
  ],
  declarations: [FullImagePage]
})
export class FullImagePageModule {}
