import { NgModule } from '@angular/core';
import { SharedModule } from '../../components/shared.module';
import { ProfileServicesComponent } from './profile-services.component';
import { ProfileServicesRoutingModule } from './profile-services-routing.module';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    ProfileServicesRoutingModule,
    SharedModule,
    AsyncPipe,
    IonicModule,
    NgForOf,
    NgIf
  ],
  declarations: [ProfileServicesComponent]
})
export class ProfileServicesModule {}
