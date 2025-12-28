import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { RegistrationPage } from './registration.page'

const routes: Routes = [
  {
    path: '',
    component: RegistrationPage
  },
  {
    path: 'auth',
    loadChildren: () =>
      import('../auth/auth.module').then(m => m.AuthPageModule)
  },
  {
    path: 'agreement',
    loadChildren: () =>
      import('../../pages/agreement/agreement.module').then(
        m => m.AgreementPageModule
      )
  }
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class RegistrationPageRoutingModule {}
