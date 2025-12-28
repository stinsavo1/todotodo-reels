import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { OrdersPage } from './orders.page'

const routes: Routes = [
  {
    path: '',
    component: OrdersPage
  },
  {
    path: 'order/:id',
    loadChildren: () =>
      import('../order/order.module').then(m => m.OrderPageModule)
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrdersPageRoutingModule {}
