import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { OrdersInProgressPageRoutingModule } from './orders-in-progress-routing.module'

import { OrdersInProgressPage } from './orders-in-progress.page'
import { SharedModule } from 'src/app/components/shared.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrdersInProgressPageRoutingModule,
    SharedModule
  ],
  declarations: [OrdersInProgressPage]
})
export class OrdersInProgressPageModule {}
