import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FeedbacksPage } from './feedbacks.page';
import { UserPageModule } from '../user/user.module';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FeedbacksRoutingModule } from './feedbacks-routing.module';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FeedbacksRoutingModule,
    UserPageModule,
    MatTableModule,
    MatIconModule,
    MatPaginatorModule,
    MatButtonModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    ImgEmptyModule
  ],
  declarations: [FeedbacksPage],
})
export class FeedbacksModule {
}
