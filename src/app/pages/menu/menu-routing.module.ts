import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { MenuPage } from './menu.page'
import { ContactsRoutingModule } from '../contacts/contacts-routing.module';
import { FinishRegistrationModule } from '../finish-registration/finish-registration.module';
import { ProfileCompletionGuard } from '../../guards/profile-completion.guard';

const routes: Routes = [
  {
    path: '',
    component: MenuPage,
  },
  {
    path: 'orders-in-progress',
    loadChildren: () =>
      import('../../pages/orders-in-progress/orders-in-progress.module').then(
        m => m.OrdersInProgressPageModule
      )
  },
  {
    path: 'subscription',
    loadChildren: () =>
      import('../../pages/subscription/subscription.module').then(
        m => m.SubscriptionPageModule
      )
  },
  {
    path: 'contacts',
    loadChildren: () =>
      import('../../pages/contacts/contacts.module').then(
        m => m.ContactsModule
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
    path: 'verification-email',
    loadChildren: () =>
      import('../../pages/verification-email/verification-email.module').then(
        (m) => m.VerificationEmailModule
      ),
  },
  {
    path: 'registration',
    loadChildren: () =>
      import('../../pages/registration/registration.module').then(
        m => m.RegistrationPageModule
      )
  },
  {
    path: 'verification-code',
    loadChildren: () =>
      import('../../pages/verification-code/verification-code.module').then(
        (m) => m.VerificationCodeModule
      ),
  },
  {
    path: 'verification-code-email',
    loadChildren: () =>
      import('../../pages/verification-code-email/verification-code-email.module').then(
        (m) => m.VerificationCodeEmailModule
      ),
  },
  {
    path: 'finish-registration',
    loadChildren: () =>
      import('../../pages/finish-registration/finish-registration.module').then(
        m => m.FinishRegistrationModule
      )
  },
  {
    path: 'faq',
    loadChildren: () =>
      import('../../pages/faq/faq.module').then(
        m => m.FaqModule
      )
  },
  {
    path: 'documents',
    loadChildren: () =>
      import('../../pages/documents/documents.module').then(
        m => m.DocumentsModule
      )
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MenuPageRoutingModule {}
