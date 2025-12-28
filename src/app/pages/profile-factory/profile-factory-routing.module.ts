import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileFactoryComponent } from './profile-factory.component';

const routes: Routes = [
  {
    path: '',
    component: ProfileFactoryComponent
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileFactoryRoutingModule {}
