import { NgModule } from '@angular/core'
import { PreloadAllModules, RouterModule, Routes } from '@angular/router'
import { ProfileCompletionGuard } from './guards/profile-completion.guard';
import { AuthGuard } from './guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/main/main.component').then(m => m.MainComponent),
  },
  {
    path: 'map',
    loadChildren: () =>
      import('./pages/map/map.module').then((m) => m.MapPageModule),
  },
  {
    path: 'addresses/new-chat/:id/:isManager',
    loadComponent: () => import('./pages/new/new-chat/new-chat.component').then(m => m.NewChatComponent),
  },
  {
    path: 'addresses/order-chats/:id/:segment/:isManager',
    loadComponent: () => import('./pages/new/order-chat-list/order-chat-list.component').then(m => m.OrderChatListComponent),
  },
  {
    path: 'reels',
    loadChildren: () => import('./pages/reels/reels.module').then(
      m => m.ReelsModule
    )
  },
  {
    path: 'notifications',
    loadChildren: () =>
      import('./pages/notifications/notifications.module').then(
        (m) => m.NotificationsPageModule,
      ),
    canActivate: [ProfileCompletionGuard]
  },
  {
    path: 'subscription',
    loadChildren: () =>
      import('./pages/subscription/subscription.module').then(
        (m) => m.SubscriptionPageModule
      ),
  },
  {
    path: 'registration',
    loadChildren: () =>
      import('./pages/registration/registration.module').then(
        (m) => m.RegistrationPageModule
      ),
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('./pages/auth/auth.module').then(
        (m) => m.AuthPageModule
      ),
  },
  {
    path: 'orders-in-progress',
    loadChildren: () =>
      import('./pages/orders-in-progress/orders-in-progress.module').then(
        m => m.OrdersInProgressPageModule
      )
  },
  {
    path: 'contacts',
    loadChildren: () =>
      import('./pages/contacts/contacts.module').then(
        m => m.ContactsModule
      )
  },
  {
    path: 'my-profile',
    loadChildren: () =>
      import('./pages/my-profile/my-profile.module').then(
        (m) => m.MyProfileModule
      ),
  },
  {
    path: 'registration/:referral/:email',
    loadChildren: () =>
      import('./pages/registration/registration.module').then(
        m => m.RegistrationPageModule
      )
  },
  {
    path: 'verification-code',
    loadChildren: () =>
      import('./pages/verification-code/verification-code.module').then(
        (m) => m.VerificationCodeModule
      ),
  },
  {
    path: 'verification-code-email',
    loadChildren: () =>
      import('./pages/verification-code-email/verification-code-email.module').then(
        (m) => m.VerificationCodeEmailModule
      ),
  },
  {
    path: 'faq',
    loadChildren: () =>
      import('./pages/faq/faq.module').then(
        m => m.FaqModule
      )
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('./pages/documents/documents.module').then(
        m => m.DocumentsModule
      )
  },
  // {
  //   path: 'map',
  //   loadChildren: () =>
  //     import('./pages.module').then(m => m.TabsPageModule),
  //   canActivate: [AuthGuard]
  // },
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
      )
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
  // {
  //   path: '**',
  //   redirectTo: '/map',
  //   pathMatch: 'full',
  // },
]
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
