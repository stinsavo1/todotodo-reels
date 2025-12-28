import { NgModule } from '@angular/core'
import { Routes, RouterModule } from '@angular/router'

import { MyProfileComponent } from './my-profile.component';
import { PhotoComponent } from './photo/photo.component';
import { PhoneComponent } from './phone/phone.component';
import { FioComponent } from './fio/fio.component';
import { RegionComponent } from './region/region.component';
import { AddressComponent } from './address/address.component';
import { AboutComponent } from './about/about.component';
import { NotificationPushComponent } from './notification-push/notification-push.component';
import { NameFactoryComponent } from './name-factory/name-factory.component';
import { WebsiteComponent } from './website/website.component';
import {RoleComponent} from "./role/role.component";
import { BranchesComponent } from "./branches/branches.component";

const routes: Routes = [
  {
    path: '',
    component: MyProfileComponent
  },
  {
    path: 'photo',
    component: PhotoComponent
  },
  {
    path: 'fio',
    component: FioComponent
  },
  {
    path: 'branches',
    component: BranchesComponent,
  },
  {
    path: 'role',
    component: RoleComponent
  },
  {
    path: 'name-factory',
    component: NameFactoryComponent
  },
  {
    path: 'website',
    component: WebsiteComponent
  },
  {
    path: 'phone',
    component: PhoneComponent
  },
  {
    path: 'region',
    component: RegionComponent
  },
  {
    path: 'address',
    component: AddressComponent
  },
  {
    path: 'about',
    component: AboutComponent
  },
  {
    path: 'notification-push',
    component: NotificationPushComponent
  },
]

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyProfileRoutingModule {}
