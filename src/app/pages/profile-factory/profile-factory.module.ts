import { NgModule } from '@angular/core';
import { SharedModule } from '../../components/shared.module';
import { ProfileFactoryComponent } from './profile-factory.component';
import { ProfileFactoryRoutingModule } from './profile-factory-routing.module';
import { AsyncPipe, NgForOf, NgIf } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@NgModule({
  imports: [
    ProfileFactoryRoutingModule,
    SharedModule,
    AsyncPipe,
    IonicModule,
    NgForOf,
    NgIf
  ],
  declarations: [ProfileFactoryComponent]
})
export class ProfileFactoryModule {}
