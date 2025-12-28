import { NgModule } from '@angular/core'
import { RouterModule, Routes } from '@angular/router'
import { TabsPage } from './tabs.page'
import { AdminGuard } from "../../guards/admin.guard";
import { LeadsStatisticsComponent } from "../new/leads-statistics/leads-statistics.component";

const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    canActivate: [AdminGuard],
    children: [
      {
        path: 'orders',
        loadChildren: () =>
          import('../orders/orders.module').then(m => m.OrdersPageModule)
      },
      {
        path: 'ad',
        loadChildren: () =>
          import('../ad/ad.module').then(m => m.AdModule)
      },
      {
        path: 'leads-statistics',
        component: LeadsStatisticsComponent
      },
      {
        path: 'users',
        loadChildren: () =>
          import('../users/users.module').then(m => m.UsersPageModule)
      },
      {
        path: 'feedbacks/:uid',
        loadChildren: () =>
          import('../feedbacks/feedbacks.module').then(m => m.FeedbacksModule)
      },
      {
        path: 'articles',
        loadChildren: () =>
          import('../articles/articles.module').then(
            m => m.ArticlesModule
          )
      },
      {
        path: 'my-profile',
        loadChildren: () =>
          import('../../pages/my-profile/my-profile.module').then(
            (m) => m.MyProfileModule
          ),
      },
      {
        path: '',
        redirectTo: '/admin/tabs/users',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('../auth/auth.module').then(m => m.AuthPageModule)
  },
  {
    path: '',
    redirectTo: '/admin/tabs/users',
    pathMatch: 'full'
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)]
})
export class TabsPageRoutingModule {}
