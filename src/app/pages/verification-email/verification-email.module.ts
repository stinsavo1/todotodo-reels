import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'
import { VerificationEmailComponent } from './verification-email.component';
import { VerificationEmailRoutingModule } from './verification-email-routing.module';
import { ImgEmptyModule } from '../../directives/img-empty/img-empty.module';
import { IonicModule } from '@ionic/angular';
import { SharedModule } from '../../components/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    VerificationEmailRoutingModule,
    ImgEmptyModule,
    IonicModule,
    ReactiveFormsModule,
    SharedModule
  ],
  declarations: [VerificationEmailComponent]
})
export class VerificationEmailModule {
}
