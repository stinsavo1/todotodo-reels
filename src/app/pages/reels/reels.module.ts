import { CdkFixedSizeVirtualScroll, CdkVirtualForOf, CdkVirtualScrollViewport } from '@angular/cdk/scrolling';
import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HideDetailModalComponent } from './hide-detail-modal/hide-detail-modal.component';
import { DeclensionPipe } from './pipes/declension.pipe';
import { ReelsActionsComponent } from './reels-actions/reels-actions.component';
import { ReelsAdditionalActionsComponent } from './reels-additional-actions/reels-additional-actions.component';
import { ReelsCommentsComponent } from './reels-comments/reels-comments.component';
import { ReelsCreateComponent } from './reels-create/reels-create.component';
import { ReelsDescriptionComponent } from './reels-description/reels-description.component';
import { ReelsPageComponent } from './reels-page/reels-page.component';
import { ReelsReportModalComponent } from './reels-report-modal/reels-report-modal.component';
import { ReelsTabsComponent } from './reels-tabs/reels-tabs.component';
import SwiperCore from 'swiper';
import { Virtual } from 'swiper/modules';

SwiperCore.use([Virtual]);

const routes: Routes = [
  { path: '', component: ReelsPageComponent },
];

@NgModule({
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  declarations: [
    ReelsPageComponent,
    ReelsActionsComponent,
    ReelsReportModalComponent,
    ReelsTabsComponent,
    ReelsCommentsComponent,
    ReelsCreateComponent,
    HideDetailModalComponent,
    ReelsDescriptionComponent,
    ReelsAdditionalActionsComponent],
  imports: [
    CommonModule,
    RouterModule.forChild(routes),
    IonicModule,
    FormsModule,
    ReactiveFormsModule,
    DeclensionPipe,
    CdkFixedSizeVirtualScroll,
    CdkVirtualForOf,
    CdkVirtualScrollViewport
  ]
})
export class ReelsModule {
}
