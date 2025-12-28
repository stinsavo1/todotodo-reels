import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OrdersInProgressPage } from './orders-in-progress.page';

const routes: Routes = [
  {
    path: '',
    component: OrdersInProgressPage,
  },
  {
    path: 'order/:id',
    loadChildren: () =>
      import('../../pages/order-detail/order-detail.module').then(
        (m) => m.OrderDetailPageModule
      ),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrdersInProgressPageRoutingModule {}
