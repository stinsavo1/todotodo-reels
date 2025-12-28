import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RatingPage } from './rating.page';
import { RatingRoutingModule } from './rating-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RatingRoutingModule
  ],
  declarations: [RatingPage]
})
export class RatingModule {}
