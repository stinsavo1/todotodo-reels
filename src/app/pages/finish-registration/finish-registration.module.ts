import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { IonicModule } from '@ionic/angular'
import { SharedModule } from 'src/app/components/shared.module'
import { FinishRegistrationComponent } from './finish-registration.component';
import { FinishRegistrationRoutingModule } from './finish-registration-routing.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    SharedModule,
    FinishRegistrationRoutingModule
  ],
  declarations: [FinishRegistrationComponent]
})
export class FinishRegistrationModule {
}
