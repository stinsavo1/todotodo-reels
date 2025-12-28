import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'
import { VerificationEmailComponent } from './verification-email.component';

const routes: Routes = [
  {
    path: '',
    component: VerificationEmailComponent
  },

]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class VerificationEmailRoutingModule {}
