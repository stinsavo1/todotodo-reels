import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { VerificationCodeComponent } from './verification-code.component';

const routes: Routes = [
  {
    path: ':phoneNumber',
    component: VerificationCodeComponent
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VerificationCodeRoutingModule {}
