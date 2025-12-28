import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { FinishRegistrationComponent } from './finish-registration.component';

const routes: Routes = [
  {
    path: '',
    component: FinishRegistrationComponent
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class FinishRegistrationRoutingModule {}
