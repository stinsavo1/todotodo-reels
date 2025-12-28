import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileServicesComponent } from './profile-services.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileServicesComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileServicesRoutingModule {}
