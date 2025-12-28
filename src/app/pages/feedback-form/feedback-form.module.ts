import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FeedbackFormComponent } from './feedback-form.component';
import { FeedbackRoutingModule } from './feedback-routing.module';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';
import { IonicModule } from '@ionic/angular';
import { MatDatepicker, MatDatepickerInput } from '@angular/material/datepicker';
import { MatInput } from '@angular/material/input';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FeedbackRoutingModule,
    ImgEmptyModule,
    IonicModule,
    MatDatepicker,
    MatDatepickerInput,
    MatInput,
    ReactiveFormsModule,
    SharedModule,
    FormsModule,
  ],
  declarations: [FeedbackFormComponent]
})
export class FeedbackFormModule {}
