import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { UsersPage } from './users.page';

const routes: Routes = [
  {
    path: '',
    component: UsersPage,
  },
  {
    path: 'user/:uid',
    loadChildren: () =>
      import('../../pagesAdmin/user/user.module').then((m) => m.UserPageModule),
  },
  {
    path: 'add-user',
    loadChildren: () =>
      import('../../pagesAdmin/add-user/add-user.module').then((m) => m.AddUserModule),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class UsersPageRoutingModule {}
