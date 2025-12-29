import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { register } from 'swiper/element/bundle';
import { ReelsCommentsComponent } from './reels-comments/reels-comments.component';
import { ReelsCreateComponent } from './reels-create/reels-create.component';
import { ReelsPageComponent } from './reels-page/reels-page.component';
import { ReelsTabsComponent } from './reels-tabs/reels-tabs.component';

register();

const routes: Routes = [
  {path: '', component: ReelsPageComponent},
]

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [ReelsPageComponent,ReelsTabsComponent,ReelsCommentsComponent,ReelsCreateComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule,
    FormsModule
  ]
})
export class ReelsModule { }
