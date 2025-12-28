import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { MyProfileComponent } from './my-profile.component';
import { MyProfileRoutingModule } from './my-profile-routing.module';
import { SharedModule } from '../../components/shared.module';
import { PhotoComponent } from './photo/photo.component';
import { MatButton } from '@angular/material/button';
import { MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle } from '@angular/material/dialog';
import { FioComponent } from './fio/fio.component';
import { PhoneComponent } from './phone/phone.component';
import { RegionComponent } from './region/region.component';
import { AddressComponent } from './address/address.component';
import { AboutComponent } from './about/about.component';
import { NotificationPushComponent } from './notification-push/notification-push.component';
import { NameFactoryComponent } from './name-factory/name-factory.component';
import { WebsiteComponent } from './website/website.component';
import {RoleComponent} from "./role/role.component";
import { BranchesComponent } from "./branches/branches.component";
import { BranchesService } from "../../services/my-service/branches.service";

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    MyProfileRoutingModule,
    ReactiveFormsModule,
    SharedModule,
    MatButton,
    MatDialogContent,
    MatDialogActions,
    MatDialogTitle,
    MatDialogClose,
  ],
  declarations: [
    MyProfileComponent,
    PhotoComponent,
    FioComponent,
    BranchesComponent,
    NameFactoryComponent,
    WebsiteComponent,
    RegionComponent,
    PhoneComponent,
    AddressComponent,
    AboutComponent,
    RoleComponent,
    NotificationPushComponent
  ],
  providers: [BranchesService]
})
export class MyProfileModule {
}
