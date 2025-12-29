import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { ProfileCompletionGuard } from './guards/profile-completion.guard';

const routes: Routes = [
  {
    path: 'on-boarding',
    loadChildren: () =>
      import('./pages/onboarding/onboarding.module').then(m => m.OnboardingModule)
  },
  {
    path: 'reels',
    loadChildren: () => import('./pages/reels/reels.module').then(
      m => m.ReelsModule
    )
  },
  {
    path: 'admin',
    loadChildren: () =>
      import('./pagesAdmin/tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'full-image',
    loadChildren: () =>
      import('./pages/full-image/full-image.module').then(
        m => m.FullImagePageModule
      )
  },
  {
    path: 'profile/:id/ratings',
    loadChildren: () =>
      import('./pages/profile/rating/rating.module').then(
        m => m.RatingModule
      )
  },
  {
    path: 'profile/:id/ratings/:watch',
    loadChildren: () =>
      import('./pages/profile/rating/rating.module').then(
        m => m.RatingModule
      ),
  },
  {
    path: 'feedback/:id/:orderId/:userType',
    loadChildren: () =>
      import('./pages/feedback-form/feedback-form.module').then(
        m => m.FeedbackFormModule
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'feedback/:id/:orderId/:userType/:type',
    loadChildren: () =>
      import('./pages/feedback-form/feedback-form.module').then(
        m => m.FeedbackFormModule
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'order-detail/:id',
    loadChildren: () =>
      import('./pages/order-detail/order-detail.module').then(
        m => m.OrderDetailPageModule
      )
  },
  {
    path: 'profile/:id/:role',
    loadChildren: () =>
      import('./pages/profile/profile.module').then(
        m => m.ProfilePageModule
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'profile-factory/:id',
    loadChildren: () =>
      import('./pages/profile-factory/profile-factory.module').then(
        m => m.ProfileFactoryModule,
      ),
    canActivate: [ProfileCompletionGuard, AuthGuard],
    data: { profileType: 'factory' }
  },
  {
    path: 'profile-users/:id',
    loadChildren: () =>
      import('./pages/profile-factory/profile-factory.module').then(
        m => m.ProfileFactoryModule,
      ),
    canActivate: [ProfileCompletionGuard, AuthGuard],
    data: { profileType: 'users' }
  },
  {
    path: 'profile-store/:id',
    loadChildren: () =>
      import('./pages/profile-factory/profile-factory.module').then(
        m => m.ProfileFactoryModule,
      ),
    canActivate: [ProfileCompletionGuard, AuthGuard],
    data: { profileType: 'store' }
  },
  {
    path: 'store-items/:id',
    loadChildren: () =>
      import('./pages/store/profile-store/profile-store.module').then(
        m => m.ProfileStoreModule,
      ),
    canActivate: [ProfileCompletionGuard],
  },
  {
    path: 'product-details/:id',
    loadChildren: () =>
      import('./pages/store/profile-store-detail/profile-store-detail.module').then(
        m => m.ProfileStoreDetailModule,
      ),
    canActivate: [ProfileCompletionGuard],
  },
  {
    path: 'profile-agency/:id',
    loadChildren: () =>
      import('./pages/profile-factory/profile-factory.module').then(
        m => m.ProfileFactoryModule,
      ),
    canActivate: [ProfileCompletionGuard, AuthGuard],
    data: { profileType: 'agency' }
  },
  {
    path: 'profile-services/:id',
    loadChildren: () =>
      import('./pages/profile-factory/profile-factory.module').then(
        m => m.ProfileFactoryModule
      ),
    data: { profileType: 'services' },
    canActivate: [ProfileCompletionGuard, AuthGuard]
  },
  {
    path: 'new-order',
    loadChildren: () =>
      import('./pages/new-order/new-order.module').then(
        m => m.NewOrderPageModule
      )
  },
  {
    path: 'store',
    loadChildren: () =>
      import('./pages/store/store.module').then(
        m => m.StoreModule
      )
  },
  {
    path: '',
    loadChildren: () =>
      import('./pages/tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [AuthGuard]
  },

  {
    path: '**',
    redirectTo: '/tabs/map',
    pathMatch: 'full',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
