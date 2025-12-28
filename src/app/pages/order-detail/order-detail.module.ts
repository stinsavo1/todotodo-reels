import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { OrderDetailPageRoutingModule } from './order-detail-routing.module'

import { OrderDetailPage } from './order-detail.page'
import { SharedModule } from 'src/app/components/shared.module'
import { NgxIonicImageViewerModule } from "@herdwatch/ngx-ionic-image-viewer";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderDetailPageRoutingModule,
    SharedModule,
    NgxIonicImageViewerModule
  ],
  declarations: [OrderDetailPage]
})
export class OrderDetailPageModule {}
