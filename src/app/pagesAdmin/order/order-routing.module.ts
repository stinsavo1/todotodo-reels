import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { OrderPage } from './order.page'
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

const routes: Routes = [
  {
    path: '',
    component: OrderPage
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderPageRoutingModule {}
