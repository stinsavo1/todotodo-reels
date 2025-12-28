import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ProfileStoreComponent } from './profile-store.component';
import { ProfileStoreDetailComponent } from "../profile-store-detail/profile-store-detail.component";

const routes: Routes = [
  {
    path: '',
    component: ProfileStoreComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProfileStoreRoutingModule {}
