import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'

import { IonicModule } from '@ionic/angular'

import { OrderPageRoutingModule } from './order-routing.module'

import { OrderPage } from './order.page'
import { SharedModule } from 'src/app/components/shared.module'

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    OrderPageRoutingModule,
    SharedModule
  ],
  declarations: [OrderPage]
})
export class OrderPageModule {}
