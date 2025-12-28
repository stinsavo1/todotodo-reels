import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { VerificationCodeEmailComponent } from './verification-code-email.component';

const routes: Routes = [
  {
    path: ':phoneNumber',
    component: VerificationCodeEmailComponent
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VerificationCodeEmailRoutingModule {}
