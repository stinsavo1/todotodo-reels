import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { MapPage } from './map.page';
import { FinishRegistrationModule } from '../finish-registration/finish-registration.module';
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

const routes: Routes = [
  {
    path: '',
    component: MapPage,
  },
  {
    path: 'new-order',
    loadChildren: () =>
      import('../../pages/new-order/new-order.module').then(
        (m) => m.NewOrderPageModule
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'store',
    loadChildren: () =>
      import('../../pages/store/store.module').then(
        (m) => m.StoreModule
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'registration',
    loadChildren: () =>
      import('../../pages/registration/registration.module').then(
        (m) => m.RegistrationPageModule
      ),
  },
  {
    path: 'finish-registration',
    loadChildren: () =>
      import('../../pages/finish-registration/finish-registration.module').then(
        (m) => m.FinishRegistrationModule
      ),
  },
  {
    path: 'subscription',
    loadChildren: () =>
      import('../../pages/subscription/subscription.module').then(
        (m) => m.SubscriptionPageModule
      ),
  },
  {
    path: 'order-detail/:id',
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
export class MapPageRoutingModule {}
