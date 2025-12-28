import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { OrderDetailPage } from './order-detail.page'

const routes: Routes = [
  {
    path: '',
    component: OrderDetailPage,
  },
  {
    path: 'report',
    loadChildren: () =>
      import('../../pages/report/report.module').then(m => m.ReportPageModule)
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class OrderDetailPageRoutingModule {}
